import {
  getAccount,
  readContract,
  readContracts,
  writeContract,
} from "@wagmi/core";
import { Hex } from "viem";

import {
  depaginate,
  executeSwapParams,
  getBestQuote,
  getPaths,
  getPoolsForSwapParams,
  getQuoteForSwapVars,
  getSwapQuoteParams,
  getSwapVars,
  Quote,
  Token,
} from "./primitives/index.js";
import { DromeWagmiConfig, ensureConnectedChain } from "./utils.js";

export async function getQuoteForSwap(
  config: DromeWagmiConfig,
  fromToken: Token,
  toToken: Token,
  amountIn: bigint
) {
  const { chainId, mustExcludeTokens, poolsPageSize } = getQuoteForSwapVars(
    config.dromeConfig,
    fromToken,
    toToken
  );

  const pools = await depaginate(
    (offset, count) =>
      readContract(
        config,
        getPoolsForSwapParams({
          config: config.dromeConfig,
          chainId,
          offset,
          count,
        })
      ),
    poolsPageSize
  );

  const paths = getPaths({
    config: config.dromeConfig,
    pools,
    fromToken,
    toToken,
    mustExcludeTokens,
    chainId,
  });

  if (paths.length === 0) {
    return null;
  }

  const quoteResponses = await readContracts(config, {
    contracts: paths.map((path) =>
      getSwapQuoteParams({
        config: config.dromeConfig,
        chainId,
        path: path.nodes,
        amountIn,
      })
    ),
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
          } as Quote);
    })
    .filter((quote) => quote !== null);

  return getBestQuote(quotes);
}

export async function swap(
  config: DromeWagmiConfig,
  quote: Quote,
  slippagePct?: string
) {
  const account = getAccount(config);
  const { chainId, planner, amount } = getSwapVars(
    config.dromeConfig,
    quote,
    slippagePct,
    account.address
  );

  await ensureConnectedChain(config, chainId);

  return await writeContract(
    config,
    executeSwapParams({
      config: config.dromeConfig,
      chainId,
      commands: planner.commands as Hex,
      inputs: planner.inputs as Hex[],
      value: amount,
    })
  );
}

export { Quote } from "./primitives";
