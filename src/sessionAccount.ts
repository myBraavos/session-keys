import {
    AccountInterface,
    Call,
    TypedData,
    hash,
    stark,
    Account,
    Abi,
    AllowArray,
    CairoVersion,
    InvokeFunctionResponse,
    ProviderInterface,
    ProviderOptions,
    SignerInterface,
    UniversalDetails,
    EstimateFee,
} from "starknet";
import { SessionAccountRequest, SessionInfo, SessionSignatureRequest } from "./types";
import { getStarkKey, utils } from "micro-starknet";
import { ETransactionVersion } from "starknet-types";
import { Buffer } from "buffer";
import { SESSION_REQUEST_TYPES } from "./typedDataConsts";
import {
    getAllowedMethodCalldata,
    getSpendingLimitCalldata,
    getAllowedMethodHintsCalldata,
    getCallDataValidationCalldata,
} from "./utils";
import { SESSION_REQUEST_TYPES_V2 } from "./typedDataConstsV2";

const getSessionRequestTypedData = (
    request: SessionSignatureRequest,
    chainId: string | number,
    version: "v1" | "v2" = "v2"
): TypedData => {
    return {
        types: version === "v1" ? SESSION_REQUEST_TYPES : SESSION_REQUEST_TYPES_V2,
        primaryType: "SessionExecution",
        domain: {
            name: "Account.execute_session",
            version: version === "v1" ? "2" : "3",
            chainId: chainId,
            revision: "1",
        },
        message: {
            "Owner Public Key": request.ownerPubKey,
            "Execute After": request.executeAfter.getTime(),
            "Execute Before": request.executeBefore.getTime(),
            "STRK Gas Limit": request.strkGasLimit,
            "Allowed Methods": request.requestedMethods.map(method => {
                return {
                    "Contract Address": method.contractAddress,
                    Selector: hash.getSelectorFromName(method.entrypoint),
                    ...(version === "v2" &&
                        method.calldataValidations && {
                            "Calldata Validations": method.calldataValidations.map(
                                validation => {
                                    return {
                                        "Validation Type": validation.validationType,
                                        Offset: validation.offset,
                                        Value: validation.value,
                                    };
                                }
                            ),
                        }),
                };
            }),
            "Spending Limits": request.spendingLimits.map(limit => {
                return {
                    token_address: limit.tokenAddress,
                    amount: limit.amount,
                };
            }),
        },
    };
};

class SessionAccount extends Account {
    sessionRequest: SessionInfo;
    sessionKeyVersion: "v1" | "v2";

    constructor(
        sessionRequest: SessionInfo,
        providerOrOptions: ProviderOptions | ProviderInterface,
        address: string,
        pkOrSigner: Uint8Array | string | SignerInterface,
        sessionKeyVersion?: "v1" | "v2",
        cairoVersion?: CairoVersion
    ) {
        super(
            providerOrOptions,
            address,
            pkOrSigner,
            cairoVersion,
            ETransactionVersion.V3
        );
        this.sessionRequest = sessionRequest;
        this.sessionKeyVersion = sessionKeyVersion || "v1";
    }

    private getSessionCalls(transactions: AllowArray<Call>): AllowArray<Call> {
        const sigArray = stark.formatSignature(this.sessionRequest.sessionSignature);
        const calls = Array.isArray(transactions) ? transactions : [transactions];
        const sessionExecuteCall: Call = {
            contractAddress: this.address,
            entrypoint: "session_execute",
            calldata: [
                this.sessionRequest.ownerPubKey,
                this.sessionRequest.executeAfter.getTime(),
                this.sessionRequest.executeBefore.getTime(),
                ...getAllowedMethodCalldata(this.sessionRequest.requestedMethods),
                this.sessionRequest.strkGasLimit,
                ...getSpendingLimitCalldata(this.sessionRequest.spendingLimits),
                ...(this.sessionKeyVersion === "v2"
                    ? getCallDataValidationCalldata(this.sessionRequest.requestedMethods)
                    : []),
                ...getAllowedMethodHintsCalldata(
                    this.sessionRequest.requestedMethods,
                    calls
                ),
                sigArray.length,
                ...sigArray,
            ],
        };
        return [sessionExecuteCall, ...calls];
    }

    execute(
        transactions: AllowArray<Call>,
        abis?: Abi[] | undefined,
        details?: UniversalDetails
    ): Promise<InvokeFunctionResponse> {
        const sessionCalls = this.getSessionCalls(transactions);
        return super.execute(sessionCalls, abis, { ...details });
    }

    estimateInvokeFee(
        calls: AllowArray<Call>,
        details?: UniversalDetails
    ): Promise<EstimateFee> {
        return super.estimateInvokeFee(calls, { ...details, skipValidate: false });
    }
}

const requestSessionAccount = async (
    provider: ProviderInterface,
    account: AccountInterface,
    request: SessionAccountRequest,
    sessionKeyVersion: "v1" | "v2" = "v1"
): Promise<SessionAccount> => {
    const chainId = await account.getChainId();
    const sessionPrivateKey =
        "0x" + Buffer.from(utils.randomPrivateKey()).toString("hex");
    const sessionPublicKey = getStarkKey(sessionPrivateKey);
    const sessionTypedDataRequest = {
        sessionAccountAddress: account.address,
        ownerPubKey: sessionPublicKey,
        ...request,
    };
    const typedDataSessionRequest = getSessionRequestTypedData(
        sessionTypedDataRequest,
        chainId,
        sessionKeyVersion
    );
    const signature = await account.signMessage(typedDataSessionRequest);

    const sessionAccount = new SessionAccount(
        { ...sessionTypedDataRequest, sessionSignature: signature },
        provider,
        account.address,
        sessionPrivateKey,
        sessionKeyVersion
    );
    return sessionAccount;
};

export { requestSessionAccount, getSessionRequestTypedData };
