#!/usr/bin/env tsx

import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "path";
import {
  approve,
  base,
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  swap,
  swellchain,
  unichain,
} from "sugar-sdk";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { Hex } from "viem";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, ".env") });

const getRpcUrl = (chainId: number) => {
  const value = process.env[`VITE_RPC_URL_${chainId}`];

  if (!value) {
    throw new Error(
      `Missing RPC URL for chain ${chainId}. Define VITE_RPC_URL_${chainId} in packages/demo-node/.env.`
    );
  }

  return value;
};

const USAGE = `
Usage: tsx swap.ts --fromToken <address> --toToken <address> --amount <amount> --privateKey <key> [--chainId <chainId>] [--slippage <slippage>] [--no-wait]

Arguments:
  --fromToken    Address of the token to swap from (e.g., "0x4200000000000000000000000000000000000006")
  --toToken      Address of the token to swap to (e.g., "0x0b2c639c533813f4aa9d7837caf62653d097ff85")
  --amount       Amount to swap in wei/smallest unit (e.g., "1000000" for 1 USDC with 6 decimals)
  --privateKey   Private key for signing the transaction (must start with 0x)
  --chainId      Chain ID (default: 10 for Optimism)
  --slippage     Slippage tolerance as decimal [0,1] (e.g., "0.005" for 0.5%, default: "0.005")
  --no-wait      Don't wait for transaction receipt (default: wait for receipt)

Examples:
  tsx swap.ts --fromToken 0x4200000000000000000000000000000000000006 --toToken 0x0b2c639c533813f4aa9d7837caf62653d097ff85 --amount 10000000000000000 --privateKey 0x...
  tsx swap.ts --fromToken 0x9560e827af36c94d2ac33a39bce1fe78631088db --toToken 0x0b2c639c533813f4aa9d7837caf62653d097ff85 --amount 100000000 --chainId 10 --slippage 0.01 --privateKey 0x...
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
        chainId: { type: "string", default: "10" },
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
    const chainId = parseInt(values.chainId!, 10);
    const slippage = parseFloat(values.slippage!);
    const waitForReceipt = !values["no-wait"];

    if (isNaN(chainId)) {
      console.error("Error: chainId must be a number");
      process.exit(1);
    }

    if (isNaN(slippage) || slippage < 0 || slippage > 1) {
      console.error("Error: slippage must be a number between 0 and 1");
      process.exit(1);
    }

    if (!privateKey.startsWith("0x")) {
      console.error("Error: privateKey must start with 0x");
      process.exit(1);
    }

    // Initialize Sugar SDK config
    const config = getDefaultConfig({
      chains: [
        base,
        ink,
        lisk,
        metalL2,
        mode,
        optimism,
        soneium,
        superseed,
        swellchain,
        unichain,
      ].map((chain) => ({ chain, rpcUrl: getRpcUrl(chain.id) })),
    });

    // Get all tokens for the specified chain
    console.log(`Fetching tokens for chain ID ${chainId}...`);
    const allTokens = await getListedTokens({ config });

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
        `Error: Token with address "${fromTokenAddress}" not found on chain ${chainId}`
      );
      console.log(
        "Available tokens:",
        allTokens
          .filter((t) => t.chainId === chainId)
          .map((t) => `${t.symbol} (${t.address})`)
          .join(", ")
      );
      process.exit(1);
    }

    if (!toToken) {
      console.error(
        `Error: Token with address "${toTokenAddress}" not found on chain ${chainId}`
      );
      console.log(
        "Available tokens:",
        allTokens
          .filter((t) => t.chainId === chainId)
          .map((t) => `${t.symbol} (${t.address})`)
          .join(", ")
      );
      process.exit(1);
    }

    // Parse amount as bigint (already in wei/smallest unit)
    const amountIn = BigInt(amountStr);

    console.log(`\nPreparing swap:`);
    console.log(`From: ${fromToken.symbol} (${fromToken.address})`);
    console.log(`To: ${toToken.symbol} (${toToken.address})`);
    console.log(`Amount: ${amountIn} ${fromToken.symbol}`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Slippage: ${slippage} (${slippage * 100}%)`);

    // Get quote
    console.log("\nFetching quote...");
    const quote = await getQuoteForSwap({
      config,
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
    console.log(`Expected Amount Out: ${amountOutFormatted} ${toToken.symbol}`);
    console.log(`Price Impact: ${quote.priceImpact}`);
    console.log(`Path Hops: ${quote.path.nodes.length}`);

    await approve({
      config,
      tokenAddress: quote!.fromToken.wrappedAddress || quote!.fromToken.address,
      spenderAddress: quote!.spenderAddress,
      amount: quote!.amount,
      chainId: quote!.fromToken.chainId,
      privateKey,
    });

    // Execute swap
    console.log("\n🔄 Executing swap...");
    const txHash = await swap({
      config,
      quote,
      slippage,
      privateKey,
      waitForReceipt,
    });

    console.log("\n✅ Swap executed successfully!");
    console.log(`Transaction Hash: ${txHash}`);

    // Output as JSON for programmatic use
    console.log("\nJSON Output:");
    console.log(
      JSON.stringify(
        {
          success: true,
          txHash,
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
          chainId,
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
