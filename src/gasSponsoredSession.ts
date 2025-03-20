import { Signature, AccountInterface, Call, TypedData, hash } from "starknet";
import {
    GasSponsoredSessionSignatureRequest,
    GasSponsoredSessionTransactionRequest,
} from "./types";
import { GS_SESSION_REQUEST_TYPES } from "./typedDataConsts";
import { getCalldata } from "./utils";
import { GS_SESSION_REQUEST_TYPES_V2 } from "./typedDataConstsV2";

const getGasSponsoredSessionRequestTypedData = (
    request: GasSponsoredSessionSignatureRequest,
    chainId: string | number,
    version: "v1" | "v2" = "v1"
): TypedData => {
    return {
        types: version === "v1" ? GS_SESSION_REQUEST_TYPES : GS_SESSION_REQUEST_TYPES_V2,
        primaryType: "GasSponsoredSessionExecution",
        domain: {
            name: "Account.execute_gs_session",
            version: version === "v1" ? "2" : "3",
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

const signGasSponsoredSessionRequest = async (
    account: AccountInterface,
    request: GasSponsoredSessionSignatureRequest,
    version: "v1" | "v2" = "v1"
): Promise<Signature> => {
    const chainId = await account.getChainId();
    const typedDataSessionRequest = getGasSponsoredSessionRequestTypedData(
        request,
        chainId,
        version
    );

    const signature = await account.signMessage(typedDataSessionRequest);
    return signature;
};

const getGasSponsoredSessionTx = async (
    request: GasSponsoredSessionTransactionRequest,
    version: "v1" | "v2" = "v1"
): Promise<Call> => {
    const gsSessionTx = {
        contractAddress: request.sessionAccountAddress,
        entrypoint:
            version === "v1"
                ? "execute_gas_sponsored_session_tx"
                : "execute_gas_sponsored_session_tx_v2",
        calldata: getCalldata(request, version),
    };
    return gsSessionTx;
};

export {
    signGasSponsoredSessionRequest,
    getGasSponsoredSessionTx,
    getGasSponsoredSessionRequestTypedData,
};
