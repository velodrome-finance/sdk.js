import { Address, Hex } from "viem";

import { ChainParams } from "../utils.js";
import { routeQuoterAbi, universalRouterAbi } from "./abis.js";
import { packRoute } from "./externals/app/src/hooks/lib.js";
import { setupPlanner } from "./externals/app/src/hooks/swap.js";
import { Quote, RouteElement, Token } from "./externals/app/src/hooks/types.js";
import { ContractFunction, getChainConfig } from "./utils.js";

export function getSwapQuoteParams({
  config,
  chainId,
  path,
  amountIn,
}: ChainParams & {
  path: RouteElement[];
  amountIn: bigint;
}) {
  return {
    chainId,
    address: getChainConfig(config.dromeConfig, chainId).QUOTER_ADDRESS,
    abi: routeQuoterAbi,
    functionName: "quoteExactInput",
    args: [packRoute(config.dromeConfig, path, "quote"), amountIn],
  } satisfies ContractFunction<
    typeof routeQuoterAbi,
    "nonpayable",
    "quoteExactInput"
  >;
}

export function executeSwapParams({
  config,
  chainId,
  commands,
  inputs,
  value,
}: ChainParams & {
  commands: Hex;
  inputs: Hex[];
  value: bigint;
}) {
  return {
    chainId,
    address: getChainConfig(config.dromeConfig, chainId)
      .UNIVERSAL_ROUTER_ADDRESS,
    abi: universalRouterAbi,
    functionName: "execute",
    args: [commands, inputs],
    value,
  } satisfies ContractFunction<typeof universalRouterAbi, "payable", "execute">;
}

export function getQuoteForSwapVars({
  config,
  chainId,
  fromToken,
  toToken,
}: ChainParams & {
  fromToken: Token;
  toToken: Token;
}) {
  if (fromToken.chainId !== chainId || toToken.chainId !== chainId) {
    throw new Error("Incompatible token chain IDs");
  }

  const unsafeTokensSet = new Set(
    getChainConfig(config.dromeConfig, chainId).UNSAFE_TOKENS ?? []
  );
  unsafeTokensSet.delete(fromToken.address);
  unsafeTokensSet.delete(toToken.address);

  return {
    chainId,
    poolsPageSize: config.dromeConfig.POOLS_PAGE_SIZE,
    mustExcludeTokens: unsafeTokensSet,
  };
}

export function getSwapVars({
  config,
  chainId,
  quote,
  slippagePct,
  accountAddress,
}: ChainParams & {
  quote: Quote;
  slippagePct?: string;
  accountAddress?: Address;
}) {
  slippagePct =
    slippagePct ?? (quote.path.nodes.some((n) => n.type >= 50) ? "1" : "0.5");
  const planner = setupPlanner({
    config: config.dromeConfig,
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
