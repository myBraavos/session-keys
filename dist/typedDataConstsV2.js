"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_REQUEST_TYPES_V2 = exports.GS_SESSION_REQUEST_TYPES_V2 = exports.ALLOWED_METHOD_TYPE_V2 = exports.CALLDATA_VALIDATION_TYPE = void 0;
const typedDataConsts_1 = require("./typedDataConsts");
exports.CALLDATA_VALIDATION_TYPE = {
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
exports.ALLOWED_METHOD_TYPE_V2 = {
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
    ...exports.CALLDATA_VALIDATION_TYPE,
};
exports.GS_SESSION_REQUEST_TYPES_V2 = {
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
    ...exports.ALLOWED_METHOD_TYPE_V2,
    ...typedDataConsts_1.DOMAIN_TYPE,
    ...exports.CALLDATA_VALIDATION_TYPE,
};
exports.SESSION_REQUEST_TYPES_V2 = {
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
    ...exports.ALLOWED_METHOD_TYPE_V2,
    ...typedDataConsts_1.DOMAIN_TYPE,
    ...exports.CALLDATA_VALIDATION_TYPE,
};
