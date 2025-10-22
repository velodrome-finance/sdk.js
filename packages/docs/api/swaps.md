# Swaps API

Functions for building quotes, preparing calldata, and executing swaps through the Universal Router.

## getQuoteForSwap

Fetches the best available route between two tokens. Internally the SDK enumerates paths, batches multicalls to the quoter contract, and returns the highest output.

```typescript
import { getQuoteForSwap } from "sugar-sdk";

// fromToken and toToken are Token objects from getListedTokens
const quote = await getQuoteForSwap({
  config,
  fromToken,
  toToken,
  amountIn: 1_000_000n,
  batchSize: 50,
  concurrentLimit: 10,
});
```

- `config` – `SugarWagmiConfig` produced by `getDefaultConfig` or `init`.
- `fromToken` / `toToken` – `Token` objects returned by `getListedTokens`.
- `amountIn` – Bigint amount in the source token's smallest unit.
- `batchSize` (optional) – Number of candidate routes per multicall batch (default `50`).
- `concurrentLimit` (optional) – Number of batches processed in parallel (default `10`).

Returns a `Quote | null`. When `null`, no viable swap path exists or inputs are invalid.

### Quote Shape

`Quote` includes:

- `amountOut` – Expected output amount as bigint.
- `priceImpact` – Price impact in basis points.
- `path` – Internal routing data used by the planner.
- `fromToken` / `toToken` – Source and destination tokens.
- `amount` – Input amount echoed back as bigint.
- `spenderAddress` – Address that must be approved before swapping.

## getCallDataForSwap

Generates router calldata and min-out details without sending a transaction. Validates slippage (must be between `0` and `1`) and returns `null` when no route exists.

### Custom calldata

Use `getCallDataForSwap` when you need Universal Router commands for batching, meta-transactions, or external contract execution.

```typescript
import { getCallDataForSwap } from "sugar-sdk";
import { getAccount } from "@wagmi/core";

const { address } = getAccount(config);
if (!address) throw new Error("Connect a wallet before requesting calldata.");

const callData = await getCallDataForSwap({
  config,
  fromToken,
  toToken,
  amountIn: 1_000_000n,
  account: address,
  slippage: 0.005, // 0.5% as decimal
});

if (callData) {
  console.log(callData.commands);      // Hex router command stream
  console.log(callData.inputs);        // Encoded args
  console.log(callData.minAmountOut);  // bigint after slippage
  console.log(callData.priceImpact);   // bigint in bps
}
```

Use this for:

- Gas estimation (`estimateGas` with `commands` + `inputs`)
- Passing swap data to other contracts
- Building batched transactions or meta-transactions

## swap

Executes a swap or returns unsigned transaction data, depending on the options you pass. Slippage must be a decimal between `0` and `1`.

```typescript
import {
  approve,
  getListedTokens,
  getQuoteForSwap,
  swap,
} from "sugar-sdk";

const tokens = await getListedTokens({ config });
const fromToken = tokens.find((token) => token.symbol === "USDC" && token.chainId === 10);
const toToken = tokens.find((token) => token.symbol === "WETH" && token.chainId === 10);

if (!fromToken || !toToken) {
  throw new Error("Required tokens are not available in the current configuration.");
}

const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn: 1_000_000n });
if (!quote) throw new Error("No route found.");

await approve({
  config,
  tokenAddress: quote.fromToken.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: quote.fromToken.chainId,
});

const txHash = await swap({
  config,
  quote,
  slippage: 0.005,
  waitForReceipt: true,
});

console.log(`Swap confirmed: ${txHash}`);
```

### Options

- `config` – `SugarWagmiConfig`.
- `quote` – `Quote` returned by `getQuoteForSwap`.
- `slippage` (optional) – Decimal tolerance (default `0.005` = 0.5%).
- `waitForReceipt` (optional) – Wait for confirmation (`true` by default).
- `unsignedTransactionOnly` (optional) – When `true`, returns an `UnsignedSwapTransaction` instead of executing.
- `account` (optional) – Required only when `unsignedTransactionOnly` is `true`; identifies who will execute the transaction.

If `unsignedTransactionOnly` is omitted or `false`, the SDK:

1. Ensures the connected wallet is on the right chain.
2. Encodes the Universal Router call.
3. Sends the transaction via `writeContract`.
4. Waits for the receipt when `waitForReceipt` is true and throws if the receipt status is not `"success"`.

### Unsigned Transactions

Request the raw router call when you need to sign elsewhere:

```typescript
import { swap } from "sugar-sdk";

const unsignedTx = await swap({
  config,
  quote,
  slippage: 0.01,
  unsignedTransactionOnly: true,
  account: "0xYourExecutorAddress",
});

console.log(unsignedTx.to);      // Universal Router address
console.log(unsignedTx.data);    // ABI-encoded calldata
console.log(unsignedTx.value);   // Native value (bigint)
console.log(unsignedTx.chainId); // Chain ID
```

#### Offline signing

Submit the signed payload later with `submitSignedTransaction`.

```typescript
import { submitSignedTransaction } from "sugar-sdk";

const txHash = await submitSignedTransaction({
  config,
  signedTransaction, // Hex string after you sign unsignedTx
  waitForReceipt: false,
});
```

## Types

```typescript
import type {
  Quote,
  UnsignedSwapTransaction,
} from "sugar-sdk";
```

- `Quote` – Detailed swap route information (see above).
- `UnsignedSwapTransaction` – `{ to: Address; data: Hex; value: bigint; chainId: number; }`.
