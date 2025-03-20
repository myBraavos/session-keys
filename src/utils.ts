import {
    typedData,
    hash,
    selector,
    transaction,
    RawArgsArray,
    Call,
    RawArgs,
    stark,
} from "starknet";
import { GS_SESSION_REQUEST_TYPES } from "./typedDataConsts";
import { GS_SESSION_REQUEST_TYPES_V2 } from "./typedDataConstsV2";
import {
    RequestedMethod,
    SpendingLimit,
    GasSponsoredSessionTransactionRequest,
    CalldataValidation,
} from "./types";

const ALLOWED_METHOD_HASH = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES,
    "AllowedMethod",
    typedData.TypedDataRevision.Active
);

const ALLOWED_METHOD_HASH_V2 = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES_V2,
    "AllowedMethod",
    typedData.TypedDataRevision.Active
);

const CALLDATA_VALIDATION_HASH = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES_V2,
    "CalldataValidation",
    typedData.TypedDataRevision.Active
);

const GAS_SPONSORED_SESSION_EXECUTION_HASH_V2 = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES_V2,
    "GasSponsoredSessionExecution",
    typedData.TypedDataRevision.Active
);

const getRequestedMethodGuid = (requestedMethod: RequestedMethod): string =>
    hash.computePoseidonHashOnElements([
        ALLOWED_METHOD_HASH,
        requestedMethod.contractAddress,
        selector.getSelectorFromName(requestedMethod.entrypoint),
    ]);

const getCalldataValidationHash = (validation: CalldataValidation): string =>
    hash.computePoseidonHashOnElements([
        CALLDATA_VALIDATION_HASH,
        validation.offset,
        validation.value,
        validation.validationType,
    ]);

const getRequestedMethodGuidV2 = (requestedMethod: RequestedMethod): string =>
    hash.computePoseidonHashOnElements([
        ALLOWED_METHOD_HASH_V2,
        requestedMethod.contractAddress,
        selector.getSelectorFromName(requestedMethod.entrypoint),
        hash.computePoseidonHashOnElements(
            requestedMethod.calldataValidations?.map(validation =>
                getCalldataValidationHash(validation)
            ) || []
        ),
    ]);

const getAllowedMethodCalldata = (
    requestedMethods: RequestedMethod[],
    version: "v1" | "v2" = "v1"
): RawArgsArray => {
    return [
        requestedMethods.length,
        ...requestedMethods.map(method =>
            version === "v1"
                ? getRequestedMethodGuid(method)
                : getRequestedMethodGuidV2(method)
        ),
    ];
};

const noCalldataContradiction = (
    requestedMethod: RequestedMethod,
    call: Call
): boolean => {
    return (
        requestedMethod.calldataValidations?.every(
            validation =>
                validation.offset <
                    (Array.isArray(call.calldata) ? call.calldata.length : 0) &&
                validation.value ===
                    (Array.isArray(call.calldata)
                        ? call.calldata[validation.offset]
                        : undefined)
        ) || true
    );
};

const getAllowedMethodHintsCalldata = (
    requestedMethods: RequestedMethod[],
    calls: Call[]
): RawArgsArray => {
    return [
        calls.length,
        ...calls.map(call =>
            requestedMethods.findIndex(
                rm =>
                    rm.contractAddress === call.contractAddress &&
                    rm.entrypoint === call.entrypoint &&
                    noCalldataContradiction(rm, call)
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

const getCallDataValidationCalldata = (
    requestedMethods: RequestedMethod[]
): RawArgsArray => {
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

const getCalldata = (
    request: GasSponsoredSessionTransactionRequest,
    version: "v1" | "v2" = "v1"
): RawArgs => {
    const sigArray = stark.formatSignature(request.gsSessionSignature);
    return [
        request.executeAfter.getTime(),
        request.executeBefore.getTime(),
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

export {
    getAllowedMethodCalldata,
    getAllowedMethodHintsCalldata,
    getSpendingLimitCalldata,
    getCalldata,
    getCallDataValidationCalldata,
};
