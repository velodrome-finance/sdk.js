# Approvals API

Function for approving token spending.

## approve()

Approves a spender to transfer tokens on behalf of the caller.

### Signature

```typescript
function approve(params: {
  config: SugarWagmiConfig;
  tokenAddress: string;
  spenderAddress: string;
  amount: bigint;
  chainId: number;
  waitForReceipt?: boolean;
}): Promise<Hex>
```

### Parameters

- `config` - The Sugar SDK configuration
- `tokenAddress` - Address of the ERC20 token contract
- `spenderAddress` - Address that will be approved to spend tokens
- `amount` - Amount to approve as bigint
- `chainId` - Chain ID where the approval should occur
- `waitForReceipt` - Wait for transaction confirmation (default: true)

### Returns

`Promise<Hex>` - Transaction hash of the approval transaction

### Example

```typescript
import { approve } from "sugar-sdk";

const txHash = await approve({
  config,
  tokenAddress: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  spenderAddress: "0x4bF3E32de155359D1D75e8B474b66848221142fc",
  amount: 1000000000n, // 1000 USDC
  chainId: 10, // Optimism
});

console.log(`Approval tx: ${txHash}`);
```

### Details

This function:
- Submits an ERC20 `approve()` transaction
- Allows the spender to transfer up to `amount` tokens
- Optionally waits for transaction confirmation

Use this before swapping if the router doesn't have sufficient allowance.

---

## When to Approve

Token approvals are required before a contract can spend your tokens. You need to approve:

1. **Before first swap** - Router needs approval to spend your tokens
2. **When allowance is insufficient** - Previous approval amount was too small
3. **After approval is revoked** - You or another contract set allowance to 0

### Check Allowance

To check if approval is needed:

```typescript
import { readContract } from "@wagmi/core";

const allowance = await readContract(config, {
  address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // USDC
  abi: [
    {
      name: "allowance",
      type: "function",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
  ],
  functionName: "allowance",
  args: [accountAddress, spenderAddress],
});

if (allowance < amountToSwap) {
  // Need approval
  await approve({ config, tokenAddress, spenderAddress, amount, chainId });
}
```

---

## Approval Patterns

### Approve Exact Amount

Only approve what you need for this swap:

```typescript
import { getQuoteForSwap, approve, swap } from "sugar-sdk";

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
});

// Approve exact amount
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: 1000000000n, // Exact swap amount
  chainId: usdc.chainId,
});

await swap({ config, quote, slippagePct: "50" });
```

**Pros:** Maximum security, minimal risk exposure
**Cons:** Need new approval for each swap

### Approve Large Amount

Approve a large amount once to avoid repeated approvals:

```typescript
// Approve max uint256 (infinite approval)
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: 2n ** 256n - 1n, // Max uint256
  chainId: usdc.chainId,
});

// Now can swap multiple times without re-approving
await swap({ config, quote1, slippagePct: "50" });
await swap({ config, quote2, slippagePct: "50" });
// etc...
```

**Pros:** Convenient, fewer transactions
**Cons:** Higher risk if router is compromised

### Approve with Buffer

Approve a reasonable amount with some buffer:

```typescript
const approvalAmount = quote.amount * 110n / 100n; // 10% buffer

await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: approvalAmount,
  chainId: usdc.chainId,
});
```

**Pros:** Balance between security and convenience
**Cons:** May still need periodic re-approvals

---

## Get Spender Address

The spender address depends on which chain you're swapping on. Get it from the quote:

```typescript
const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
});

// Use spender from quote
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress, // Correct spender for this chain
  amount: quote.amount,
  chainId: usdc.chainId,
});
```

Or get it from the config:

```typescript
// Get Universal Router address for specific chain
const chainConfig = config.sugarConfig.chains.find(
  c => c.CHAIN.id === 10
);

const spenderAddress = chainConfig.UNIVERSAL_ROUTER_ADDRESS;

await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress,
  amount: 1000000000n,
  chainId: 10,
});
```

---

## Wait for Confirmation

By default, `approve()` waits for the transaction to be confirmed:

