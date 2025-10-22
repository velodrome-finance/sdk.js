![Sugar](sugar.png)

# Sugar SDK

Sugar SDK for JS and TS developers.

## Getting Started

Install the SDK alongside its peer dependencies:

```bash
npm install \
  https://github.com/velodrome-finance/sdk.js/releases/tag/v0.3.0-alpha.1 \
  @wagmi/core \
  viem
```

Create a multi-chain configuration with `getDefaultConfig`. The helper wraps wagmi's `createConfig`, wires transports, and filters the built-in `baseConfig` down to the chains you care about. The result is a `SugarWagmiConfig`, which you pass to every SDK function.

```typescript
import { getDefaultConfig, getListedTokens, optimism, base } from "sugar-sdk";

const config = getDefaultConfig({
  chains: [
    { chain: optimism, rpcUrl: process.env.OP_RPC! },
    { chain: base, rpcUrl: process.env.BASE_RPC! },
  ],
});

const tokens = await getListedTokens({ config });
```

## Hacking on sugar locally

Make sure you have the right version of node activated and install all the dependencies 

```bash
nvm use && npm i
```

Use `.env.example` to populate `.env` inside packages

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
