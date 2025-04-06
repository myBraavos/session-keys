"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallDataValidationCalldata = exports.getCalldata = exports.getSpendingLimitCalldata = exports.getAllowedMethodHintsCalldata = exports.getAllowedMethodCalldata = exports.numberToHex = exports.isNullish = void 0;
const starknet_1 = require("starknet");
const typedDataConsts_1 = require("./typedDataConsts");
const typedDataConstsV2_1 = require("./typedDataConstsV2");
const ALLOWED_METHOD_HASH = starknet_1.typedData.getTypeHash(typedDataConsts_1.GS_SESSION_REQUEST_TYPES, "AllowedMethod", starknet_1.typedData.TypedDataRevision.Active);
const ALLOWED_METHOD_HASH_V2 = starknet_1.typedData.getTypeHash(typedDataConstsV2_1.GS_SESSION_REQUEST_TYPES_V2, "AllowedMethod", starknet_1.typedData.TypedDataRevision.Active);
const CALLDATA_VALIDATION_HASH = starknet_1.typedData.getTypeHash(typedDataConstsV2_1.GS_SESSION_REQUEST_TYPES_V2, "CalldataValidation", starknet_1.typedData.TypedDataRevision.Active);
const GAS_SPONSORED_SESSION_EXECUTION_HASH_V2 = starknet_1.typedData.getTypeHash(typedDataConstsV2_1.GS_SESSION_REQUEST_TYPES_V2, "GasSponsoredSessionExecution", starknet_1.typedData.TypedDataRevision.Active);
const getRequestedMethodGuid = (requestedMethod) => starknet_1.hash.computePoseidonHashOnElements([
    ALLOWED_METHOD_HASH,
    requestedMethod.contractAddress,
    (0, exports.numberToHex)(requestedMethod.selector ?? starknet_1.selector.getSelectorFromName(requestedMethod.entrypoint)),
]);
const getCalldataValidationHash = (validation) => starknet_1.hash.computePoseidonHashOnElements([
    CALLDATA_VALIDATION_HASH,
    validation.offset,
    validation.value,
    validation.validationType,
]);
const getRequestedMethodGuidV2 = (requestedMethod) => starknet_1.hash.computePoseidonHashOnElements([
    ALLOWED_METHOD_HASH_V2,
    requestedMethod.contractAddress,
    (0, exports.numberToHex)(requestedMethod.selector ?? starknet_1.selector.getSelectorFromName(requestedMethod.entrypoint)),
    starknet_1.hash.computePoseidonHashOnElements(requestedMethod.calldataValidations?.map(validation => getCalldataValidationHash(validation)) || []),
]);
const getAllowedMethodCalldata = (requestedMethods, version = "v1") => {
    return [
        requestedMethods.length,
        ...requestedMethods.map(method => version === "v1"
            ? getRequestedMethodGuid(method)
            : getRequestedMethodGuidV2(method)),
    ];
};
exports.getAllowedMethodCalldata = getAllowedMethodCalldata;
const noCalldataContradiction = (requestedMethod, call) => {
    const calldata = starknet_1.CallData.compile(call.calldata);
    return (requestedMethod.calldataValidations?.every(validation => validation.offset < calldata.length &&
        (0, exports.numberToHex)(validation.value) === (0, exports.numberToHex)(calldata[validation.offset])) ?? true);
};
const isNullish = (a) => typeof a === "undefined" || a === null;
exports.isNullish = isNullish;
const numberToHex = (n) => {
    try {
        // be optimistically fast -
        return (0, exports.isNullish)(n) ? n : `0x${BigInt(n).toString(16)}`;
    }
    catch (err) {
        // and handle edge-cases here -
        const str = `${n || ""}`.trim().toLowerCase();
        // is a leading 0x without actual hex data
        if (str === "0x") {
            return "0x0";
        }
        // is hex string missing a leading 0x
        if (/^(?!0x|0X)[0-9a-fA-F]+$/.test(str)) {
            return (0, exports.numberToHex)(`0x${str}`);
        }
        // learn about edge-cases
        console.error(`numberToHex error for "${n}":`, err, err?.stack);
        // and fallback to NaN
        return `${Number.NaN}`;
    }
};
exports.numberToHex = numberToHex;
const getAllowedMethodHintsCalldata = (requestedMethods, calls) => {
    return [
        calls.length,
        ...calls.map(call => requestedMethods.findIndex(rm => (0, exports.numberToHex)(rm.contractAddress) === (0, exports.numberToHex)(call.contractAddress) &&
            (rm.entrypoint ? rm.entrypoint === call.entrypoint : (0, exports.numberToHex)(rm.selector) === (0, exports.numberToHex)(starknet_1.selector.getSelectorFromName(call.entrypoint))) &&
            noCalldataContradiction(rm, call))),
    ];
};
exports.getAllowedMethodHintsCalldata = getAllowedMethodHintsCalldata;
const getSpendingLimitCalldata = (spendingLimits) => {
    return [
        spendingLimits.length,
        ...spendingLimits.flatMap(limit => {
            return [limit.tokenAddress, limit.amount.low, limit.amount.high];
        }),
    ];
};
exports.getSpendingLimitCalldata = getSpendingLimitCalldata;
const getCalls = (calls) => {
    return starknet_1.transaction.fromCallsToExecuteCalldata_cairo1(calls);
};
const getCallDataValidationCalldata = (requestedMethods) => {
    return [
        requestedMethods.length,
        ...requestedMethods.flatMap(method => {
            const validations = method.calldataValidations || [];
            return [
                validations.length,
                ...validations.flatMap(validation => [
                    validation.offset,
                    validation.value,
                    validation.validationType,
                ]),
            ];
        }),
    ];
};
exports.getCallDataValidationCalldata = getCallDataValidationCalldata;
const getCalldata = (request, version = "v1") => {
    const sigArray = starknet_1.stark.formatSignature(request.gsSessionSignature);
    return [
        Math.round(request.executeAfter.getTime() / 1000),
        Math.round(request.executeBefore.getTime() / 1000),
        ...getAllowedMethodCalldata(request.requestedMethods, version),
        ...getSpendingLimitCalldata(request.spendingLimits),
        ...(version === "v2"
            ? getCallDataValidationCalldata(request.requestedMethods)
            : []),
        ...getCalls(request.calls),
        ...getAllowedMethodHintsCalldata(request.requestedMethods, request.calls),
        sigArray.length,
        ...sigArray,
    ];
};
exports.getCalldata = getCalldata;