```typescript
// Waits for confirmation (default)
const txHash = await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: 1000000000n,
  chainId: 10,
});
console.log("Approval confirmed!");

// Now safe to swap
await swap({ config, quote, slippagePct: "50" });
```

For faster responses, disable waiting:

```typescript
// Returns immediately after submission
const txHash = await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: 1000000000n,
  chainId: 10,
  waitForReceipt: false,
});
console.log("Approval submitted (pending...)");

// IMPORTANT: Wait before swapping!
// The swap will fail if approval isn't confirmed yet
```

---

## Complete Examples

### Full Swap Flow with Approval

```typescript
import {
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  approve,
  swap,
  optimism,
} from "sugar-sdk";
import { connect, injected } from "@wagmi/core";

// 1. Setup
const config = getDefaultConfig({
  chains: [{ chain: optimism, rpcUrl: "https://mainnet.optimism.io" }],
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
  console.error("No route found");
  process.exit(1);
}

// 5. Approve token spending
console.log("Approving USDC...");
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
});
console.log("Approval confirmed!");

// 6. Execute swap
console.log("Executing swap...");
const txHash = await swap({
  config,
  quote,
  slippagePct: "50",
});

console.log(`Success! Transaction: ${txHash}`);
```

### One-time vs Infinite Approval

```typescript
// For single swap: approve exact amount
async function swapOnce(config, quote) {
  await approve({
    config,
    tokenAddress: quote.fromToken.address,
    spenderAddress: quote.spenderAddress,
    amount: quote.amount, // Exact amount
    chainId: quote.fromToken.chainId,
  });

  return await swap({ config, quote, slippagePct: "50" });
}

// For multiple swaps: approve large amount
async function approveForever(config, tokenAddress, spenderAddress, chainId) {
  await approve({
    config,
    tokenAddress,
    spenderAddress,
    amount: 2n ** 256n - 1n, // Max uint256
    chainId,
  });
  console.log("Infinite approval granted - be careful!");
}

// Use pattern based on your needs
await swapOnce(config, quote1);                    // Secure
await approveForever(config, usdc.address, ...);   // Convenient
```

### Checking and Refreshing Allowance

```typescript
import { readContract } from "@wagmi/core";

const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];

async function ensureAllowance(config, token, spender, amount, account) {
  // Check current allowance
  const currentAllowance = await readContract(config, {
    address: token.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account, spender],
    chainId: token.chainId,
  });

  if (currentAllowance >= amount) {
    console.log("Sufficient allowance already exists");
    return;
  }

  // Need approval
  console.log("Insufficient allowance, approving...");
  await approve({
    config,
    tokenAddress: token.address,
    spenderAddress: spender,
    amount,
    chainId: token.chainId,
  });
  console.log("Approval complete");
}

// Use before swapping
await ensureAllowance(config, usdc, quote.spenderAddress, quote.amount, account);
await swap({ config, quote, slippagePct: "50" });
```

---

## Error Handling

Handle approval failures gracefully:

```typescript
try {
  await approve({
    config,
    tokenAddress: usdc.address,
    spenderAddress: quote.spenderAddress,
    amount: 1000000000n,
    chainId: 10,
  });
  console.log("Approval successful");
} catch (error) {
  if (error.message.includes("User rejected")) {
    console.log("User cancelled approval");
  } else {
    console.error("Approval failed:", error.message);
  }
}
```

---

## Security Considerations

### Approval Risks

When you approve a contract to spend your tokens:

- The contract can transfer up to the approved amount at any time
- If the contract is compromised, your approved tokens are at risk
- Approvals persist across sessions (until revoked or spent)

### Best Practices

1. **Approve only trusted contracts** - Sugar SDK uses audited Universal Router contracts
2. **Use exact amounts** - Only approve what you need for each transaction
3. **Revoke unused approvals** - Set allowance to 0 when done
4. **Monitor approvals** - Check your active approvals periodically

### Revoking Approvals

Set allowance to 0 to revoke:

```typescript
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: routerAddress,
  amount: 0n, // Revoke approval
  chainId: 10,
});
```

---

## Next Steps

- [Swaps API](/api/swaps) - Execute swaps
- [Swapping Guide](/swapping) - Full swap tutorial
- [Getting Started](/getting-started) - SDK setup
