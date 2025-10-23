# Approvals

Approving funds using Sugar SDK

## approve

Approve token spending

### Signature

```typescript
function approve(params: {
  config: SugarWagmiConfig;
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
  chainId: number;
  waitForReceipt?: boolean;
}): Promise<Hex>
```

### Parameters

- `config` - `SugarWagmiConfig` instance connected to the wallet authorizing the approval.
- `tokenAddress` - ERC20 token contract to approve.
- `spenderAddress` - Address that will spend tokens. 
- `amount` - Bigint allowance to grant.
- `chainId` - Chain where the approval transaction should execute.
- `waitForReceipt` - Optional flag to wait for confirmation (default `true`).

### Returns

`Promise<Hex>` - Transaction hash of the approval call.

### Example

```typescript
import { approve, getQuoteForSwap } from "@dromos-labs/sdk.js";

const quote = await getQuoteForSwap({
  config, fromToken, toToken, amountIn: 1_000_000n
});

const txHash = await approve({
  config,
  tokenAddress: quote.fromToken.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: quote.fromToken.chainId,
});

console.log(`Approval confirmed: ${txHash}`);
```
