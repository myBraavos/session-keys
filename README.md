# Braavos Session Keys

## Motivation

The Braavos session keys feature allows dapps to send account transactions without prompting the user for signatures for each transaction.
This library interacts with Braavos wallets which support this feature.

## Installation

To add this package to your project run `npm install @braavosdev/session-keys --add`


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
1. `callerAddress` - address of the dapp account which will be performing the "transactions from outside" and paying the fees
2. `executeAfter` - date after which the session is valid
3. `executeBefore` - date after which the session is expired
4. `requestedMethods` - array of pairs of contract addresses and entrypoints which the dapp account may call in the context of this session
5. `spendingLimits` - array of erc-20 token addresses which the account contract will track and limit their transfers and approval to the given amount

### Executing gas sponsored session transactions
Once the signature is obtained and the `execute_after` time had passed the dapp account may execute transactions in the context of the session in the name of the user. To generate a gas sponsored transaction the following function can be used:

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

`sessionAccountAddress` should be the user account address and `calls` is the list of calls the dapp would like to execute.

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
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "transfer",
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
                amount: { low: 100, high: 0 },
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
    const txres = await dappAccount.execute(res);
```
This transaction contains to calls that will be executed in the name of `sessionAccountAddress`

## Non gas sponsored sessions
After a user signs the session request for a non gas sponsored sessions a dapp may trigger transactions in the name of the user account.
To start a non gas sponsored session a dapp needs to call the following library function to generate a session account object (implementing the starknet-js `AccountInterface`) which can execute transactions in the name of the user account without prompting the wallet:
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
    ethGasLimit: u128;
    strkGasLimit: u128;
}
```
The two fields `ethGasLimit` and `strkGasLimit` set an upper bound to the amount of fees the user account may spend in this session.

## Example
The following code requests the user to sign on a non gas sponsored session:

```js
    const sessionRequest = {
        executeAfter: new Date(0),
        executeBefore: new Date(1756299409),
        ethGasLimit: "1000000000000000000",
        strkGasLimit: "1000000000000000000",
        requestedMethods: [
            {
                contractAddress:
                    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                entrypoint: "transfer",
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
                amount: { low: 100, high: 0 },
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
