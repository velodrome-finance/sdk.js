# Core API

This is the lowest level public API Sugar SDK exposes. It might be somewhat verbose but should serve as a good foundation to get you started. This API is usable in both nodejs and web environments. For React friendly bindings check out [Using with React](/using-react) docs.

## Quick Links

- [Configuration](/api/config) – Setup and initialize the SDK
- [Tokens](/api/tokens) – Fetch token data and balances
- [Swaps](/api/swaps) – Quotes, calldata, and swap execution
- [Approvals](/api/approvals) – Handle ERC20 allowances

## Core Concepts

### Configuration

Sugar SDK extends Wagmi's [configuration](https://wagmi.sh/core/api/createConfig#config) with Sugar specific settings. You create a config once and use it throughout your app:

```typescript
import { getDefaultConfig, optimism, base } from "@dromos-labs/sdk.js";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: "https://mainnet.optimism.io" },
    { chain: base, rpcUrl: "https://mainnet.base.org" }
  ]
});
```

### Calling Sugar functions

All Sugar functionality is exposed via async functions that receive Sugar config object you've created above alongside some function specific parameters. You can learn about which specific params are available in the corresponding sections

### Amounts as BigInt

All parameters that deal with amounts of tokens use `bigint` and take into consideration number of decimals for specific token:

```typescript
// 1000 USDC (6 decimals)
const amountUSDC = 1000000000n;

// 1 WETH (18 decimals)
const amountWETH = 1000000000000000000n;
```
