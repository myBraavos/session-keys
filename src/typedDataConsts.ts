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

export { GS_SESSION_REQUEST_TYPES, SESSION_REQUEST_TYPES, DOMAIN_TYPE };
