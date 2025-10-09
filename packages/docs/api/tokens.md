# Tokens API

Functions and types for fetching token data.

## getListedTokens()

Retrieves all listed tokens across all configured chains.

### Signature

```typescript
function getListedTokens(params: {
  config: SugarWagmiConfig;
}): Promise<Token[]>
```

### Parameters

- `config` - The Sugar SDK configuration

### Returns

`Promise<Token[]>` - Array of tokens sorted by configured order

### Example

```typescript
import { getListedTokens } from "sugar-sdk";

const tokens = await getListedTokens({ config });

console.log(`Found ${tokens.length} tokens`);

// Filter by chain
const optimismTokens = tokens.filter(t => t.chainId === 10);

// Find specific token
const usdc = tokens.find(t =>
  t.symbol === "USDC" && t.chainId === 10
);

// Check price
console.log(`USDC price: $${usdc.price}`);
```

### Details

This function:
- Fetches tokens from all chains in your config
- Includes balances for connected wallets
- Fetches current USD prices
- Merges and sorts results by `DEFAULT_TOKEN_ORDER`
- Handles errors gracefully (failed chains are logged but don't stop execution)

### Performance

Token fetching uses:
- Pagination for large token lists
- Parallel requests across chains
- Chunked price fetching to avoid gas limits

First call may take 2-3 seconds depending on number of chains.

---

## Token Type

Represents an ERC20 token on a specific chain.

### Type Definition

```typescript
type Token = {
  // Basic info
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  decimals: number;

  // Pricing & balances
  price: string;          // USD price
  balance: bigint;        // User's balance (0n if not connected)

  // Metadata
  listed: boolean;        // Appears in default lists
  logoURI?: string;       // Token logo URL

  // Internal fields (for advanced use)
  // ... additional fields used by routing engine
};
```

### Field Details

#### symbol
The token's trading symbol (e.g., "USDC", "WETH", "AERO").

Some tokens have custom symbols defined in config (e.g., "USDC.e" for bridged USDC).

#### name
Full token name (e.g., "USD Coin", "Wrapped Ether").

#### address
Token contract address as a hex string. Lowercase.

Native tokens (ETH, CELO) use special addresses like "eth" or "celo".

#### chainId
The numeric chain ID where this token exists:
- 10 = Optimism
- 8453 = Base
- 34443 = Mode
- etc.

#### decimals
Number of decimal places. Most tokens use 18, stablecoins typically use 6.

Used for converting between human-readable and bigint amounts:
```typescript
// 1000 USDC (6 decimals)
const amount = 1000n * 10n ** 6n; // 1000000000n

// 1 WETH (18 decimals)
const amount = 1n * 10n ** 18n;   // 1000000000000000000n
```

#### price
Current USD price as a string (e.g., "1.00", "3245.67").

Fetched from on-chain oracle contracts.

#### balance
User's token balance as bigint. Returns `0n` if:
- No wallet connected
- User has no balance
- Balance fetch failed

Convert to human-readable:
```typescript
const humanBalance = Number(token.balance) / 10 ** token.decimals;
console.log(`Balance: ${humanBalance} ${token.symbol}`);
```

#### listed
Whether this token appears in default UI token lists.

Unlisted tokens exist on-chain but aren't promoted in interfaces.

---

## Working with Token Amounts

Token amounts use `bigint` for precision. Here are helper patterns:

### Convert to BigInt

```typescript
function toTokenAmount(value: number, decimals: number): bigint {
  return BigInt(Math.floor(value * 10 ** decimals));
}

// 1000 USDC (6 decimals)
const amount = toTokenAmount(1000, 6);
// 1000000000n

// 1.5 WETH (18 decimals)
const amount = toTokenAmount(1.5, 18);
// 1500000000000000000n
```

### Convert from BigInt

```typescript
function fromTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

const usdc = tokens.find(t => t.symbol === "USDC");
const humanAmount = fromTokenAmount(usdc.balance, usdc.decimals);
console.log(`You have ${humanAmount} USDC`);
```

### Format for Display

```typescript
function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxDecimals: number = 4
): string {
  const value = Number(amount) / 10 ** decimals;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

console.log(formatTokenAmount(1000000000n, 6));    // "1,000"
console.log(formatTokenAmount(1500000000000000000n, 18)); // "1.5"
```

---

## Filtering and Sorting

### By Chain

```typescript
const tokens = await getListedTokens({ config });

// Get tokens for specific chain
const baseTokens = tokens.filter(t => t.chainId === 8453);

// Get tokens across multiple chains
const targetChains = [10, 8453]; // Optimism and Base
const multiChainTokens = tokens.filter(t =>
  targetChains.includes(t.chainId)
);
```

### By Symbol

```typescript
// Find all USDC variants across chains
const usdcTokens = tokens.filter(t =>
  t.symbol.includes("USDC")
);

// Find specific token on specific chain
const usdc = tokens.find(t =>
  t.symbol === "USDC" && t.chainId === 10
);
```

### By Balance

```typescript
// Get tokens user holds
const ownedTokens = tokens.filter(t => t.balance > 0n);

// Sort by balance value
const sortedByValue = ownedTokens.sort((a, b) => {
  const aValue = Number(a.balance) * parseFloat(a.price);
  const bValue = Number(b.balance) * parseFloat(b.price);
  return bValue - aValue; // Descending
});
```

### Listed Only

```typescript
// Get only tokens that appear in default lists
const listedTokens = tokens.filter(t => t.listed);
```

---

## Error Handling

Token fetching handles errors gracefully:

```typescript
import { getListedTokens } from "sugar-sdk";

try {
  const tokens = await getListedTokens({ config });

  if (tokens.length === 0) {
    console.warn("No tokens found");
  }

  // Use tokens...
} catch (error) {
  console.error("Failed to fetch tokens:", error);
}
```

If individual chains fail:
- SDK logs errors internally (or calls `onError` callback)
- Returns tokens from successful chains
- Doesn't throw

To handle chain-specific failures:

```typescript
const config = init(wagmiConfig, {
  ...baseConfig,
  onError: (error) => {
    // Custom error handling
    console.error("SDK error:", error);
    // Log to error tracking service, etc.
  },
});
```

---

## Example: Token Portfolio

Display user's token holdings across all chains:

```typescript
import { getListedTokens } from "sugar-sdk";
import { connect, injected } from "@wagmi/core";

// Connect wallet
await connect(config, { connector: injected() });

// Fetch tokens
const tokens = await getListedTokens({ config });

// Filter to owned tokens
const portfolio = tokens
  .filter(t => t.balance > 0n)
  .map(t => ({
    symbol: t.symbol,
    chain: t.chainId,
    balance: Number(t.balance) / 10 ** t.decimals,
    value: (Number(t.balance) / 10 ** t.decimals) * parseFloat(t.price),
  }))
  .sort((a, b) => b.value - a.value);

console.log("Your portfolio:");
portfolio.forEach(({ symbol, chain, balance, value }) => {
  console.log(`${symbol} (chain ${chain}): ${balance} ($${value.toFixed(2)})`);
});

const totalValue = portfolio.reduce((sum, t) => sum + t.value, 0);
console.log(`Total value: $${totalValue.toFixed(2)}`);
```

---

## Next Steps

- [Swaps API](/api/swaps) - Swap tokens
- [Configuration API](/api/config) - SDK setup
- [Getting Started](/getting-started) - Hello world example
