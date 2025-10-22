# Approvals API

`approve` writes an ERC20 approval so the Universal Router can transfer tokens on your behalf. It wraps `writeContract`, waits for an optional receipt, and returns the transaction hash.

## approve

```typescript
import { approve, getQuoteForSwap } from "sugar-sdk";

const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn: 1_000_000n });
if (!quote) throw new Error("No route found.");

const txHash = await approve({
  config,
  tokenAddress: quote.fromToken.address,
  spenderAddress: quote.spenderAddress,
  amount: quote.amount,
  chainId: quote.fromToken.chainId,
  waitForReceipt: true,
});

console.log(`Approval confirmed: ${txHash}`);
```

### Parameters

- `config` – `SugarWagmiConfig`.
- `tokenAddress` – ERC20 contract to approve.
- `spenderAddress` – Contract that will spend tokens (use `quote.spenderAddress`).
- `amount` – Bigint allowance you want to grant.
- `chainId` – Chain where the approval should be mined.
- `waitForReceipt` (optional) – Wait for confirmation (default `true`).

Returns the approval transaction hash (`Hex` string).

### Usage Tips

- Approve before calling `swap` unless the router already has sufficient allowance.
- You can approve the exact amount, a larger buffer, or even `2n ** 256n - 1n` for an "infinite" allowance—choose what matches your security posture.
- The helper does not check existing allowances yet (see TODO in source), so you may want to read the `allowance` function yourself before submitting another approval.

```typescript
import { readContract } from "@wagmi/core";

const accountAddress = "0xYourWalletAddress";

const allowance = await readContract(config, {
  address: quote.fromToken.address,
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
  args: [accountAddress, quote.spenderAddress],
});

if (allowance < quote.amount) {
  await approve({
    config,
    tokenAddress: quote.fromToken.address,
    spenderAddress: quote.spenderAddress,
    amount: quote.amount,
    chainId: quote.fromToken.chainId,
  });
}
```
