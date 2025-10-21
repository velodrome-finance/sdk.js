# Tokens API

Token discovery utilities and types exported from Sugar SDK.

## getListedTokens

Fetches all listed tokens across every chain in your `SugarWagmiConfig`. The helper requests token metadata, balances, and USD prices in parallel, merges the results, and sorts them according to `DEFAULT_TOKEN_ORDER`.

```typescript
import { getListedTokens } from "sugar-sdk";

const tokens = await getListedTokens({ config });
console.log(`Loaded ${tokens.length} tokens.`);

const optimismTokens = tokens.filter((token) => token.chainId === 10);
const usdc = tokens.find(
  (token) => token.symbol === "USDC" && token.chainId === 10
);

if (usdc) {
  const balance =
    Number(usdc.balance) / 10 ** usdc.decimals;
  const priceUsd =
    Number(usdc.price) / 10 ** 18; // prices are scaled to 18 decimals

  console.log(`Balance: ${balance} ${usdc.symbol}`);
  console.log(`Price: $${priceUsd.toFixed(2)}`);
}
```

### Parameters

- `config` – `SugarWagmiConfig`.

Returns `Promise<Token[]>`. The promise resolves even if one of the chains fails: errors are routed through the shared `onError` handler and the remaining chains continue.

### Runtime Characteristics

- Uses pagination helpers to respect pool/token limits.
- Pulls balances only when `getAccount(config)` has an address.
- Requests on-chain prices in batches to avoid RPC overload.

## Token Type

`Token` is defined in `packages/sugar-sdk/src/primitives/externals/app/src/hooks/types.ts` and re-exported via `sugar-sdk`. It represents an ERC20 token plus computed metadata.

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

Key fields:

- `balance` – Current wallet balance as bigint (0n when no wallet is connected).
- `price` – USD price scaled to 18 decimals (divide by `10 ** 18` for a float).
- `balanceValue` – Balance multiplied by price, also scaled to 18 decimals.
- `wrappedAddress` – Optional wrapped representation for native tokens.
- `listed` – Indicates whether the token should appear in default lists.

All numeric amounts are bigints to preserve precision. Convert to human-readable values by dividing by `10 ** token.decimals` (for balances) or `10 ** 18` (for USD amounts).

```typescript
function formatTokenAmount(amount: bigint, decimals: number): string {
  return (Number(amount) / 10 ** decimals).toLocaleString();
}

function formatUsd(value: bigint): string {
  return `$${(Number(value) / 10 ** 18).toFixed(2)}`;
}
```
