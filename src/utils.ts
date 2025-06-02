import {
    typedData,
    hash,
    selector,
    transaction,
    RawArgsArray,
    Call,
    RawArgs,
    stark,
    CallData,
    TypedDataRevision,
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
    TypedDataRevision.ACTIVE
);

const ALLOWED_METHOD_HASH_V2 = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES_V2,
    "AllowedMethod",
    TypedDataRevision.ACTIVE
);

const CALLDATA_VALIDATION_HASH = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES_V2,
    "CalldataValidation",
    TypedDataRevision.ACTIVE
);

const GAS_SPONSORED_SESSION_EXECUTION_HASH_V2 = typedData.getTypeHash(
    GS_SESSION_REQUEST_TYPES_V2,
    "GasSponsoredSessionExecution",
    TypedDataRevision.ACTIVE
);

const getRequestedMethodGuid = (requestedMethod: RequestedMethod): string =>
    hash.computePoseidonHashOnElements([
        ALLOWED_METHOD_HASH,
        requestedMethod.contractAddress,
        numberToHex(
            requestedMethod.selector ??
                selector.getSelectorFromName(requestedMethod.entrypoint!)
        ),
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
        numberToHex(
            requestedMethod.selector ??
                selector.getSelectorFromName(requestedMethod.entrypoint!)
        ),
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
    const calldata = CallData.compile(call.calldata!);
    return (
        requestedMethod.calldataValidations?.every(
            validation =>
                validation.offset < calldata.length &&
                numberToHex(validation.value) === numberToHex(calldata[validation.offset])
        ) ?? true
    );
};

export const isNullish = <T>(a: T | undefined | null): a is undefined | null =>
    typeof a === "undefined" || a === null;

export const numberToHex = (n: string | number | bigint): string => {
    try {
        // be optimistically fast -
        return isNullish(n) ? n : `0x${BigInt(n).toString(16)}`;
    } catch (err) {
        // and handle edge-cases here -

        const str = `${n || ""}`.trim().toLowerCase();

        // is a leading 0x without actual hex data
        if (str === "0x") {
            return "0x0";
        }

        // is hex string missing a leading 0x
        if (/^(?!0x|0X)[0-9a-fA-F]+$/.test(str)) {
            return numberToHex(`0x${str}`);
        }

        // learn about edge-cases
        console.error(`numberToHex error for "${n}":`, err, (err as any)?.stack);
        // and fallback to NaN
        return `${Number.NaN}`;
    }
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
                    numberToHex(rm.contractAddress) ===
                        numberToHex(call.contractAddress) &&
                    (rm.entrypoint
                        ? rm.entrypoint === call.entrypoint
                        : numberToHex(rm.selector!) ===
                          numberToHex(selector.getSelectorFromName(call.entrypoint))) &&
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

export {
    getAllowedMethodCalldata,
    getAllowedMethodHintsCalldata,
    getSpendingLimitCalldata,
    getCalldata,
    getCallDataValidationCalldata,
};
