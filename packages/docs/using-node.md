# Using Sugar SDK with Node.js

Core Sugar SDK API can be use directly with Node.js runtime.

## Getting Started

Install the SDK alongside its peer dependencies:

```bash
npm install \
  https://github.com/velodrome-finance/sdk.js/releases/tag/v0.3.0-alpha.1 \
  @wagmi/core \
  viem
```

Create a multi-chain configuration with `getDefaultConfig` by picking the chains you need.

```typescript
import { getDefaultConfig, optimism, base } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: process.env.OP_RPC! },
    { chain: base, rpcUrl: process.env.BASE_RPC! },
  ],
});
```

> **Important:** Sugar SDK fans out a large number of RPC calls when loading tokens, quotes, and swap routes. Use private or paid RPC URLs rather than public community endpoints so you avoid rate limits and keep responses fast.

Once you have `config`, you're ready to fetch tokens, request quotes, and submit swaps.

## Tokens

Use `getListedTokens` to load every listed token across the chains in your configuration.

```typescript
import { getListedTokens } from "sugar-sdk";

const tokens = await getListedTokens({ config });
console.log(`Found ${tokens.length} tokens across all chains.`);

const optimismTokens = tokens.filter((token) => token.chainId === 10);
const usdc = tokens.find(
  (token) => token.symbol === "USDC" && token.chainId === 10
);

if (usdc) {
  const humanBalance =
    Number(usdc.balance) / 10 ** usdc.decimals;
  console.log(`Balance: ${humanBalance} ${usdc.symbol}`);
}
```

Every `Token` includes symbol, name, decimals, chain ID, USD price, balances (if a wallet is connected), and flags such as `listed`. Amounts are bigints so you retain full precision.

## Quotes

`getQuoteForSwap` inspects all supported paths between two tokens, reads the on-chain quoter, and returns the best `Quote` it finds. A quote contains the expected output amount (`amountOut`), price impact, routing path, and the spender address that must be approved before swapping.

```typescript
import { getListedTokens, getQuoteForSwap } from "sugar-sdk";

const tokens = await getListedTokens({ config });
const usdc = tokens.find((token) => token.symbol === "USDC" && token.chainId === 10);
const weth = tokens.find((token) => token.symbol === "WETH" && token.chainId === 10);

if (!usdc || !weth) {
  throw new Error("Required tokens are not available in the current configuration.");
}

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1_000_000n, // 1,000 USDC (6 decimals)
});

if (!quote) {
  throw new Error("No swap route found.");
}

console.log(`Expected output: ${quote.amountOut} wei of ${quote.toToken.symbol}`);
console.log(`Price impact: ${Number(quote.priceImpact) / 100} %`);
```

Tweak the optional `batchSize` and `concurrentLimit` parameters if you need to balance speed and RPC load:

```typescript
await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1_000_000n,
  batchSize: 25,
  concurrentLimit: 5,
});
```

## Swaps

Swapping is a three step process: approve the router once per token, fetch a quote, then call `swap`. The SDK validates slippage, switches chains when necessary, and waits for receipts by default.

```typescript
import { approve, getListedTokens, getQuoteForSwap, swap } from "sugar-sdk";

const tokens = await getListedTokens({ config });
const usdc = tokens.find((token) => token.symbol === "USDC" && token.chainId === 10);
const weth = tokens.find((token) => token.symbol === "WETH" && token.chainId === 10);

if (!usdc || !weth) {
  throw new Error("Required tokens are not available in the current configuration.");
}

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1_000_000n,
});

if (!quote) {
  throw new Error("No swap route found.");
}

await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
});

const hash = await swap({
  config,
  quote,
  slippage: 0.005, // 0.5% tolerance
});

console.log(`Swap confirmed: ${hash}`);
```

Advanced flows can skip direct execution:

- **Custom calldata** – `getCallDataForSwap` returns the encoded router commands so you can batch swaps or execute them from your own contracts. It enforces the same slippage rules as `swap`. Reuse the `usdc` and `weth` tokens from the previous example.

  ```typescript
  import { getCallDataForSwap } from "sugar-sdk";
  import { getAccount } from "@wagmi/core";

  const { address } = getAccount(config);
  if (!address) {
    throw new Error("Connect a wallet before requesting swap calldata.");
  }

  const callData = await getCallDataForSwap({
    config,
    fromToken: usdc,
    toToken: weth,
    amountIn: 1_000_000n,
    account: address,
    slippage: 0.005,
  });

  if (callData) {
    console.log("Router commands:", callData.commands);
    console.log("Minimum amount out:", callData.minAmountOut);
  }
  ```

- **Offline signing** – When you already have a signed transaction (for example, from the `swap-with-pk.ts` demo script), submit it with `submitSignedTransaction`. The helper forwards the raw transaction to the connected RPC and optionally waits for the receipt.

  ```typescript
  import { submitSignedTransaction } from "sugar-sdk";

  // signedTransaction is a serialized hex string you obtained elsewhere
  const txHash = await submitSignedTransaction({
    config,
    signedTransaction,
    waitForReceipt: false,
  });

  console.log(`Submitted signed transaction: ${txHash}`);
  ```

Remember that `swap` accepts a `unsignedTransactionOnly` flag if you want the Universal Router payload without sending it. Combine that with your own signing logic or the demo-node scripts to build enterprise workflows.
