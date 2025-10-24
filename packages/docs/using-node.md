# Using Sugar SDK with Node.js

Core Sugar SDK API can be use directly with Node.js runtime.

## Getting Started

Install the SDK alongside its peer dependencies:

```bash
npm install \
  @dromos-labs/sdk.js \
  @wagmi/core \
  viem
```

Create a multi-chain configuration with `getDefaultConfig` by picking the chains you need.

```typescript
import { getDefaultConfig, optimism, base } from "@dromos-labs/sdk.js";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: process.env.OP_RPC! },
    { chain: base, rpcUrl: process.env.BASE_RPC! },
  ],
});
```

> **Important:** Sugar SDK makes a large number of RPC calls when loading tokens, quotes etc. We recommend you use dedicated RPC providers rather than public community endpoints so you avoid rate limits and keep responses fast.

Once you have `config`, you're ready to fetch tokens, request quotes, and submit swaps.

## Tokens

Use `getListedTokens` to load every listed token across the chains in your configuration.

```typescript
import { getListedTokens } from "@dromos-labs/sdk.js";

const tokens = await getListedTokens({ config });
console.log(`Found ${tokens.length} tokens across all chains.`);

const optimismTokens = tokens.filter((token) => token.chainId === 10);
const usdc = tokens.find(
  (token) => token.symbol === "USDC" && token.chainId === 10
);
```

Every `Token` includes symbol, name, decimals, chain ID, USD price, balances (if a wallet is connected), and flags such as `listed`. Amounts are bigints so you retain full precision.

See the [Core API Tokens reference](/api/tokens) for more.

## Quotes

`getQuoteForSwap` returns the best `Quote` to swap between 2 tokens. A quote contains the expected output amount (`amountOut`), price impact, routing path, and the spender address needed for approval before swapping.

```typescript
import { getListedTokens, getQuoteForSwap } from "@dromos-labs/sdk.js";

const tokens = await getListedTokens({ config });
const usdc = tokens.find(
  (token) => token.chainId === 10 && token.symbol === "USDC"
);
const weth = tokens.find(
  (token) => token.chainId === 10 && token.symbol === "WETH"
);

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1_000_000n, // 1,000 USDC (6 decimals)
});

if (!quote) {
  throw new Error("No swap route found.");
}

console.log(
  `Expected output: ${quote.amountOut} of ${quote.toToken.symbol}`
);
```

See the [Core API Swaps reference](/api/swaps) for more.

## Swaps

Swapping is a three step process: find a suitable quote, approve funds, perform actual swap.

```typescript
import {
  approve,
  getListedTokens,
  getQuoteForSwap,
  swap,
} from "@dromos-labs/sdk.js";

const tokens = await getListedTokens({ config });
const usdc = tokens.find(
  (token) => token.chainId === 10 && token.symbol === "USDC"
);
const weth = tokens.find(
  (token) => token.chainId === 10 && token.symbol === "WETH"
);

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1_000_000n,
});

if (!quote) throw new Error("No quote found.");

await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
});

const hash = await swap({ config, quote, slippage: 0.01 });

console.log(`Swap confirmed: ${hash}`);
```

See the [Core API Swaps reference](/api/swaps) for more.
