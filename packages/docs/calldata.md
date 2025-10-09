# Getting Calldata

Sometimes you need the swap transaction data without actually executing it. This is useful for:

- Building custom transaction flows
- Estimating gas costs
- Integrating with smart contracts
- Batching multiple operations

## Basic Usage

Get the encoded calldata for a swap:

```typescript
import { getCallDataForSwap, getListedTokens } from "sugar-sdk";
import { getAccount } from "@wagmi/core";

// Get tokens
const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

// Get your account address
const account = getAccount(config);

// Get calldata
const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n, // 1000 USDC
  account: account.address,
  slippage: 0.005, // 0.5% as decimal
});

if (callData) {
  console.log("Commands:", callData.commands);
  console.log("Inputs:", callData.inputs);
  console.log("Min output:", callData.minAmountOut);
  console.log("Price impact:", callData.priceImpact);
}
```

## What You Get

The returned `CallDataForSwap` object contains:

- `commands` - Encoded command sequence for the Universal Router (as Hex)
- `inputs` - Array of encoded parameters for each command (as Hex[])
- `minAmountOut` - Minimum acceptable output after slippage (as bigint)
- `priceImpact` - Price impact in basis points (as bigint)

## Slippage as Decimal

Unlike `swap()` which takes slippage as a percentage string, `getCallDataForSwap()` takes a decimal:

- `0.005` = 0.5% slippage
- `0.01` = 1% slippage
- `0.05` = 5% slippage

Must be between 0 and 1, or the function throws an error.

## Using the Calldata

Once you have the calldata, you can use it however you need:

### Estimate Gas

```typescript
import { estimateGas } from "@wagmi/core";

const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
  account: account.address,
  slippage: 0.005,
});

if (callData) {
  const gasEstimate = await estimateGas(config, {
    to: config.sugarConfig.chains[0].UNIVERSAL_ROUTER_ADDRESS,
    data: callData.commands,
    // ... additional params
  });

  console.log(`Estimated gas: ${gasEstimate}`);
}
```

### Build Custom Transaction

```typescript
import { sendTransaction } from "@wagmi/core";

const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
  account: account.address,
  slippage: 0.005,
});

if (callData) {
  // Construct transaction manually
  const txHash = await sendTransaction(config, {
    to: config.sugarConfig.chains[0].UNIVERSAL_ROUTER_ADDRESS,
    data: callData.commands,
    value: 0n, // Set value if swapping native token
  });

  console.log(`Transaction sent: ${txHash}`);
}
```

## Complete Example

Here's a full example that gets calldata and uses it:

```typescript
import {
  getDefaultConfig,
  getListedTokens,
  getCallDataForSwap,
  optimism
} from "sugar-sdk";
import { connect, injected, getAccount } from "@wagmi/core";

// 1. Setup
const config = getDefaultConfig({
  chains: [{ chain: optimism, rpcUrl: "https://mainnet.optimism.io" }]
});

// 2. Connect wallet
await connect(config, { connector: injected() });
const account = getAccount(config);

// 3. Get tokens
const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

// 4. Get calldata
const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n, // 1000 USDC
  account: account.address,
  slippage: 0.005,
});

if (!callData) {
  console.error("No swap route found");
  process.exit(1);
}

console.log("Calldata retrieved:");
console.log(`- Commands: ${callData.commands}`);
console.log(`- Min output: ${callData.minAmountOut} WETH`);
console.log(`- Price impact: ${callData.priceImpact} bps`);

// 5. Do something with the calldata
// (e.g., estimate gas, batch with other txs, etc.)
```

## When to Use This

Use `getCallDataForSwap()` instead of `swap()` when you need:

- **Gas estimation** - Estimate costs before committing
- **Custom execution** - Build your own transaction flow
- **Smart contract integration** - Pass calldata to another contract
- **Transaction batching** - Combine multiple operations
- **Advanced control** - Handle transaction submission yourself

For simple swaps, just use [`swap()`](/api/swaps) - it's easier.

## Error Handling

Handle cases where no route exists:

```typescript
const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
  account: account.address,
  slippage: 0.005,
});

if (!callData) {
  console.error("No liquidity route found for this swap");
  return;
}

// Proceed with calldata...
```

Invalid slippage will throw an error:

```typescript
try {
  const callData = await getCallDataForSwap({
    config,
    fromToken: usdc,
    toToken: weth,
    amountIn: 1000000000n,
    account: account.address,
    slippage: 1.5, // Invalid! Must be between 0 and 1
  });
} catch (error) {
  console.error("Invalid slippage:", error.message);
  // "Invalid slippage value. Should be between 0 and 1."
}
```

## Next Steps

- [API: Swaps](/api/swaps) - Full function reference for swaps
- [Swapping Tokens](/swapping) - Learn about the simpler `swap()` function
