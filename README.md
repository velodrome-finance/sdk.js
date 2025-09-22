![Sugar](sugar.png)

# Sugar SDK

Sugar SDK for JS and TS developers.

## Configuration

The following chains are currently supported by Sugar SDK

- Optimism (10)
- Unichain (130)
- Fraxtal (252)
- Lisk (1135)
- Metal L2 (1750)
- Soneium (1868) 
- Swellchain (1923) 
- Superseed (5330)
- Base (8453)
- Mode (34443)
- Celo (42220)
- Ink (57073)

Sugar config attaches itself onto an existing wagmi config instance so downstream callers can consume both wagmi and sugar specific settings from a single object (using `sugarConfig` prop).

The easiest way to get started with Sugar is using `getDefaultConfig`

```ts
import { getDefaultConfig, base, optimism } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: process.env.OP_RPC! },
    { chain: base, rpcUrl: process.env.BASE_RPC! },
  ]
});
```

If you want to customize how Wagmi is set up and tweak additional sugar config options, you can use `init` helper

```ts
import { createConfig } from "@wagmi/core";
import { baseConfig, init } from "sugar-sdk";

const wagmiConfig = createConfig(/* ... */);

const customConfig = init(wagmiConfig, {
  ...baseConfig,
  // customize base config here
});
```

## Hacking on sugar locally

Make sure you have the right version of node activated and install all the dependencies 

```bash
nvm use && npm i
```

Make sure the SDK builds correctly:

```bash
cd packages/sugar-sdk && npm run build
```

## Tests

Start honey

```
cd packages/honey && npm start
```

Run tests

```
npm test
```

## Abis

Regenerate 

```
cd packages/sugar-sdk  && npx @wagmi/cli generate YOUR_ETHERSCAN_KEY_HERE
```
