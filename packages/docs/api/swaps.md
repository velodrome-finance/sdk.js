# Swaps API

Getting quotes and performing swaps using Sugar SDK.

## getQuoteForSwap

Fetches the best available quote to swap token.

### Signature

```typescript
function getQuoteForSwap(params: {
  config: SugarWagmiConfig;
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  batchSize?: number;
  concurrentLimit?: number;
}): Promise<Quote | null>
```

### Parameters

- `config` - `SugarWagmiConfig` produced by `getDefaultConfig`, `init`, or a custom setup.
- `fromToken` - Source `Token` object.
- `toToken` - Destination `Token` object.
- `amountIn` - Amount of `fromToken` to swap.
- `batchSize` - Optional candidate routes per multicall batch (default `50`).
- `concurrentLimit` - Optional number of batches processed in parallel (default `10`).

### Returns

`Promise<Quote | null>` - Best swap route information, or `null` when none is found.

### Example

```typescript
import { getQuoteForSwap } from "@dromos-labs/sdk.js";

const quote = await getQuoteForSwap({
  config,
  fromToken,
  toToken,
  amountIn: 1_000_000n,
  batchSize: 50,
  concurrentLimit: 10,
});
```

## Quote

Quote represents a swap route, expected outputs, and metadata needed for execution.

```typescript
type Quote = {
  path: RoutePath;
  amount: bigint;
  amountOut: bigint;
  fromToken: Token;
  toToken: Token;
  priceImpact: bigint;
  spenderAddress: Address;
};
```

### Fields

- `amountOut` - Expected output amount as bigint.
- `priceImpact` - Estimated price impact in basis points.
- `path` - Ordered list of hops the swap will execute.
- `spenderAddress` - Address that must be approved before swapping.

## getCallDataForSwap

Generates router calldata and minimum-out details without sending a transaction. Returns null when no quote is available. 

### Signature

```typescript
function getCallDataForSwap(params: {
  config: SugarWagmiConfig;
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  account: Address;
  slippage: number;
}): Promise<CallDataForSwap | null>
```

### Parameters

- `config` - `SugarWagmiConfig` instance used for quoting.
- `fromToken` - Source `Token`.
- `toToken` - Destination `Token`.
- `amountIn` - Amount to swap, expressed in smallest units.
- `account` - Wallet address.
- `slippage` - Decimal slippage tolerance between `0` and `1` (e.g., `0.01` for 1%).

### Returns

`Promise<CallDataForSwap | null>` - Encoded commands, inputs, min-out, and price impact, or `null` when no route is available.

### Example

```typescript
import { getCallDataForSwap } from "@dromos-labs/sdk.js";

const callData = await getCallDataForSwap({
  config,
  fromToken,
  toToken,
  amountIn: 1_000_000n,
  account: "0x...",
  slippage: 0.05, // 5%
});
```

Use `getCallDataForSwap` when you need raw input data to pass directly to Universal Router and when you can't or don't want to use swap functionality directly

## CallDataForSwap

`CallDataForSwap` represents the encoded Universal Router payload returned by `getCallDataForSwap`.

```typescript
type CallDataForSwap = {
  commands: Hex;
  inputs: Hex[];
  minAmountOut: bigint;
  priceImpact: bigint;
};
```

### Fields

- `commands` - Hex-encoded Universal Router command stream.
- `inputs` - ABI-encoded arguments matching each command.
- `minAmountOut` - Minimum accepted output after applying slippage.
- `priceImpact` - Estimated price impact of the swap.

## swap

Executes a swap through the Universal Router or returns unsigned transaction data for custom signing.

### Signature

```typescript
function swap(params: {
  config: SugarWagmiConfig;
  quote: Quote;
  slippage?: number;
  waitForReceipt?: boolean;
}): Promise<string>;

function swap(params: {
  config: SugarWagmiConfig;
  quote: Quote;
  slippage?: number;
  unsignedTransactionOnly: true;
  account: Address;
}): Promise<UnsignedSwapTransaction>;
```

### Parameters

- `config` - `SugarWagmiConfig`.
- `quote` - `Quote` returned by `getQuoteForSwap`.
- `slippage` - Optional decimal tolerance (default `0.005` = 0.5%).
- `waitForReceipt` - Optional flag to await confirmation (default `true` when executing).
- `unsignedTransactionOnly` - Set to `true` to receive an `UnsignedSwapTransaction` instead of executing.
- `account` - Required when `unsignedTransactionOnly` is `true`; address that will submit the transaction.

### Returns

`Promise<string | UnsignedSwapTransaction>` - Transaction hash when executing immediately, or unsigned transaction data when requested.

### Example

```typescript
import {
  approve,
  getListedTokens,
  getQuoteForSwap,
  swap,
} from "@dromos-labs/sdk.js";

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

### Unsigned Transactions

Request unsigned transaction when you need to customize how you sign it:

```typescript
import { swap } from "@dromos-labs/sdk.js";

const unsignedTx = await swap({
  config,
  quote,
  slippage: 0.01,
  unsignedTransactionOnly: true,
  account: "0x...",
});
```

Submit the signed payload later with `submitSignedTransaction`.

```typescript
import { submitSignedTransaction } from "@dromos-labs/sdk.js";

const txHash = await submitSignedTransaction({
  config,
  signedTransaction, // Hex string after you sign unsignedTx
  waitForReceipt: false,
});
```
