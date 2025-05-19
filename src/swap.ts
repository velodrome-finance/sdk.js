import {
  Config,
  getAccount,
  readContract,
  readContracts,
  switchChain,
  writeContract,
} from "@wagmi/core";
import { Hex } from "viem";
import {
  depaginate,
  executeSwapParams,
  getBestQuote,
  getPaths,
  getPoolsForSwapParams,
  getSwapQuoteParams,
  Quote,
  setupPlanner,
  Token,
} from "./primitives/index.js";
import { getChainConfig } from "./utils.js";

export async function getQuoteForSwap(
  config: Config,
  fromToken: Token,
  toToken: Token,
  amountIn: bigint
) {
  // TODO swapper.tsx code?
  const chainId = fromToken.chainId;

  const pools = await depaginate((offset, length) =>
    readContract(config, getPoolsForSwapParams(chainId, offset, length))
  );

  const unsafeTokensSet = new Set(getChainConfig(chainId).UNSAFE_TOKENS ?? []);
  unsafeTokensSet.delete(fromToken.address);
  unsafeTokensSet.delete(toToken.address);

  const paths = getPaths({
    pools,
    fromToken,
    toToken,
    mustExcludeTokens: unsafeTokensSet,
    chainId,
  });

  if (paths.length === 0) {
    return null;
  }

  const quoteResponses = await readContracts(config, {
    contracts: paths.map((path) =>
      getSwapQuoteParams(chainId, path.nodes, amountIn)
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

  return getBestQuote([quotes]);
}

export async function swap(config: Config, quote: Quote, slippagePct?: string) {
  const chainId = quote.fromToken.chainId;
  const account = getAccount(config);
  slippagePct ??= quote.path.nodes.some((n) => n.type >= 50) ? "1" : "0.5";

  const planner = setupPlanner({
    chainId,
    account: account.address,
    quote,
    slippagePct: slippagePct,
  });

  if (chainId !== account.chainId) {
    await switchChain(config, { chainId });
  }

  return await writeContract(
    config,
    executeSwapParams(
      chainId,
      planner.commands as Hex,
      planner.inputs as Hex[],
      quote.fromToken.wrappedAddress ? quote.amount : 0n
    )
  );
}
