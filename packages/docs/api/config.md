# Configuration API

Functions and types for configuring Sugar SDK.

## getDefaultConfig()

Creates a default Sugar SDK configuration with sensible defaults.

### Signature

```typescript
function getDefaultConfig(params: {
  chains: { chain: Chain; rpcUrl: string }[];
}): SugarWagmiConfig
```

### Parameters

- `chains` - Array of chain configurations
  - `chain` - Chain object from `@wagmi/core/chains` or sugar-sdk exports
  - `rpcUrl` - RPC endpoint URL for the chain

### Returns

`SugarWagmiConfig` - A combined wagmi + Sugar configuration object

### Example

```typescript
import { getDefaultConfig, optimism, base } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: "https://mainnet.optimism.io" },
    { chain: base, rpcUrl: "https://mainnet.base.org" }
  ]
});

// Use config throughout your app
const tokens = await getListedTokens({ config });
```

### Details

This function:
- Creates a wagmi config with injected wallet connector
- Configures HTTP transports with batching enabled
- Filters `baseConfig` to include only specified chains
- Returns combined config with `sugarConfig` property

For most apps, this is the easiest way to get started.

---

## init()

Attaches Sugar SDK configuration to an existing wagmi config instance.

### Signature

```typescript
function init<T extends WagmiCoreConfig>(
  wagmiConfig: T,
  sugarConfig: Config
): SugarWagmiConfig
```

### Parameters

- `wagmiConfig` - Your wagmi configuration instance
- `sugarConfig` - Sugar configuration object (typically `baseConfig` or a customized version)

### Returns

`SugarWagmiConfig` - Combined configuration with both wagmi and Sugar settings

### Example

```typescript
import { createConfig } from "@wagmi/core";
import { baseConfig, init } from "sugar-sdk";

// Create custom wagmi config
const wagmiConfig = createConfig({
  chains: [optimism, base],
  transports: {
    10: http("https://mainnet.optimism.io"),
    8453: http("https://mainnet.base.org"),
  },
  // ... other wagmi options
});

// Attach Sugar config
const config = init(wagmiConfig, {
  ...baseConfig,
  // Customize Sugar settings
  MAX_HOPS: 5,
  POOLS_PAGE_SIZE: 500,
});
```

### Details

Use this when you need:
- Custom wagmi configuration
- Modified Sugar settings
- Integration with existing wagmi setup

---

## baseConfig

Default configuration object with settings for all supported chains.

### Type

```typescript
const baseConfig: Config
```

### Properties

- `DEFAULT_TOKEN_ORDER` - Preferred token order for UIs
- `PRICE_THRESHOLD_FILTER` - Price threshold value
- `MAX_HOPS` - Maximum routing hops (default: 3)
- `POOLS_PAGE_SIZE` - Pools per page (default: 300)
- `TOKENS_PAGE_SIZE` - Tokens per page (default: 1000)
- `DEFAULT_CHAIN_ID` - Default chain (default: 10 for Optimism)
- `chains` - Array of all supported chain configurations
- `tokens` - Token-specific configurations
- `onError` - Optional error handler callback

### Example

```typescript
import { baseConfig } from "sugar-sdk";

console.log(baseConfig.MAX_HOPS);           // 3
console.log(baseConfig.DEFAULT_CHAIN_ID);   // 10
console.log(baseConfig.chains.length);      // 12

// Customize it
const customConfig = {
  ...baseConfig,
  MAX_HOPS: 5,
  onError: (error) => console.error("SDK error:", error),
};
```

---

## Exported Chains

Sugar SDK re-exports all supported chain objects for convenience:

```typescript
import {
  optimism,   // Chain ID 10
  unichain,   // Chain ID 130
  fraxtal,    // Chain ID 252
  lisk,       // Chain ID 1135
  metalL2,    // Chain ID 1750
  soneium,    // Chain ID 1868
  swellchain, // Chain ID 1923
  superseed,  // Chain ID 5330
  base,       // Chain ID 8453
  mode,       // Chain ID 34443
  celo,       // Chain ID 42220
  ink,        // Chain ID 57073
} from "sugar-sdk";
```

### Example

```typescript
import { getDefaultConfig, optimism, base, mode } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: process.env.OP_RPC },
    { chain: base, rpcUrl: process.env.BASE_RPC },
    { chain: mode, rpcUrl: process.env.MODE_RPC },
  ]
});
```

---

## supportedChains

Array of all chains supported by Sugar SDK.

### Type

```typescript
const supportedChains: Chain[]
```

### Example

```typescript
import { supportedChains } from "sugar-sdk";

console.log(`Sugar SDK supports ${supportedChains.length} chains`);

supportedChains.forEach(chain => {
  console.log(`${chain.name} (${chain.id})`);
});
```

---

## Types

### Config

Main configuration type for Sugar SDK.

```typescript
type Config = {
  readonly DEFAULT_TOKEN_ORDER: string[];
  readonly PRICE_THRESHOLD_FILTER: number;
  readonly MAX_HOPS: number;
  readonly QUOTER_STABLE_POOL_FILLER: number;
  readonly QUOTER_VOLATILE_POOL_FILLER: number;
  readonly PRICE_MAPS: PriceMap;
  readonly POOLS_PAGE_SIZE: number;
  readonly TOKENS_PAGE_SIZE: number;
  readonly TOKEN_BRIDGE?: Address;
  readonly DEFAULT_CHAIN_ID: number;
  readonly chains: ReadonlyArray<ChainConfig>;
  readonly tokens: { [tokenAddress: Address]: TokenConfig };
  onError?: (error: unknown) => void;
};
```

### ChainConfig

Configuration for a specific blockchain network.

```typescript
type ChainConfig = {
  CHAIN: Chain;
  CONNECTOR_TOKENS: Address[];
  STABLE_TOKEN: Address;
  DEFAULT_TOKENS: Address[];
  WRAPPED_NATIVE_TOKEN?: Address;
  WETH_ADDRESS?: Address;
  UNSAFE_TOKENS?: Address[];
  LP_SUGAR_ADDRESS: Address;
  REWARDS_SUGAR_ADDRESS: Address;
  ROUTER_ADDRESS: Address;
  PRICES_ADDRESS: Address;
  VOTER_ADDRESS: Address;
  QUOTER_ADDRESS: Address;
  UNIVERSAL_ROUTER_ADDRESS: Address;
  SLIPSTREAM_SUGAR_ADDRESS: Address;
  NFPM_ADDRESS: Address;
  VE_SUGAR_ADDRESS?: Address;
  RELAY_SUGAR_ADDRESS?: Address;
};
```

### SugarWagmiConfig

Combined Wagmi and Sugar configuration type.

```typescript
type SugarWagmiConfig = WagmiCoreConfig & {
  sugarConfig: Config;
};
```

This is the main config type you'll use throughout the SDK.

---

## Next Steps

- [Tokens API](/api/tokens) - Fetch token data
- [Swaps API](/api/swaps) - Execute swaps
- [Getting Started Guide](/getting-started) - Setup walkthrough
