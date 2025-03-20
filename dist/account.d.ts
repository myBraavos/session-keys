import { Abi, Account, AllowArray, CairoVersion, Call, InvokeFunctionResponse, ProviderInterface, ProviderOptions, SignerInterface, UniversalDetails } from "starknet";
import { ETransactionVersion } from "starknet-types";
import { SessionInfo } from "./types";
declare class SessionAccount extends Account {
    sessionRequest: SessionInfo;
    constructor(sessionRequest: SessionInfo, providerOrOptions: ProviderOptions | ProviderInterface, address: string, pkOrSigner: Uint8Array | string | SignerInterface, cairoVersion?: CairoVersion, transactionVersion?: ETransactionVersion.V2 | ETransactionVersion.V3);
    execute(transactions: AllowArray<Call>, abis?: Abi[] | undefined, details?: UniversalDetails): Promise<InvokeFunctionResponse>;
}
export { SessionAccount };
