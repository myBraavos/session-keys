"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionRequestTypedData = exports.requestSessionAccount = void 0;
const starknet_1 = require("starknet");
const micro_starknet_1 = require("micro-starknet");
const starknet_types_1 = require("starknet-types");
const buffer_1 = require("buffer");
const typedDataConsts_1 = require("./typedDataConsts");
const utils_1 = require("./utils");
const typedDataConstsV2_1 = require("./typedDataConstsV2");
const getSessionRequestTypedData = (request, chainId, version = "v2") => {
    return {
        types: version === "v1" ? typedDataConsts_1.SESSION_REQUEST_TYPES : typedDataConstsV2_1.SESSION_REQUEST_TYPES_V2,
        primaryType: "SessionExecution",
        domain: {
            name: "Account.execute_session",
            version: version === "v1" ? "2" : "3",
            chainId: chainId,
            revision: "1",
        },
        message: {
            "Owner Public Key": request.ownerPubKey,
            "Execute After": Math.round(request.executeAfter.getTime() / 1000),
            "Execute Before": Math.round(request.executeBefore.getTime() / 1000),
            "STRK Gas Limit": request.strkGasLimit,
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
exports.getSessionRequestTypedData = getSessionRequestTypedData;
class SessionAccount extends starknet_1.Account {
    constructor(sessionRequest, providerOrOptions, address, pkOrSigner, sessionKeyVersion, cairoVersion) {
        super(providerOrOptions, address, pkOrSigner, cairoVersion, starknet_types_1.ETransactionVersion.V3);
        this.sessionRequest = sessionRequest;
        this.sessionKeyVersion = sessionKeyVersion || "v1";
    }
    getSessionCalls(transactions) {
        const sigArray = starknet_1.stark.formatSignature(this.sessionRequest.sessionSignature);
        const calls = Array.isArray(transactions) ? transactions : [transactions];
        const sessionExecuteCall = {
            contractAddress: this.address,
            entrypoint: "session_execute",
            calldata: [
                this.sessionRequest.ownerPubKey,
                Math.round(this.sessionRequest.executeAfter.getTime() / 1000),
                Math.round(this.sessionRequest.executeBefore.getTime() / 1000),
                ...(0, utils_1.getAllowedMethodCalldata)(this.sessionRequest.requestedMethods),
                this.sessionRequest.strkGasLimit,
                ...(0, utils_1.getSpendingLimitCalldata)(this.sessionRequest.spendingLimits),
                ...(this.sessionKeyVersion === "v2"
                    ? (0, utils_1.getCallDataValidationCalldata)(this.sessionRequest.requestedMethods)
                    : []),
                ...(0, utils_1.getAllowedMethodHintsCalldata)(this.sessionRequest.requestedMethods, calls),
                sigArray.length,
                ...sigArray,
            ],
        };
        return [sessionExecuteCall, ...calls];
    }
    execute(transactions, abis, details) {
        const sessionCalls = this.getSessionCalls(transactions);
        return super.execute(sessionCalls, abis, { ...details });
    }
    estimateInvokeFee(calls, details) {
        return super.estimateInvokeFee(calls, { ...details, skipValidate: false });
    }
}
const requestSessionAccount = async (provider, account, request, sessionKeyVersion = "v1") => {
    const chainId = await account.getChainId();
    const sessionPrivateKey = "0x" + buffer_1.Buffer.from(micro_starknet_1.utils.randomPrivateKey()).toString("hex");
    const sessionPublicKey = (0, micro_starknet_1.getStarkKey)(sessionPrivateKey);
    const sessionTypedDataRequest = {
        sessionAccountAddress: account.address,
        ownerPubKey: sessionPublicKey,
        ...request,
    };
    const typedDataSessionRequest = getSessionRequestTypedData(sessionTypedDataRequest, chainId, sessionKeyVersion);
    const signature = await account.signMessage(typedDataSessionRequest);
    const sessionAccount = new SessionAccount({ ...sessionTypedDataRequest, sessionSignature: signature }, provider, account.address, sessionPrivateKey, sessionKeyVersion);
    return sessionAccount;
};
exports.requestSessionAccount = requestSessionAccount;
