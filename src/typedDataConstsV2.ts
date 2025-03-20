import { DOMAIN_TYPE } from "./typedDataConsts";

export const CALLDATA_VALIDATION_TYPE = {
    CalldataValidation: [
        {
            name: "Offset",
            type: "u128",
        },
        {
            name: "Value",
            type: "felt",
        },
        {
            name: "Validation Type",
            type: "u128",
        },
    ],
};

export const ALLOWED_METHOD_TYPE_V2 = {
    AllowedMethod: [
        {
            name: "Contract Address",
            type: "ContractAddress",
        },
        {
            name: "Selector",
            type: "selector",
        },
        {
            name: "Calldata Validations",
            type: "CalldataValidation*",
        },
    ],
    ...CALLDATA_VALIDATION_TYPE,
};

export const GS_SESSION_REQUEST_TYPES_V2 = {
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
    ...ALLOWED_METHOD_TYPE_V2,
    ...DOMAIN_TYPE,
    ...CALLDATA_VALIDATION_TYPE,
};

export const SESSION_REQUEST_TYPES_V2 = {
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
    ...ALLOWED_METHOD_TYPE_V2,
    ...DOMAIN_TYPE,
    ...CALLDATA_VALIDATION_TYPE,
};
