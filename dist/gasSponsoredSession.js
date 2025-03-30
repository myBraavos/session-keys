"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGasSponsoredSessionRequestTypedData = exports.getGasSponsoredSessionTx = exports.signGasSponsoredSessionRequest = void 0;
const starknet_1 = require("starknet");
const typedDataConsts_1 = require("./typedDataConsts");
const utils_1 = require("./utils");
const typedDataConstsV2_1 = require("./typedDataConstsV2");
const getGasSponsoredSessionRequestTypedData = (request, chainId, version = "v1") => {
    return {
        types: version === "v1" ? typedDataConsts_1.GS_SESSION_REQUEST_TYPES : typedDataConstsV2_1.GS_SESSION_REQUEST_TYPES_V2,
        primaryType: "GasSponsoredSessionExecution",
        domain: {
            name: "Account.execute_gs_session",
            version: version === "v1" ? "2" : "3",
            chainId: chainId,
            revision: "1",
        },
        message: {
            Caller: request.callerAddress,
            "Execute After": Math.round(request.executeAfter.getTime() / 1000),
            "Execute Before": Math.round(request.executeBefore.getTime() / 1000),
            "Allowed Methods": request.requestedMethods.map(method => {
                return {
                    "Contract Address": method.contractAddress,
                    Selector: (0, utils_1.numberToHex)(method.selector ?? starknet_1.hash.getSelectorFromName(method.entrypoint)),
                    ...(version === "v2" &&
                        method.calldataValidations && {
                        "Calldata Validations": method.calldataValidations.map(validation => {
                            return {
                                "Validation Type": validation.validationType,
                                Offset: validation.offset,
                                Value: validation.value,
                            };
                        }),
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
exports.getGasSponsoredSessionRequestTypedData = getGasSponsoredSessionRequestTypedData;
const signGasSponsoredSessionRequest = async (account, request, version = "v1") => {
    const chainId = await account.getChainId();
    const typedDataSessionRequest = getGasSponsoredSessionRequestTypedData(request, chainId, version);
    const signature = await account.signMessage(typedDataSessionRequest);
    return signature;
};
exports.signGasSponsoredSessionRequest = signGasSponsoredSessionRequest;
const getGasSponsoredSessionTx = async (request, version = "v1") => {
    const gsSessionTx = {
        contractAddress: request.sessionAccountAddress,
        entrypoint: version === "v1"
            ? "execute_gas_sponsored_session_tx"
            : "execute_gas_sponsored_session_tx_v2",
        calldata: (0, utils_1.getCalldata)(request, version),
    };
    return gsSessionTx;
};
exports.getGasSponsoredSessionTx = getGasSponsoredSessionTx;
