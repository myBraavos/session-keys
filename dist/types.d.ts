import { Call, Signature, Uint256 } from "starknet";
import { u128 } from "@starknet-io/types-js";
export type CalldataValidationType = 0;
export type CalldataValidation = {
    validationType: CalldataValidationType;
    offset: number;
    value: number | string;
};
export type RequestedMethod = {
    contractAddress: string;
    entrypoint?: string;
    selector?: string;
    calldataValidations?: CalldataValidation[];
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
export type GasSponsoredSessionTransactionRequest = GasSponsoredSessionSignatureRequest & {
    sessionAccountAddress: string;
    calls: Call[];
    gsSessionSignature: Signature;
};
