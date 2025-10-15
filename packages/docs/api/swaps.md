# Swaps API

Functions and types for getting quotes and executing token swaps.

## getQuoteForSwap()

Fetches the best quote for swapping between two tokens.

### Signature

```typescript
function getQuoteForSwap(params: {
  config: SugarWagmiConfig;
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
}): Promise<Quote | null>
```

### Parameters

- `config` - The Sugar SDK configuration
- `fromToken` - Token being sold
- `toToken` - Token being bought
- `amountIn` - Amount to swap as bigint (in token's smallest unit)

### Returns

`Promise<Quote | null>` - Best quote found, or null if no route exists

### Example

```typescript
import { getQuoteForSwap, getListedTokens } from "sugar-sdk";

const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n, // 1000 USDC (6 decimals)
});

if (quote) {
  console.log(`Expected: ${quote.amountOut} WETH`);
  console.log(`Impact: ${quote.priceImpact} bps`);
}
```

### Details

This function:
- Analyzes all available liquidity pools
- Finds optimal routing paths (up to `MAX_HOPS`)
- Fetches quotes from on-chain quoter contract
- Returns best route by output amount

May return `null` if:
- No liquidity path exists between tokens
- Tokens are on different chains
- Amount is too small/large for available liquidity

---

## swap()

Executes a token swap transaction on-chain.

### Signature

```typescript
function swap(params: {
  config: SugarWagmiConfig;
  quote: Quote;
  slippage?: number;
  waitForReceipt?: boolean;
  privateKey?: Hex;
}): Promise<string>
```

### Parameters

- `config` - The Sugar SDK configuration
- `quote` - Quote from `getQuoteForSwap()`
- `slippage` - Slippage tolerance as decimal between 0 and 1 (default: 0.005 for 0.5%)
- `waitForReceipt` - Wait for confirmation (default: true)
- `privateKey` - Optional private key for direct transaction signing. If provided, executes swap using this key instead of a connected wallet

### Returns

`Promise<string>` - Transaction hash

### Throws

- If transaction fails or reverts
- If user rejects transaction (when using connected wallet)
- If insufficient balance or allowance
- If no connected account is found and no private key is provided

### Example

```typescript
import { getQuoteForSwap, swap, approve } from "sugar-sdk";

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
});

if (!quote) {
  throw new Error("No swap route found");
}

// IMPORTANT: Approve tokens before swapping
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
});

const txHash = await swap({
  config,
  quote,
  slippage: 0.005, // 0.5% slippage
});

console.log(`Swap complete: ${txHash}`);
```

### Example with Private Key

For backend services or scripts, use a private key instead of a connected wallet:

```typescript
import { getQuoteForSwap, swap, approve } from "sugar-sdk";
import type { Hex } from "viem";

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
});

if (!quote) {
  throw new Error("No swap route found");
}

// IMPORTANT: Approve tokens before swapping (also requires privateKey)
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
  privateKey: process.env.PRIVATE_KEY as Hex,
});

const txHash = await swap({
  config,
  quote,
  slippage: 0.005, // 0.5% slippage
  privateKey: process.env.PRIVATE_KEY as Hex, // Load from environment
});

console.log(`Swap complete: ${txHash}`);
```

**Security Note**: Never hardcode private keys. Always use environment variables or secure key management systems.

### Slippage Values

The `slippage` parameter is a decimal between 0 and 1:

- `0.005` = 0.5% (recommended for most swaps, this is the default)
- `0.01` = 1%
- `0.05` = 5%
- `0.1` = 10%

If actual price moves beyond this tolerance, the transaction reverts.

### Wait for Receipt

By default, `swap()` waits for transaction confirmation:

```typescript
// Waits for confirmation (default)
const txHash = await swap({ config, quote });
console.log("Swap confirmed!");

// Returns immediately after submission
const txHash = await swap({
  config,
  quote,
  waitForReceipt: false,
});
console.log("Swap submitted (pending...)");
```

### Details

This function:
- Supports two execution modes:
  - **Connected wallet**: Uses wagmi connectors for user-facing dApps
  - **Private key**: Direct signing for backend services and scripts
- Automatically switches to correct chain if needed (when using connected wallet)
- Submits transaction via Universal Router
- Optionally waits for confirmation
- Validates transaction success

**IMPORTANT:** This function does NOT handle token approvals. Before calling `swap()`, you MUST call [`approve()`](/api/approvals) to grant the spender contract permission to spend your tokens. Use `quote.spenderAddress` as the spender and approve at least `quote.amount` of the `fromToken`.

---

## getCallDataForSwap()

Generates encoded call data for a swap without executing it.

### Signature

```typescript
function getCallDataForSwap(params: {
  config: SugarWagmiConfig;
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  account: Address;
  slippage: number;
}): Promise<CallDataForSwap | null>
```

### Parameters

- `config` - The Sugar SDK configuration
- `fromToken` - Token being sold
- `toToken` - Token being bought
- `amountIn` - Amount to swap as bigint
- `account` - Address executing the swap
- `slippage` - Slippage tolerance as decimal (0-1)

### Returns

`Promise<CallDataForSwap | null>` - Encoded calldata, or null if no route

### Throws

- If slippage is not between 0 and 1

### Example

```typescript
import { getCallDataForSwap } from "sugar-sdk";
import { getAccount } from "@wagmi/core";

const account = getAccount(config);

const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
  account: account.address,
  slippage: 0.005, // 0.5% as decimal
});

if (callData) {
  console.log("Commands:", callData.commands);
  console.log("Inputs:", callData.inputs);
  console.log("Min out:", callData.minAmountOut);
}
```

### Slippage as Decimal

Unlike `swap()`, this function takes slippage as a decimal:

- `0.005` = 0.5%
- `0.01` = 1%
- `0.05` = 5%

Must be between 0 and 1 or the function throws.

### Details

Use this when you need:
- Gas estimation
- Custom transaction execution
- Smart contract integration
- Transaction batching

For simple swaps, use `swap()` instead.

---

## Quote Type

Represents a swap route with expected output.

### Type Definition

```typescript
type Quote = {
  amountOut: bigint;        // Expected output amount
  priceImpact: bigint;      // Price impact in basis points
  path: /* routing path */; // Internal routing info
  fromToken: Token;         // Source token
  toToken: Token;           // Destination token
  amount: bigint;           // Input amount
  spenderAddress: string;   // Address to approve for spending
};
```

### Field Details

#### amountOut
Expected output amount as bigint, in token's smallest unit.

Convert to human-readable:
```typescript
const humanAmount = Number(quote.amountOut) / 10 ** quote.toToken.decimals;
console.log(`You'll receive ${humanAmount} ${quote.toToken.symbol}`);
```

#### priceImpact
Price impact in basis points (bps).

Convert to percentage:
```typescript
const impactPct = Number(quote.priceImpact) / 100;
console.log(`Price impact: ${impactPct}%`);
```

High price impact (>5%) indicates:
- Low liquidity
- Large trade size relative to pool
- Potential front-running risk

#### spenderAddress
Address that needs approval to spend your tokens.

Use this with `approve()`:
```typescript
await approve({
  config,
  tokenAddress: quote.fromToken.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: quote.fromToken.chainId,
});
```

---

## CallDataForSwap Type

Contains encoded transaction data for a swap.

### Type Definition

```typescript
interface CallDataForSwap {
  commands: Hex;          // Encoded command sequence
  inputs: Hex[];          // Encoded parameters
  minAmountOut: bigint;   // Minimum output after slippage
  priceImpact: bigint;    // Price impact in bps
}
```

### Field Details

#### commands
Encoded command sequence for the Universal Router as a hex string.

Pass this to the router's `execute()` function.

#### inputs
Array of encoded parameters for each command.

Each input corresponds to a command in the sequence.

#### minAmountOut
Minimum acceptable output amount after applying slippage.

If actual output is less, the transaction reverts.

#### priceImpact
Price impact of the swap in basis points.

Same as `Quote.priceImpact`.

---

## Complete Examples

### Basic Swap Flow

```typescript
import { getListedTokens, getQuoteForSwap, approve, swap } from "sugar-sdk";

// 1. Get tokens
const tokens = await getListedTokens({ config });
const usdc = tokens.find(t => t.symbol === "USDC" && t.chainId === 10);
const weth = tokens.find(t => t.symbol === "WETH" && t.chainId === 10);

// 2. Get quote
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

// 3. Approve tokens (required before first swap)
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: usdc.chainId,
});

