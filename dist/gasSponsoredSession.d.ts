import { Signature, AccountInterface, Call, TypedData } from "starknet";
import { GasSponsoredSessionSignatureRequest, GasSponsoredSessionTransactionRequest } from "./types";
declare const getGasSponsoredSessionRequestTypedData: (request: GasSponsoredSessionSignatureRequest, chainId: string | number, version?: "v1" | "v2") => TypedData;
declare const signGasSponsoredSessionRequest: (account: AccountInterface, request: GasSponsoredSessionSignatureRequest, version?: "v1" | "v2") => Promise<Signature>;
declare const getGasSponsoredSessionTx: (request: GasSponsoredSessionTransactionRequest, version?: "v1" | "v2") => Promise<Call>;
export { signGasSponsoredSessionRequest, getGasSponsoredSessionTx, getGasSponsoredSessionRequestTypedData, };
