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
  slippage: 0.005, // 0.5% slippage tolerance
});

console.log(`Swap completed: ${txHash}`);
```

### Slippage Protection

The `slippage` parameter protects you from price movement:

- `0.005` = 0.5% slippage (safe for most swaps, this is the default)
- `0.01` = 1% slippage (for volatile markets)
- `0.05` = 5% slippage (use with caution)

The value must be a decimal between 0 and 1. If the price moves beyond your slippage tolerance, the transaction reverts.

## Complete Example

Here's a full swap from start to finish:

```typescript
import {
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  approve,
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

// 5. Approve tokens (required before first swap)
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
});

// 6. Execute swap
const txHash = await swap({
  config,
  quote,
  slippage: 0.005, // 0.5% slippage
});

console.log(`Success! Transaction: ${txHash}`);
```

## Using Private Keys for Swaps

If you prefer to execute swaps directly without connecting a wallet (e.g., for backend services, automation, or scripts), you can provide a private key:

```typescript
import {
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  approve,
  swap,
  optimism
} from "sugar-sdk";
import type { Hex } from "viem";

// Setup config (no wallet connection needed)
const config = getDefaultConfig({
  chains: [{ chain: optimism, rpcUrl: "https://mainnet.optimism.io" }]
});

// Get tokens and quote
const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
});

// Approve tokens (required before first swap)
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
  privateKey: process.env.PRIVATE_KEY as Hex,
});

// Execute swap with private key
const txHash = await swap({
  config,
  quote,
  slippage: 0.005, // 0.5% slippage
  privateKey: process.env.PRIVATE_KEY as Hex, // Load from environment
});

console.log(`Swap executed: ${txHash}`);
```

### Private Key vs Connected Wallet

| Feature | Private Key | Connected Wallet |
|---------|-------------|-----------------|
| Use case | Backend services, scripts | User-facing dApps |
| User interaction | None | Requires approval |
| Security | Store securely (env vars, vaults) | Managed by wallet |
| Flexibility | Full programmatic control | Limited to wallet capabilities |

**Security Warning**: Never hardcode private keys or commit them to version control. Always use environment variables or secure key management systems.

## Token Approvals (Required)

**IMPORTANT:** Before executing your first swap with a token, you MUST approve the router to spend your tokens. The SDK does not automatically handle approvals - you must explicitly call the `approve` function:

```typescript
import { approve } from "sugar-sdk";

// Approve tokens before swapping (required)
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress, // From the quote
  amount: 1000000000n, // Amount to approve
  chainId: usdc.chainId,
});

// Now execute the swap
await swap({ config, quote, slippage: 0.005 });
```

The approval needs to be done once per token (or whenever you need to increase the allowance). Use `quote.spenderAddress` to get the correct spender address for approvals.

## Working Without Receipt Confirmation

By default, `swap()` waits for the transaction to be confirmed. For faster responses, disable this:

```typescript
const txHash = await swap({
  config,
  quote,
  slippage: 0.005,
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

  const txHash = await swap({ config, quote, slippage: 0.005 });
  console.log(`Success: ${txHash}`);
} catch (error) {
  console.error("Swap failed:", error.message);
}
```

## Next Steps

- [Getting Calldata](/calldata) - Build custom transactions without executing
- [API: Swaps](/api/swaps) - Full swap function reference
- [API: Approvals](/api/approvals) - Token approval details
