import {
  getAccount,
  getClient,
  readContracts,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { Address, createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getPoolsForSwaps } from "./pools.js";
import { applyPct } from "./primitives/externals/app/src/hooks/math.js";
import {
  executeSwapParams,
  getBestQuote,
  getPaths,
  getQuoteForSwapVars,
  getSwapQuoteParams,
  getSwapVars,
  Quote,
  Token,
} from "./primitives/index.js";
import {
  BaseParams,
  ensureConnectedChain,
  processBatchesConcurrently,
} from "./utils.js";

interface CallDataForSwap {
  commands: Hex;
  inputs: Hex[];
  minAmountOut: bigint;
  priceImpact: bigint;
}

interface CallDataForSwap {
  commands: Hex;
  inputs: Hex[];
  minAmountOut: bigint;
  priceImpact: bigint;
}

export async function getCallDataForSwap({
  config,
  fromToken,
  toToken,
  amountIn,
  account,
  slippage,
}: BaseParams & {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  account: Address;
  slippage: number;
}): Promise<CallDataForSwap | null> {
  if (slippage < 0 || slippage > 1) {
    throw new Error("Invalid slippage value. Should be between 0 and 1.");
  }

  const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn });

  if (!quote) {
    return null;
  }

  const { planner } = getSwapVars(
    config.sugarConfig,
    quote,
    `${Math.round(slippage * 100)}`,
    account
  );

  return {
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    minAmountOut: applyPct(
      quote.amountOut,
      quote.toToken.decimals,
      slippage * 100
    ),
    priceImpact: quote.priceImpact,
  };
}

export async function getQuoteForSwap({
  config,
  fromToken,
  toToken,
  amountIn,
  batchSize = 50,
  concurrentLimit = 10,
}: BaseParams & {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  batchSize?: number;
  concurrentLimit?: number;
}) {
  const { chainId, mustExcludeTokens, spenderAddress } = getQuoteForSwapVars(
    config.sugarConfig,
    fromToken,
    toToken
  );
  const pools = await getPoolsForSwaps({ config, chainId });

  const paths = getPaths({
    config: config.sugarConfig,
    pools,
    fromToken,
    toToken,
    mustExcludeTokens,
    chainId,
  });

  if (paths.length === 0) {
    return null;
  }

  const quoteResponses = await processBatchesConcurrently({
    items: paths,
    batchSize,
    concurrentLimit,
    processBatch: async (batch) =>
      readContracts(config, {
        contracts: batch.map((path) =>
          getSwapQuoteParams({
            config: config.sugarConfig,
            chainId,
            path: path.nodes,
            amountIn,
          })
        ),
      }),
  });

  const quotes = quoteResponses
    .map((response, i) => {
      const amountOut = response.result?.[0];
      // also filters out 0n
      return !amountOut
        ? null
        : ({
            path: paths[i],
            amount: amountIn,
            amountOut,
            fromToken,
            toToken,
            priceImpact: 0n,
            spenderAddress,
          } as Quote);
    })
    .filter((quote) => quote !== null);

  return getBestQuote([quotes]);
}

export async function swap({
  config,
  quote,
  slippage = 0.005,
  waitForReceipt = true,
  privateKey,
}: BaseParams & {
  quote: Quote;
  slippage?: number;
  waitForReceipt?: boolean;
  privateKey?: Hex;
}): Promise<string> {
  if (typeof slippage !== "undefined" && (slippage < 0 || slippage > 1)) {
    throw new Error("Invalid slippage value. Should be between 0 and 1.");
  }

  // Determine account address based on whether privateKey is provided
  let accountAddress: Address;
  if (privateKey) {
    const account = privateKeyToAccount(privateKey);
    accountAddress = account.address;
  } else {
    const account = getAccount(config);
    if (!account.address) {
      throw new Error(
        "No connected account found. Please connect a wallet or provide a private key."
      );
    }
    accountAddress = account.address;
  }

  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    typeof slippage !== "undefined"
      ? `${Math.ceil(slippage * 100)}`
      : undefined,
    accountAddress
  );

  // Get the Universal Router address from the execute params
  const swapParams = executeSwapParams({
    config: config.sugarConfig,
    chainId,
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    value: amount,
  });

  let hash: Hex;

  if (privateKey) {
    // re: https://wagmi.sh/core/guides/viem#private-key-mnemonic-accounts
    // XX: there does not seem to be a more elegant way to hook into wagmi connector system upstairs
    // so we are descending into viem's abyss here
    // Use viem's wallet client for private key transactions
    const account = privateKeyToAccount(privateKey);

    // Get the viem client from wagmi for the specific chain
    const viemClient = getClient(config, { chainId });

    if (!viemClient) {
      throw new Error(`No client found for chain ${chainId}`);
    }

    // Get the RPC URL from the chain configuration and create a new transport
    const rpcUrl = viemClient.chain.rpcUrls.default.http[0];
    const transport = http(rpcUrl, { batch: true });

    // Create wallet client reusing the chain config and RPC transport
    const walletClient = createWalletClient({
      account,
      chain: viemClient.chain,
      transport,
    });

    hash = await walletClient.writeContract({
      address: swapParams.address,
      abi: swapParams.abi,
      functionName: swapParams.functionName,
      args: swapParams.args,
      value: swapParams.value,
    });
  } else {
    await ensureConnectedChain({ config, chainId });
    // Use wagmi's writeContract for injected wallet transactions
    hash = await writeContract(config, swapParams);
  }

  if (!waitForReceipt) {
    return hash;
  }

  const receipt = await waitForTransactionReceipt(config, { hash });

  if (receipt.status !== "success") {
    throw new Error(`Swap transaction failed: ${receipt.status}`);
  }

  return hash;
}

export { Quote } from "./primitives";
