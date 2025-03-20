"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMAIN_TYPE = exports.SESSION_REQUEST_TYPES = exports.GS_SESSION_REQUEST_TYPES = void 0;
const DOMAIN_TYPE = {
    StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
    ],
};
exports.DOMAIN_TYPE = DOMAIN_TYPE;
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
exports.GS_SESSION_REQUEST_TYPES = GS_SESSION_REQUEST_TYPES;
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
exports.SESSION_REQUEST_TYPES = SESSION_REQUEST_TYPES;
