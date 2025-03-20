import { AccountInterface, Call, TypedData, Account, Abi, AllowArray, CairoVersion, InvokeFunctionResponse, ProviderInterface, ProviderOptions, SignerInterface, UniversalDetails, EstimateFee } from "starknet";
import { SessionAccountRequest, SessionInfo, SessionSignatureRequest } from "./types";
declare const getSessionRequestTypedData: (request: SessionSignatureRequest, chainId: string | number, version?: "v1" | "v2") => TypedData;
declare class SessionAccount extends Account {
    sessionRequest: SessionInfo;
    sessionKeyVersion: "v1" | "v2";
    constructor(sessionRequest: SessionInfo, providerOrOptions: ProviderOptions | ProviderInterface, address: string, pkOrSigner: Uint8Array | string | SignerInterface, sessionKeyVersion?: "v1" | "v2", cairoVersion?: CairoVersion);
    private getSessionCalls;
    execute(transactions: AllowArray<Call>, abis?: Abi[] | undefined, details?: UniversalDetails): Promise<InvokeFunctionResponse>;
    estimateInvokeFee(calls: AllowArray<Call>, details?: UniversalDetails): Promise<EstimateFee>;
}
declare const requestSessionAccount: (provider: ProviderInterface, account: AccountInterface, request: SessionAccountRequest, sessionKeyVersion?: "v1" | "v2") => Promise<SessionAccount>;
export { requestSessionAccount, getSessionRequestTypedData };
