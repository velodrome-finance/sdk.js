# Tokens API

Working with tokens in Sugar SDK.

## getListedTokens

Fetches all listed tokens across every chain in your `SugarWagmiConfig`. 

### Signature

```typescript
function getListedTokens(params: BaseParams): Promise<Token[]>
```

### Parameters

- `config` - your instance of `SugarWagmiConfig`.

### Returns

`Promise<Token[]>` - List of tokens with balances, USD prices, and metadata for each configured chain.

### Example

```typescript
import { getListedTokens } from "sugar-sdk";

const tokens = await getListedTokens({ config });
console.log(`Loaded ${tokens.length} tokens.`);

const optimismTokens = tokens.filter((token) => token.chainId === 10);
const usdc = tokens.find(
  (token) => token.symbol === "USDC" && token.chainId === 10
);

if (usdc) {
  const balance = Number(usdc.balance) / 10 ** usdc.decimals;
  console.log(`Balance: ${balance} ${usdc.symbol}`);
}
```

> NOTE: The helper only pulls balances when you have connected your wallet

## Token

Token represents an ERC20 token plus computed metadata

```typescript
type Token = Readonly<{
  chainId: number;
  address: Address;
  name?: string;
  symbol: string;
  listed: boolean;
  decimals: number;
  balance: bigint;
  price: bigint;
  balanceValue: bigint;
  wrappedAddress?: Address;
}>;
```

### Fields

- `balance` – Current wallet balance as bigint (0n when no wallet is connected).
- `price` – USD price scaled to 18 decimals.
- `balanceValue` – Balance multiplied by price, also scaled to 18 decimals.
- `wrappedAddress` – Optional wrapped representation for native tokens.
- `listed` – Indicates whether the token is listed.
