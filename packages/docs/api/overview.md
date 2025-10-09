# API Reference

Complete reference for all Sugar SDK functions and types.

## Quick Links

- [Configuration](/api/config) - Setup and initialize the SDK
- [Tokens](/api/tokens) - Fetch token data and balances
- [Swaps](/api/swaps) - Get quotes and execute swaps
- [Approvals](/api/approvals) - Approve token spending

## Core Concepts

### Configuration

Sugar SDK extends wagmi's configuration with multi-chain DeFi settings. You create a config once and use it throughout your app:

```typescript
import { getDefaultConfig, optimism, base } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: "https://mainnet.optimism.io" },
    { chain: base, rpcUrl: "https://mainnet.base.org" }
  ]
});
```

### Tokens

The `Token` type represents an ERC20 token on a specific chain:

```typescript
type Token = {
  symbol: string;        // "USDC"
  name: string;          // "USD Coin"
  address: string;       // "0x..."
  chainId: number;       // 10
  decimals: number;      // 6
  price: string;         // "1.00"
  balance: bigint;       // 0n
  listed: boolean;       // true
  // ... additional fields
};
```

### Quotes

A `Quote` represents a swap route with expected output:

```typescript
type Quote = {
  amountOut: bigint;           // Expected output
  priceImpact: bigint;         // Price impact in bps
  path: /* routing path */;
  fromToken: Token;
  toToken: Token;
  spenderAddress: string;      // Address to approve
};
```

### Amounts as BigInt

All token amounts use `bigint` to handle decimals precisely:

```typescript
// 1000 USDC (6 decimals)
const amount = 1000000000n;

// 1 WETH (18 decimals)
const amount = 1000000000000000000n;

// Helper to convert from decimal
function toAmount(value: number, decimals: number): bigint {
  return BigInt(Math.floor(value * 10 ** decimals));
}

toAmount(1000, 6);  // 1000000000n (1000 USDC)
toAmount(1, 18);    // 1000000000000000000n (1 WETH)
```

## Function Categories

### Configuration Functions

- `getDefaultConfig()` - Create config with sensible defaults
- `init()` - Attach Sugar config to existing wagmi config
- Exported chains: `optimism`, `base`, `mode`, etc.

### Token Functions

- `getListedTokens()` - Fetch all tokens across configured chains

### Swap Functions

- `getQuoteForSwap()` - Get best swap quote
- `swap()` - Execute a swap transaction
- `getCallDataForSwap()` - Get encoded swap calldata

### Approval Functions

- `approve()` - Approve token spending

## Type Exports

All major types are exported for use in your app:

```typescript
import type {
  Config,
  ChainConfig,
  Token,
  Quote,
  SugarWagmiConfig,
} from "sugar-sdk";
```

## Using with TypeScript

The SDK is fully typed. Your editor will provide autocomplete and type checking:

```typescript
import { getQuoteForSwap } from "sugar-sdk";

const quote = await getQuoteForSwap({
  config,        // SugarWagmiConfig
  fromToken,     // Token
  toToken,       // Token
  amountIn,      // bigint
});

// quote is Quote | null
if (quote) {
  console.log(quote.amountOut); // bigint
}
```

## Next Steps

Explore the detailed API documentation:

- [Configuration API](/api/config)
- [Tokens API](/api/tokens)
- [Swaps API](/api/swaps)
- [Approvals API](/api/approvals)
