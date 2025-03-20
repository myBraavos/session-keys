"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionAccount = void 0;
const starknet_1 = require("starknet");
class SessionAccount extends starknet_1.Account {
    constructor(sessionRequest, providerOrOptions, address, pkOrSigner, cairoVersion, transactionVersion) {
        super(providerOrOptions, address, pkOrSigner, cairoVersion, transactionVersion);
        this.sessionRequest = sessionRequest;
    }
    execute(transactions, abis, details) {
        const calls = Array.isArray(transactions) ? transactions : [transactions];
        const res = {
            contractAddress: this.address,
            entrypoint: "session_execute",
            calldata: [
                this.sessionRequest.ownerPubKey,
                this.sessionRequest.executeAfter,
                this.sessionRequest.executeBefore,
                this.sessionRequest.requestedMethods,
                this.sessionRequest.ethGasLimit,
                this.sessionRequest.strkGasLimit,
                this.sessionRequest.spendingLimits,
                this.sessionRequest.sessionSignature,
            ]
        };
        return super.execute([res, ...calls], abis, details);
    }
}
exports.SessionAccount = SessionAccount;
