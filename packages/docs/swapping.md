# Swapping Tokens

Learn how to get quotes and execute token swaps across any supported chain.

## The Two-Step Process

Swapping involves two steps:

1. **Get a quote** - Find the best swap route and expected output
2. **Execute the swap** - Submit the transaction on-chain

## Getting a Quote

Before swapping, you need to get a quote to see what you'll receive:

```typescript
import { getQuoteForSwap, getListedTokens } from "sugar-sdk";

// Get tokens to swap
const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

// Get quote for swapping 1000 USDC to WETH
const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n, // 1000 USDC (6 decimals)
});

if (quote) {
  console.log(`You'll receive ${quote.amountOut} WETH`);
  console.log(`Price impact: ${quote.priceImpact}%`);
}
```

### What's in a Quote?

- `amountOut` - Expected output amount (as bigint)
- `priceImpact` - How much the trade affects the pool price
- `path` - Routing path through liquidity pools
- `fromToken` / `toToken` - The tokens being swapped
- `spenderAddress` - Address to approve for spending tokens

## Executing a Swap

Once you have a quote, execute the swap:

```typescript
import { swap } from "sugar-sdk";

const txHash = await swap({
  config,
  quote,
  slippagePct: "50", // 0.5% slippage tolerance
});

console.log(`Swap completed: ${txHash}`);
```

### Slippage Protection

The `slippagePct` parameter protects you from price movement:

- `"50"` = 0.5% slippage (safe for most swaps)
- `"100"` = 1% slippage (for volatile markets)
- `"500"` = 5% slippage (use with caution)

If the price moves beyond your slippage tolerance, the transaction reverts.

## Complete Example

Here's a full swap from start to finish:

```typescript
import {
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  swap,
  optimism
} from "sugar-sdk";
import { connect, injected } from "@wagmi/core";

// 1. Setup
const config = getDefaultConfig({
  chains: [{ chain: optimism, rpcUrl: "https://mainnet.optimism.io" }]
});

// 2. Connect wallet
await connect(config, { connector: injected() });

// 3. Get tokens
const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

// 4. Get quote
const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n, // 1000 USDC
});

if (!quote) {
  console.error("No swap route found");
  process.exit(1);
}

console.log(`Expected output: ${quote.amountOut} WETH`);
console.log(`Price impact: ${quote.priceImpact}%`);

// 5. Execute swap
const txHash = await swap({
  config,
  quote,
  slippagePct: "50",
});

console.log(`Success! Transaction: ${txHash}`);
```

## Handling Token Approvals

Before swapping, you may need to approve the router to spend your tokens. The SDK doesn't automatically approve, but you can use the `approve` function:

```typescript
import { approve } from "sugar-sdk";

// Approve USDC for swapping
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress, // From the quote
  amount: 1000000000n, // Amount to approve
  chainId: usdc.chainId,
});

// Now execute the swap
await swap({ config, quote, slippagePct: "50" });
```

## Working Without Receipt Confirmation

By default, `swap()` waits for the transaction to be confirmed. For faster responses, disable this:

```typescript
const txHash = await swap({
  config,
  quote,
  slippagePct: "50",
  waitForReceipt: false, // Returns immediately after submitting
});

console.log(`Transaction submitted: ${txHash}`);
// Transaction is still pending...
```

## Error Handling

Always handle potential errors:

```typescript
try {
  const quote = await getQuoteForSwap({
    config,
    fromToken: usdc,
    toToken: weth,
    amountIn: 1000000000n,
  });

  if (!quote) {
    throw new Error("No liquidity route found");
  }

  const txHash = await swap({ config, quote, slippagePct: "50" });
  console.log(`Success: ${txHash}`);
} catch (error) {
  console.error("Swap failed:", error.message);
}
```

## Next Steps

- [Getting Calldata](/calldata) - Build custom transactions without executing
- [API: Swaps](/api/swaps) - Full swap function reference
- [API: Approvals](/api/approvals) - Token approval details
