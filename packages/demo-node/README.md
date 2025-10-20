# Demo Node

Node.js demonstration scripts for Sugar SDK.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your RPC URL:
```bash
VITE_RPC_URL_8453=https://your-base-rpc-url
```

## swap-with-pk.ts

Demonstrates external transaction signing for swaps. This script shows how to:
1. Get a swap quote (using read-only config, no wallet needed)
2. Generate unsigned transaction data
3. Sign the transaction with an external private key
4. Submit the signed transaction to the network

This approach allows you to control private key management separately from the SDK's transaction building logic - perfect for enterprise use cases where key management needs to be isolated.

### Usage

```bash
npm run swap-with-pk -- --fromToken <address> --toToken <address> --amount <amount> --privateKey <key> [--slippage <slippage>] [--no-wait]
```

Or directly with tsx:

```bash
tsx swap-with-pk.ts --fromToken <address> --toToken <address> --amount <amount> --privateKey <key>
```

### Arguments

- `--fromToken` - Address of the token to swap from on Base chain
- `--toToken` - Address of the token to swap to on Base chain
- `--amount` - Amount to swap in wei/smallest unit (e.g., "1000000" for 1 USDC with 6 decimals)
- `--privateKey` - Private key for signing the transaction (must start with 0x)
- `--slippage` - Slippage tolerance as decimal [0,1] (e.g., "0.005" for 0.5%, default: "0.005")
- `--no-wait` - Don't wait for transaction receipt (default: wait for receipt)

### Examples

Swap 1 USDC to Aero with 1% slippage:
```bash
npm run swap-with-pk -- \
  --fromToken 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 \
  --toToken 0x940181a94a35a4569e4529a3cdfb74e38fd98631 \
  --amount 1000000 \
  --slippage 0.01 \
  --privateKey YOUR_PRIVATE_KEY
```

Swap 0.0005 ETH to Aero:
```bash
npm run swap-with-pk -- \
  --fromToken eth \
  --toToken 0x940181a94a35a4569e4529a3cdfb74e38fd98631 \
  --amount 500000000000000 \
  --slippage 0.01 \
  --privateKey YOUR_PRIVATE_KEY
```

### Architecture

The script demonstrates a clean separation between transaction building and signing:

**Phase 1: Read-only Client (no wallet needed)**
- Gets swap quotes from the blockchain
- Generates unsigned transaction data
- Can be run on a backend service or dApp without wallet access

**Phase 2: External Signing & Submission**
- Uses `privateKeyToAccount` to create signing account (simulates external wallet)
- Signs **both** approval and swap transactions with private key outside the SDK
- Submits both signed transactions using read-only config (only needs RPC access)
- No wallet connection needed - everything uses external signing!

This separation allows you to:
- Build swap transactions without exposing private keys to the SDK
- Use hardware wallets, HSMs, MPC solutions, or other signing methods
- Submit pre-signed transactions using just an RPC endpoint
- Implement custom security policies around transaction signing
- Keep signing logic completely isolated from transaction construction

### Output

The script outputs detailed information during execution and provides a JSON summary at the end:

```json
{
  "success": true,
  "txHash": "0x...",
  "chain": "base",
  "chainId": 8453,
  "account": "0x...",
  "fromToken": {
    "symbol": "USDC",
    "address": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    "decimals": 6
  },
  "toToken": {
    "symbol": "AERO",
    "address": "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
    "decimals": 18
  },
  "amountIn": "1000000",
  "expectedAmountOut": "...",
  "amountOutFormatted": "...",
  "priceImpact": "...",
  "slippage": 0.01,
  "slippagePercent": 1,
  "waitedForReceipt": true,
  "unsignedTx": {
    "to": "0x...",
    "data": "0x...",
    "value": "0",
    "chainId": 8453
  }
}
```
