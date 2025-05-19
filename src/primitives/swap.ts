import { Hex } from "viem";
import { getChainConfig } from "../utils.js";
import { routeQuoterAbi, universalRouterAbi } from "./abis.js";
import { packRoute } from "./externals/app/src/hooks/lib.js";
import { RouteElement } from "./externals/app/src/hooks/types.js";
import { ContractFunction } from "./utils.js";

export function getSwapQuoteParams<ChainId extends number>(
  chainId: ChainId,
  path: RouteElement[],
  amountIn: bigint
) {
  return {
    chainId,
    address: getChainConfig(chainId).QUOTER_ADDRESS,
    abi: routeQuoterAbi,
    functionName: "quoteExactInput",
    args: [packRoute(path), amountIn],
  } satisfies ContractFunction<
    typeof routeQuoterAbi,
    "nonpayable",
    "quoteExactInput"
  >;
}

export function executeSwapParams<ChainId extends number>(
  chainId: ChainId,
  commands: Hex,
  inputs: Hex[],
  value: bigint
) {
  return {
    chainId,
    address: getChainConfig(chainId).UNIVERSAL_ROUTER_ADDRESS,
    abi: universalRouterAbi,
    functionName: "execute",
    args: [commands, inputs],
    value,
  } satisfies ContractFunction<typeof universalRouterAbi, "payable", "execute">;
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
