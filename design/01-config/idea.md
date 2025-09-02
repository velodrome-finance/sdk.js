# SDK config

The key configuration elements for the SDK are located in the following files:

- packages/sugar-sdk/src/utils.ts
- packages/sugar-sdk/src/config.ts

Config generation takes place in packages/sugar-sdk/generate-config.ts

## Current configuration setup

1. **Type Definitions** (`config.ts:4-50`): TypeScript interfaces defining the config structure
2. **Generated Configuration** (`config.ts:52+`): Auto-generated configs for Velodrome and Aerodrome
3. **Integration Layer** (`utils.ts:15-39`): Wagmi integration with validation

### Config Generation (`generate-configs.ts`)

- Reads environment variables from `.env` and `.env.velo`/`.env.aero` files
- Transforms env vars using type transformers (string, number, address, arrays)
- Supports per-chain configs via `VITE_PARAM_chainId` pattern
- Supports per-token configs via `VITE_PARAM_tokenAddress` pattern
- Generates TypeScript config objects with proper typing

### Dromes + Wagmi (`utils.ts`)

- `initDrome()` validates chain coverage and attaches config to Wagmi config
- `ensureConnectedChain()` handles chain switching
- Creates `DromeWagmiConfig` extending Wagmi's config with Drome-specific settings


### Current integration

Sugar SDK currently exposes `initDrome()` as the main configuration API. Apps using Sugar SDK are required to do the following:

```ts
import { aerodromeConfig, type DromeWagmiConfig, initDrome, velodromeConfig } from "sugar-sdk";
import { createConfig, http, injected } from "wagmi";
import { base, celo, type Chain, fraxtal, ink, 
  lisk, mainnet, metalL2, mode, optimism, soneium, superseed, swellchain, unichain } from "wagmi/chains";

function getTransports(chains: Chain[]) {
  return Object.fromEntries(
    chains.map((chain) => {
      const rpc = import.meta.env["VITE_RPC_" + chain.id];

      if (!rpc) {
        throw new Error(
          `Missing RPC URL. Please pass VITE_RPC_${chain.id} as an environment variable.`
        );
      }

      return [chain.id, http(rpc, { batch: true })];
    })
  );
}

export let config: DromeWagmiConfig;

if (import.meta.env.MODE === "aero") {
  const aerodromChains = [base, optimism] as [Chain, ...Chain[]];

  config = initDrome(
    createConfig({
      chains: aerodromChains,
      connectors: [injected()],
      transports: getTransports(aerodromChains),
    }),
    {
      ...aerodromeConfig,
      onError(error) {
        console.log(error);
      },
    }
  );
} else if (import.meta.env.MODE === "velo") {
  const velodromChains = [optimism, mode, lisk, /*...*/, mainnet, ] as [Chain, ...Chain[]];

  config = initDrome(
    createConfig({
      chains: velodromChains,
      connectors: [injected()],
      transports: getTransports(velodromChains),
    }),
    {
      ...velodromeConfig,
      onError(error) {
        throw error;
      },
    }
  );
} else {
  throw new Error("Vite mode must be set to aero or velo.");
}
```

## Issues with the current setup

- `aero`/`velo` split: sugar SDK has inherited aero/velo app split which seems to be less relevant/applicable now that the 2 are merging
- `generate-config.ts` does a good job of bootstrapping the initial config module but is likely a liability to maintain moving forward, could we get rid of it and just 
maintain config.ts manually
- individual config parameters are defined at build time and cannot be overridden at runtime (this is OK for the absolute majority of the config params
however some of them could benefit from sane defaults with ability to override them via env vars)
- drome init is a mouthful at the moment; i suspect that majority of the clients could benefit from a more compact (and opinionated)
shortcut that gets them going with a 1 liner with some tweaks available; highly customized setups can still use `initDrome` in all of its glory and
customize it to their heart's content


## Suggested redesign

- switch from auto generated `config.ts` to a manually maintained one
- flatten the config, drop aero/velo split, config chains as if they are all equal in the eyes of God Ether
- support runtime config overrides via both (`CHAIN_PARAM` and `VITE_CHAIN_PARAM`)
- provide a shortcut for drome init with sensible defaults via `getDefaultDrome(...)` so that init phase for most apps is reduced to

```ts
import {getDefaultDrome } from "sugar-sdk";
const config = getDefaultDrome();
```

- initially support chain selection override in `getDefaultDrome` (this has proven useful for Wonderland already, for example)