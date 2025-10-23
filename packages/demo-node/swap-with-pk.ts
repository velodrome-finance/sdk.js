#!/usr/bin/env tsx

import {
  base,
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  submitSignedTransaction,
  swap,
} from "@dromos-labs/sdk.js";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { encodeFunctionData, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getTransactionCount } from "viem/actions";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, ".env") });

// ERC20 ABI for approve function
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const getRpcUrl = () => {
  const value = process.env[`VITE_RPC_URL_${base.id}`];

  if (!value) {
    throw new Error(
      `Missing RPC URL for Base chain. Define VITE_RPC_URL_${base.id} in packages/demo-node/.env.`
    );
  }

  return value;
};

const USAGE = `
Usage: tsx swap-with-pk.ts --fromToken <address> --toToken <address> --amount <amount> --privateKey <key> [--slippage <slippage>] [--no-wait]

Description:
  Demonstrates external transaction signing for swaps. This script:
  1. Gets a swap quote (using read-only config, no wallet needed)
  2. Generates unsigned transaction data
  3. Signs the transaction with an external private key
  4. Submits the signed transaction to the network

  This approach allows you to control private key management separately
  from the SDK's transaction building logic.

Arguments:
  --fromToken    Address of the token to swap from on Base chain
  --toToken      Address of the token to swap to on Base chain
  --amount       Amount to swap in wei/smallest unit (e.g., "1000000" for 1 USDC with 6 decimals)
  --privateKey   Private key for signing the transaction (must start with 0x)
  --slippage     Slippage tolerance as decimal [0,1] (e.g., "0.005" for 0.5%, default: "0.005")
  --no-wait      Don't wait for transaction receipt (default: wait for receipt)

Note: This script only supports Base chain (chainId: ${base.id})

Examples:

// Swap 1 USDC to Aero with 1% slippage tolerance
tsx swap-with-pk.ts --fromToken 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 --toToken 0x940181a94a35a4569e4529a3cdfb74e38fd98631 --amount 1000000 --slippage 0.01 --privateKey YOUR_PRIVATE_KEY

// Swap 0.0005 ETH to Aero with 1% slippage tolerance
tsx swap-with-pk.ts --fromToken eth --toToken 0x940181a94a35a4569e4529a3cdfb74e38fd98631 --amount 500000000000000 --slippage 0.01 --privateKey YOUR_PRIVATE_KEY
`;

