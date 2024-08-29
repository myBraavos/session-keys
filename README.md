# Braavos Session Keys

## Motivation

The Braavos session keys feature allows dapps to request the wallet to grant permissions to execute transactions in the user's behalf without prompting them for each transaction.

## Installation

To add this package to your project run `npm install starknet-sessions --add` or `yarn add starknet-sessions`

## Gas sponsored sessions

Gas sponsored sessions are sessions in which transactions are sent in the name of the user, but fees are paid by the dapp account. 
This mechanism is based on [SNIP-9 Outside execution "from outside"](https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-9.md).

### Signing the session request
To use this feature a dapp must first ask the user to connect their wallet and sign a message. This can be done with the following function:
```js
signGasSponsoredSessionRequest = async (
    account: AccountInterface,
    request: GasSponsoredSessionSignatureRequest
): Promise<Signature>;
```
Where `account` is the connected user account and the type `GasSponsoredSessionSignatureRequest` contains the following properties:

```js
type GasSponsoredSessionSignatureRequest = {
    callerAddress: string;
    executeAfter: Date;
    executeBefore: Date;
    requestedMethods: RequestedMethod[];
    spendingLimits: SpendingLimit[];
};

type RequestedMethod = {
    contractAddress: string;
    entrypoint: string;
};

type SpendingLimit = {
    tokenAddress: string;
    amount: Uint256;
};

```
The properties of this type are:
1. `callerAddress` - address of the dapp account which will be executing the "transactions from outside" and paying the fees
2. `executeAfter` - date after which the session is valid
3. `executeBefore` - date after which the session is expired
4. `requestedMethods` - list of contract address and entrypoint pairs which the dapp account may call in the context of this session
5. `spendingLimits` - array of erc-20 token address and spending limit pairs which the account will limit

### Executing gas sponsored session transactions
Once the signature is obtained and the `executeAfter` time had passed the dapp account may execute transactions in the context of the session in the name of the user. To generate a gas sponsored transaction the following function can be used:

```js
getGasSponsoredSessionTx = async (
    request: GasSponsoredSessionTransactionRequest
): Promise<Call>;
```
Where `GasSponsoredSessionTransactionRequest` contains the following properties:
```js
type GasSponsoredSessionTransactionRequest = {
    callerAddress: string;
    executeAfter: Date;
    executeBefore: Date;
    requestedMethods: RequestedMethod[];
    spendingLimits: SpendingLimit[];
    sessionAccountAddress: string;
    calls: Call[];
};
```
The following attributes must be identical to those given when requesting signature:
1. `callerAddress`
2. `executeAfter`
3. `executeBefore`
4. `requestedMethods`
5. `spendingLimits`

`sessionAccountAddress` should be the user account address and `calls` is the list of calls the dapp would like to execute. The `callerAddress` account can now execute the returned call.

### Example
The following snippet requests the user to sign on a gas sponsored session:

```js
    const sessionGSRequest = {
        callerAddress: "0x01bf914fef319eb1cc2769100f817fbbdd99be01b1e20daa45ab031dee3ef14b",
        sessionAccountAddress: sessionAccountAddress,
        executeAfter: new Date(0),
        executeBefore: new Date(1756299408),
        requestedMethods: [
            {
            // eth
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "transfer",
            },
            {
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "approve",
            },
            // strk
            {
                contractAddress:
                    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                entrypoint: "transfer",
            },
            {
                contractAddress:
                    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                entrypoint: "approve",
            },
        ],
        spendingLimits: [
            // Limit eth transfers and approvals to 0.001 eth
            {
                tokenAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                amount: { low: 1000000000000000, high: 0 },
            },
        ],
    };
    const wallet = await getStarknet().getLastConnectedWallet();
    if (wallet?.isConnected) {
        signature = await signGasSponsoredSessionRequest(
            wallet.account,
            sessionGSRequest
        );
    }
```
After this message is signed, the `callerAddress` can send transactions "from outside" which comply with the `requestedMethods` list and may spend up to `0.001 ETH`.

The following snippet sends a transaction in the context of this session:

```js
    import { getGasSponsoredSessionTx } from "@braavosdev/session-keys";
    // This call wraps all the required metadata, calls and signature to a single transaction
    // that the dapp account can execute.
    const res = await getGasSponsoredSessionTx({
        calls: [
            {
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "transfer",
                calldata: [
                    "0x01bf914fef319eb1cc2769100f817fbbdd99be01b1e20daa45ab031dee3ef14b",
                    1,
                    0,
                ],
            },
            {
                contractAddress:
                    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                entrypoint: "approve",
                calldata: [
                    "0x01bf914fef319eb1cc2769100f817fbbdd99be01b1e20daa45ab031dee3ef14b",
                    200,
                    0,
                ],
            },
        ],
        ...sessionGSRequest,
        gsSessionSignature: signature!,
    });
    const txres = await dappAccount.execute(res); // dappAccount is a server controlled account
```

## Non gas sponsored sessions
After a user signs the session request for a non gas sponsored sessions a dapp may trigger transactions in the name of the user account.
To start a non gas-sponsored session a dapp needs to import and call the following library function to generate a session account object (implementing the starknet-js `AccountInterface`) which can execute transactions in the name of the user account without prompting the wallet:
```js
requestSessionAccount = async (
    provider: ProviderInterface,
    account: AccountInterface,
    request: SessionAccountRequest
): Promise<SessionAccount>;
```
Where `SessionAccountRequest` contains the following properties
```js
type SessionAccountRequest = {
    executeAfter: Date;
    executeBefore: Date;
    requestedMethods: RequestedMethod[];
    spendingLimits: SpendingLimit[];
    strkGasLimit: u128;
}
```
The field `strkGasLimit` sets an upper bound to the amount of fees the user account may spend in this session. Note that the user must have STRK balance in their account as only `v3` transactions are allowed in this mode.

## Example
The following code requests the user to sign on a non gas sponsored session:

```js
    import {
        signGasSponsoredSessionRequest,
        getGasSponsoredSessionTx,
        requestSessionAccount,
    } from "@braavosdev/session-keys";

    const sessionRequest = {
        executeAfter: new Date(0),
        executeBefore: new Date(1756299409),
        strkGasLimit: "1000000000000000000",
        requestedMethods: [
            {
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "transfer"
            },
            {
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "approve",
            },
            {
                contractAddress:
                    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                entrypoint: "transfer",
            },
            {
                contractAddress:
                    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                entrypoint: "approve",
            },
        ],
        spendingLimits: [
            {
                tokenAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                amount: { low: 1000000000000000, high: 0 },
            },
        ],
    };

    const wallet = await getStarknet().getLastConnectedWallet();
    if (wallet?.isConnected) {
        const sessionAccount = await requestSessionAccount(
            wallet.provider,
            wallet.account,
            sessionRequest
        );
    }
```
`requestSessionAccount` will prompt the user to sign the session request. 
Once signed the dapp may use `sessionAccount.execute(..)` to execute transactions in the context of the session.
