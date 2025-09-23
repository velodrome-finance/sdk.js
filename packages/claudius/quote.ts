#!/usr/bin/env tsx

import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "path";
import {
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
  swellchain,
  unichain,
} from "sugar-sdk";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { parseUnits } from "viem";
import { optimism } from "viem/chains";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, ".env") });

const getRpcUrl = (chainId: number) => {
  const value = process.env[`RPC_URI_${chainId}`];

  if (!value) {
    throw new Error(
      `Missing RPC URI for chain ${chainId}. Define RPC_URI_${chainId} in packages/claudius/.env.`
    );
  }

  return value;
};

const USAGE = `
Usage: tsx quote.ts --fromToken <address> --toToken <address> --amount <amount> [--chainId <chainId>]

Arguments:
  --fromToken    Address of the token to swap from (e.g., "0x4200000000000000000000000000000000000006")
  --toToken      Address of the token to swap to (e.g., "0x0b2c639c533813f4aa9d7837caf62653d097ff85")
  --amount       Amount to swap (in human-readable format, e.g., "1.5")
  --chainId      Chain ID (default: 10 for Optimism)

Examples:
  tsx quote.ts --fromToken 0x4200000000000000000000000000000000000006 --toToken 0x0b2c639c533813f4aa9d7837caf62653d097ff85 --amount 1
  tsx quote.ts --fromToken 0x9560e827af36c94d2ac33a39bce1fe78631088db --toToken 0x0b2c639c533813f4aa9d7837caf62653d097ff85 --amount 100 --chainId 10
`;

async function main() {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        fromToken: { type: "string" },
        toToken: { type: "string" },
        amount: { type: "string" },
        chainId: { type: "string", default: "10" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: false,
    });

    if (values.help || !values.fromToken || !values.toToken || !values.amount) {
      console.log(USAGE);
      process.exit(values.help ? 0 : 1);
    }

    const fromTokenAddress = values.fromToken;
    const toTokenAddress = values.toToken;
    const amountStr = values.amount;
    const chainId = parseInt(values.chainId!, 10);

    if (isNaN(chainId)) {
      console.error("Error: chainId must be a number");
      process.exit(1);
    }

    // Initialize Drome config
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

    // Parse amount with token decimals
    const amountIn = parseUnits(amountStr, fromToken.decimals);

    console.log(`\nGetting quote for swap:`);
    console.log(`From: ${fromToken.symbol} (${fromToken.address})`);
    console.log(`To: ${toToken.symbol} (${toToken.address})`);
    console.log(`Amount: ${amountStr} ${fromToken.symbol}`);
    console.log(`Chain ID: ${chainId}`);

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
    console.log(`Amount Out: ${amountOutFormatted} ${toToken.symbol}`);
    console.log(`Price Impact: ${quote.priceImpact}`);
    console.log(`Path Hops: ${quote.path.nodes.length}`);
    console.log(`Path Details:`);

    for (let i = 0; i < quote.path.nodes.length; i++) {
      const node = quote.path.nodes[i];
      console.log(`  Hop ${i + 1}: ${node.from} → ${node.to} (via ${node.lp})`);
    }

    // Output as JSON for programmatic use
    console.log("\nJSON Output:");
    console.log(
      JSON.stringify(
        {
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
          amountOut: quote.amountOut.toString(),
          amountOutFormatted,
          priceImpact: quote.priceImpact.toString(),
          pathHops: quote.path.nodes.length,
          path: quote.path.nodes.map((node) => ({
            from: node.from,
            to: node.to,
            lp: node.lp,
            factory: node.factory,
            type: node.type,
            pool_fee: node.pool_fee.toString(), // Convert BigInt to string
            chainId: node.chainId,
          })),
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
