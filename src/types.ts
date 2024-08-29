import { Call, Signature, Uint256 } from "starknet";
import { u128 } from "starknet-types/dist/types/api/components";

export type RequestedMethod = {
    contractAddress: string;
    entrypoint: string;
};

export type SpendingLimit = {
    tokenAddress: string;
    amount: Uint256;
};

export type SessionRequestBase = {
    executeAfter: Date;
    executeBefore: Date;
    requestedMethods: RequestedMethod[];
    spendingLimits: SpendingLimit[];
};

export type SessionAccountRequest = SessionRequestBase & {
    strkGasLimit: u128;
};

export type SessionSignatureRequest = SessionAccountRequest & {
    ownerPubKey: string;
};

export type SessionInfo = SessionSignatureRequest & {
    sessionSignature: Signature;
};

export type GasSponsoredSessionSignatureRequest = SessionRequestBase & {
    callerAddress: string;
};

export type GasSponsoredSessionTransactionRequest =
    GasSponsoredSessionSignatureRequest & {
        sessionAccountAddress: string;
        calls: Call[];
        gsSessionSignature: Signature;
    };