async function main() {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        fromToken: { type: "string" },
        toToken: { type: "string" },
        amount: { type: "string" },
        privateKey: { type: "string" },
        slippage: { type: "string", default: "0.005" },
        "no-wait": { type: "boolean", default: false },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: false,
    });

    if (
      values.help ||
      !values.fromToken ||
      !values.toToken ||
      !values.amount ||
      !values.privateKey
    ) {
      console.log(USAGE);
      process.exit(values.help ? 0 : 1);
    }

    const fromTokenAddress = values.fromToken;
    const toTokenAddress = values.toToken;
    const amountStr = values.amount;
    const privateKey = values.privateKey as Hex;
    const chainId = base.id; // Base chain only
    const slippage = parseFloat(values.slippage!);
    const waitForReceipt = !values["no-wait"];

    if (isNaN(slippage) || slippage < 0 || slippage > 1) {
      console.error("Error: slippage must be a number between 0 and 1");
      process.exit(1);
    }

    if (!privateKey.startsWith("0x")) {
      console.error("Error: privateKey must start with 0x");
      process.exit(1);
    }

    console.log("\n========================================");
    console.log("  Swap with External Private Key Demo");
    console.log("========================================\n");

    // ====== CLIENT 1: Read-only client ======
    console.log(
      "📖 PHASE 1: Building transaction (read-only, no wallet needed)"
    );
    console.log("─────────────────────────────────────────\n");

    // Initialize read-only config (no private key needed for quote/unsigned tx)
    const readOnlyConfig = getDefaultConfig({
      chains: [{ chain: base, rpcUrl: getRpcUrl() }],
    });

    // Get all tokens for Base chain
    console.log(`Fetching tokens for Base chain (${chainId})...`);
    const allTokens = await getListedTokens({ config: readOnlyConfig });

    // Find tokens by address
    const findToken = (address: string) =>
      allTokens.find(
        (token) =>
          token.address.toLowerCase() === address.toLowerCase() &&
          token.chainId === chainId
      );

    const fromToken = findToken(fromTokenAddress);
    const toToken = findToken(toTokenAddress);

    if (!fromToken) {
      console.error(
        `Error: Token with address "${fromTokenAddress}" not found on Base chain`
      );
      console.log(
        "Available tokens on Base:",
        allTokens
          .filter((t) => t.chainId === chainId)
          .map((t) => `${t.symbol} (${t.address})`)
          .join(", ")
      );
      process.exit(1);
    }

    if (!toToken) {
      console.error(
        `Error: Token with address "${toTokenAddress}" not found on Base chain`
      );
      console.log(
        "Available tokens on Base:",
        allTokens
          .filter((t) => t.chainId === chainId)
          .map((t) => `${t.symbol} (${t.address})`)
          .join(", ")
      );
      process.exit(1);
    }

    // Parse amount as bigint (already in wei/smallest unit)
    const amountIn = BigInt(amountStr);

    console.log(`Swap Details:`);
    console.log(`  From: ${fromToken.symbol} (${fromToken.address})`);
    console.log(`  To: ${toToken.symbol} (${toToken.address})`);
    console.log(`  Amount: ${amountIn} ${fromToken.symbol}`);
    console.log(`  Slippage: ${slippage} (${slippage * 100}%)`);

    // Get quote using read-only config
    console.log("\nFetching quote...");
    const quote = await getQuoteForSwap({
      config: readOnlyConfig,
      fromToken,
      toToken,
      amountIn,
    });

    if (!quote) {
      console.log("❌ No quote available for this swap");
      process.exit(1);
    }

    // Format output amount
    const amountOutFormatted = (
      Number(quote.amountOut) /
      10 ** toToken.decimals
    ).toFixed(6);

    console.log("\n✅ Quote received:");
    console.log(
      `  Expected Amount Out: ${amountOutFormatted} ${toToken.symbol}`
    );
    console.log(`  Price Impact: ${quote.priceImpact}`);
    console.log(`  Path Hops: ${quote.path.nodes.length}`);

    // Derive account address from private key
    const account = privateKeyToAccount(privateKey);
    const accountAddress = account.address;

    console.log(`  Account: ${accountAddress}`);

    // Get unsigned transaction data
    console.log("\nGenerating unsigned transaction...");
    const unsignedTx = await swap({
      config: readOnlyConfig,
      quote,
      account: accountAddress,
      slippage,
      unsignedTransactionOnly: true,
    });

    console.log("\n✅ Unsigned transaction generated:");
    console.log(`  To: ${unsignedTx.to}`);
    console.log(`  Data: ${unsignedTx.data.slice(0, 66)}...`);
    console.log(`  Value: ${unsignedTx.value}`);
    console.log(`  Chain ID: ${unsignedTx.chainId}`);

    // ====== CLIENT 2: External signing & submission ======
    console.log("\n\n🔐 PHASE 2: Signing & submitting (external wallet)");
    console.log("─────────────────────────────────────────\n");

    const client = readOnlyConfig.getClient({ chainId: unsignedTx.chainId });

    // Get starting nonce once
    const startingNonce = await getTransactionCount(client, {
      address: accountAddress,
    });
    console.log(`Starting nonce: ${startingNonce}`);

    // Step 1: Approve tokens (also using external signing)
    console.log("\nStep 1: Approving tokens...");
    const tokenAddress =
      quote.fromToken.wrappedAddress || quote.fromToken.address;

    // Create unsigned approval transaction
    const approvalData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [quote.spenderAddress, quote.amount],
    });

    const approvalNonce = startingNonce;
    console.log(`  Approval nonce: ${approvalNonce}`);
    console.log("  Signing approval transaction...");
    const signedApproval = await account.signTransaction({
      to: tokenAddress,
      data: approvalData,
      value: 0n,
      chainId: unsignedTx.chainId,
      nonce: approvalNonce,
      gas: 100000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
    });

    console.log("  Submitting approval...");
    await submitSignedTransaction({
      config: readOnlyConfig,
      signedTransaction: signedApproval,
      waitForReceipt: true,
    });
    console.log("✅ Tokens approved");

    // Step 2: Execute swap
    console.log("\nStep 2: Executing swap...");

    // Use next nonce (avoid RPC timing issues)
    const swapNonce = startingNonce + 1;
    console.log(`  Swap nonce: ${swapNonce}`);

    // Sign the swap transaction with the private key (external signing)
    console.log("  Signing swap transaction...");
    console.log(
      "  (This simulates signing with HSM, hardware wallet, MPC, etc.)"
    );
    const signedSwap = await account.signTransaction({
      to: unsignedTx.to,
      data: unsignedTx.data,
      value: unsignedTx.value,
      chainId: unsignedTx.chainId,
      nonce: swapNonce,
      gas: 500000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
    });

    console.log("✅ Swap transaction signed");
    console.log(`  Signed TX: ${signedSwap.slice(0, 66)}...`);

    // Submit the signed swap transaction (using read-only config!)
    console.log("\n  Submitting swap transaction...");
    const txHash = await submitSignedTransaction({
      config: readOnlyConfig, // Note: Using read-only config for submission!
      signedTransaction: signedSwap,
      waitForReceipt,
    });

    console.log("\n✅ Swap executed successfully!");
    console.log(`  Transaction Hash: ${txHash}`);
    console.log(`  Explorer: https://basescan.org/tx/${txHash}`);

    // Output as JSON for programmatic use
    console.log("\n========================================");
    console.log("JSON Output:");
    console.log("========================================");
    console.log(
      JSON.stringify(
        {
          success: true,
          txHash,
          chain: "base",
          chainId,
          account: accountAddress,
          fromToken: {
            symbol: fromToken.symbol,
            address: fromToken.address,
            decimals: fromToken.decimals,
          },
          toToken: {
            symbol: toToken.symbol,
            address: toToken.address,
            decimals: toToken.decimals,
          },
          amountIn: amountIn.toString(),
          expectedAmountOut: quote.amountOut.toString(),
          amountOutFormatted,
          priceImpact: quote.priceImpact.toString(),
          slippage,
          slippagePercent: slippage * 100,
          waitedForReceipt: waitForReceipt,
          unsignedTx: {
            to: unsignedTx.to,
            data: unsignedTx.data,
            value: unsignedTx.value.toString(),
            chainId: unsignedTx.chainId,
          },
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
