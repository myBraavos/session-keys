import {
    Signature,
    AccountInterface,
    Call,
    TypedData,
    hash,
    RawArgs,
    typedData,
    transaction,
    RawArgsArray,
    stark,
    selector,
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
import {
    GasSponsoredSessionSignatureRequest,
    GasSponsoredSessionTransactionRequest,
    RequestedMethod,
    SessionAccountRequest,
    SessionInfo,
    SessionSignatureRequest,
    SpendingLimit,
} from "./types";
import { getStarkKey, utils } from "micro-starknet";
import { ETransactionVersion } from "starknet-types";
import { Buffer } from "buffer";

const DOMAIN_TYPE = {
    StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
    ],
};

const ALLOWED_METHOD_TYPE = {
    AllowedMethod: [
        {
            name: "Contract Address",
            type: "ContractAddress",
        },
        {
            name: "Selector",
            type: "selector",
        },
    ],
};

const GS_SESSION_REQUEST_TYPES = {
    GasSponsoredSessionExecution: [
        {
            name: "Caller",
            type: "ContractAddress",
        },
        {
            name: "Execute After",
            type: "timestamp",
        },
        {
            name: "Execute Before",
            type: "timestamp",
        },
        {
            name: "Allowed Methods",
            type: "AllowedMethod*",
        },
        {
            name: "Spending Limits",
            type: "TokenAmount*",
        },
    ],
    ...ALLOWED_METHOD_TYPE,
    ...DOMAIN_TYPE,
};

const SESSION_REQUEST_TYPES = {
    SessionExecution: [
        {
            name: "Owner Public Key",
            type: "felt",
        },
        {
            name: "Execute After",
            type: "timestamp",
        },
        {
            name: "Execute Before",
            type: "timestamp",
        },
        {
            name: "STRK Gas Limit",
            type: "u128",
        },
        {
            name: "Allowed Methods",
            type: "AllowedMethod*",
        },
        {
            name: "Spending Limits",
            type: "TokenAmount*",
        },
    ],
    ...ALLOWED_METHOD_TYPE,
    ...DOMAIN_TYPE,
};

const getSessionRequestTypedData = (
    request: SessionSignatureRequest,
    chainId: string | number
): TypedData => {
    return {
        types: SESSION_REQUEST_TYPES,
        primaryType: "SessionExecution",
        domain: {
            name: "Account.execute_session",
            version: "2",
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

    constructor(
        sessionRequest: SessionInfo,
        providerOrOptions: ProviderOptions | ProviderInterface,
        address: string,
        pkOrSigner: Uint8Array | string | SignerInterface,
        cairoVersion?: CairoVersion,
) {
        super(providerOrOptions, address, pkOrSigner, cairoVersion, ETransactionVersion.V3);
        this.sessionRequest = sessionRequest;
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
    request: SessionAccountRequest
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
        chainId
    );
    const signature = await account.signMessage(typedDataSessionRequest);

    const sessionAccount = new SessionAccount(
        { ...sessionTypedDataRequest, sessionSignature: signature },
        provider,
        account.address,
        sessionPrivateKey
    );
    return sessionAccount;
};

const getGasSponsoredSessionRequestTypedData = (
    request: GasSponsoredSessionSignatureRequest,
    chainId: string | number
): TypedData => {
    return {
        types: GS_SESSION_REQUEST_TYPES,
        primaryType: "GasSponsoredSessionExecution",
        domain: {
            name: "Account.execute_gs_session",
            version: "2",
            chainId: chainId,
            revision: "1",
        },
        message: {
            Caller: request.callerAddress,
            "Execute After": request.executeAfter.getTime(),
            "Execute Before": request.executeBefore.getTime(),
            "Allowed Methods": request.requestedMethods.map(method => {
                return {
                    "Contract Address": method.contractAddress,
                    Selector: hash.getSelectorFromName(method.entrypoint),
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

const signGasSponsoredSessionRequest = async (
    account: AccountInterface,
    request: GasSponsoredSessionSignatureRequest
): Promise<Signature> => {
    const chainId = await account.getChainId();
    const typedDataSessionRequest = getGasSponsoredSessionRequestTypedData(
        request,
        chainId
    );

    const signature = await account.signMessage(typedDataSessionRequest);
    return signature;
};

const ALLOWED_METHOD_HASH = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES,
    "AllowedMethod",
    typedData.TypedDataRevision.Active
);

const getRequestedMethodGuid = (requestedMethod: RequestedMethod): string =>
    hash.computePoseidonHashOnElements([
        ALLOWED_METHOD_HASH,
        requestedMethod.contractAddress,
        selector.getSelectorFromName(requestedMethod.entrypoint),
    ]);

const getAllowedMethodCalldata = (requestedMethods: RequestedMethod[]): RawArgsArray => {
    return [
        requestedMethods.length,
        ...requestedMethods.map(method => getRequestedMethodGuid(method)),
    ];
};

const getAllowedMethodHintsCalldata = (
    requestedMethods: RequestedMethod[],
    calls: Call[]
): RawArgsArray => {
    return [
        calls.length,
        ...calls.map(call =>
            requestedMethods.findIndex(
                rm => rm.contractAddress === call.contractAddress && rm.entrypoint === call.entrypoint
            )
        ),
    ];
};

const getSpendingLimitCalldata = (spendingLimits: SpendingLimit[]): RawArgsArray => {
    return [
        spendingLimits.length,
        ...spendingLimits.flatMap(limit => {
            return [limit.tokenAddress, limit.amount.low, limit.amount.high];
        }),
    ];
};

const getCalls = (calls: Call[]): string[] => {
    return transaction.fromCallsToExecuteCalldata_cairo1(calls);
};

const getCalldata = (request: GasSponsoredSessionTransactionRequest): RawArgs => {
    const sigArray = stark.formatSignature(request.gsSessionSignature);
    return [
        request.executeAfter.getTime(),
        request.executeBefore.getTime(),
        ...getAllowedMethodCalldata(request.requestedMethods),
        ...getSpendingLimitCalldata(request.spendingLimits),
        ...getCalls(request.calls),
        ...getAllowedMethodHintsCalldata(request.requestedMethods, request.calls),
        sigArray.length,
        ...sigArray,
    ];
};

const getGasSponsoredSessionTx = async (
    request: GasSponsoredSessionTransactionRequest
): Promise<Call> => {
    const gsSessionTx = {
        contractAddress: request.sessionAccountAddress,
        entrypoint: "execute_gas_sponsored_session_tx",
        calldata: getCalldata(request),
    };
    return gsSessionTx;
};

export {
    signGasSponsoredSessionRequest,
    getGasSponsoredSessionTx,
    requestSessionAccount,
};