// 4. Execute swap
const txHash = await swap({
  config,
  quote,
  slippage: 0.005,
});

console.log(`Success: ${txHash}`);
```

### With Approval

```typescript
import { getQuoteForSwap, swap, approve } from "sugar-sdk";

const quote = await getQuoteForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
});

// Approve tokens first
await approve({
  config,
  tokenAddress: usdc.address,
  spenderAddress: quote.spenderAddress,
  amount: 1000000000n,
  chainId: usdc.chainId,
});

// Now execute swap
await swap({ config, quote, slippage: 0.005 });
```

### Using Calldata

```typescript
import { getCallDataForSwap } from "sugar-sdk";
import { sendTransaction, getAccount } from "@wagmi/core";

const account = getAccount(config);

const callData = await getCallDataForSwap({
  config,
  fromToken: usdc,
  toToken: weth,
  amountIn: 1000000000n,
  account: account.address,
  slippage: 0.005,
});

if (callData) {
  // Custom transaction execution
  const txHash = await sendTransaction(config, {
    to: config.sugarConfig.chains[0].UNIVERSAL_ROUTER_ADDRESS,
    data: callData.commands,
  });
  console.log(`Sent: ${txHash}`);
}
```

### Error Handling

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

  const txHash = await swap({
    config,
    quote,
    slippage: 0.005,
  });

  console.log(`Success: ${txHash}`);
} catch (error) {
  if (error.message.includes("User rejected")) {
    console.log("User cancelled the transaction");
  } else if (error.message.includes("insufficient")) {
    console.log("Insufficient balance or allowance");
  } else {
    console.error("Swap failed:", error.message);
  }
}
```

---

## Next Steps

- [Approvals API](/api/approvals) - Handle token approvals
- [Swapping Guide](/swapping) - Full tutorial
- [Calldata Guide](/calldata) - Working with calldata
