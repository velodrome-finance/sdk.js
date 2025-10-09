# Getting Started

Let's get you up and running with Sugar SDK in under 5 minutes.

## Installation

Install the SDK and its peer dependencies:

```bash
npm install sugar-sdk @wagmi/core viem
```

## Quick Setup

Configure the SDK with the chains you want to use:

```typescript
import { getDefaultConfig, base, optimism } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: "https://mainnet.optimism.io" },
    { chain: base, rpcUrl: "https://mainnet.base.org" }
  ]
});
```

That's it! You're ready to start using the SDK.

## Supported Chains

Sugar SDK works across 12 chains:

- **Optimism** (10)
- **Unichain** (130)
- **Fraxtal** (252)
- **Lisk** (1135)
- **Metal L2** (1750)
- **Soneium** (1868)
- **Swellchain** (1923)
- **Superseed** (5330)
- **Base** (8453)
- **Mode** (34443)
- **Celo** (42220)
- **Ink** (57073)

## Hello World: Fetching Tokens

Here's a complete example that fetches tokens across all configured chains:

```typescript
import { getDefaultConfig, getListedTokens, base, optimism } from "sugar-sdk";

// Setup config
const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: "https://mainnet.optimism.io" },
    { chain: base, rpcUrl: "https://mainnet.base.org" }
  ]
});

// Fetch all tokens
const tokens = await getListedTokens({ config });

// Print results
console.log(`Found ${tokens.length} tokens across all chains:`);

tokens.slice(0, 10).forEach(token => {
  console.log(`${token.symbol} on chain ${token.chainId}: $${token.price}`);
});
```

**Output:**
```
Found 234 tokens across all chains:
WETH on chain 10: $3245.67
USDC on chain 10: $1.00
AERO on chain 8453: $0.85
...
```

## What's in a Token?

Each token object includes:

- `symbol` - Token symbol (e.g., "USDC")
- `name` - Full token name
- `address` - Contract address
- `chainId` - Chain where token exists
- `decimals` - Token decimals (typically 18 or 6)
- `price` - Current USD price
- `balance` - Your balance (if wallet connected)
- `listed` - Whether token appears in default UI lists

## Using with a Wallet

To connect a wallet and fetch balances, use wagmi's `connect` function before calling SDK methods:

```typescript
import { connect, injected } from "@wagmi/core";

// Connect wallet
await connect(config, { connector: injected() });

// Now token balances will be populated
const tokens = await getListedTokens({ config });
```

## Next Steps

Now that you can fetch tokens, let's learn how to swap them:

- [Swapping Tokens](/swapping) - Get quotes and execute swaps
- [Getting Calldata](/calldata) - Build custom swap transactions
- [API Reference](/api/overview) - Complete API documentation
