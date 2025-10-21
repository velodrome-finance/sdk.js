import { Address, Hex } from "viem";

import { Config } from "../config.js";
import { routeQuoterAbi, universalRouterAbi } from "./abis.js";
import { packRoute } from "./externals/app/src/hooks/lib.js";
import { setupPlanner } from "./externals/app/src/hooks/swap.js";
import { Quote, RouteElement, Token } from "./externals/app/src/hooks/types.js";
import { ContractFunction, getChainConfig } from "./utils.js";

export function getSwapQuoteParams<ChainId extends number>({
  config,
  chainId,
  path,
  amountIn,
}: {
  config: Config;
  chainId: ChainId;
  path: RouteElement[];
  amountIn: bigint;
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).QUOTER_ADDRESS,
    abi: routeQuoterAbi,
    functionName: "quoteExactInput",
    args: [packRoute(config, path, "quote"), amountIn],
  } satisfies ContractFunction<
    typeof routeQuoterAbi,
    "nonpayable",
    "quoteExactInput"
  >;
}

export function executeSwapParams<ChainId extends number>({
  config,
  chainId,
  commands,
  inputs,
  value,
}: {
  config: Config;
  chainId: ChainId;
  commands: Hex;
  inputs: Hex[];
  value: bigint;
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).UNIVERSAL_ROUTER_ADDRESS,
    abi: universalRouterAbi,
    functionName: "execute",
    args: [commands, inputs],
    value,
  } satisfies ContractFunction<typeof universalRouterAbi, "payable", "execute">;
}

export function getQuoteForSwapVars(
  config: Config,
  fromToken: Token,
  toToken: Token
) {
  if (fromToken.chainId !== toToken.chainId) {
    throw new Error("Incompatible token chains");
  }

  const chainId = fromToken.chainId;
  const unsafeTokensSet = new Set(
    getChainConfig(config, chainId).UNSAFE_TOKENS ?? []
  );
  unsafeTokensSet.delete(fromToken.address);
  unsafeTokensSet.delete(toToken.address);

  return {
    chainId,
    poolsPageSize: config.POOLS_PAGE_SIZE,
    mustExcludeTokens: unsafeTokensSet,
    spenderAddress: getChainConfig(config, chainId).UNIVERSAL_ROUTER_ADDRESS,
  };
}

export function getSwapVars(
  config: Config,
  quote: Quote,
  slippagePct = quote.path.nodes.some((n) => n.type >= 50) ? "1" : "0.5",
  accountAddress?: Address
) {
  const chainId = quote.fromToken.chainId;
  const planner = setupPlanner({
    config,
    chainId,
    // TODO: look into this
    account: accountAddress!,
    quote,
    slippagePct,
  });

  return {
    chainId,
    planner,
    amount: quote.fromToken.wrappedAddress ? quote.amount : 0n,
  };
}

export { packRoute, prepareRoute } from "./externals/app/src/hooks/lib.js";
export { buildGraph, getPaths } from "./externals/app/src/hooks/quote.js";
export { getBestQuote } from "./externals/app/src/hooks/quote.worker.js";
export { setupPlanner } from "./externals/app/src/hooks/swap.js";
export type {
  Quote,
  RouteElement,
  RoutePath,
} from "./externals/app/src/hooks/types.js";
