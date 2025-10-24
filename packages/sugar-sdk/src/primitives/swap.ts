import { Address, Hex } from "viem";

import { Config } from "../config.js";
import { routeQuoterAbi, universalRouterAbi } from "./abis.js";
import { packRoute } from "./externals/app/src/hooks/lib.js";
import { setupPlanner } from "./externals/app/src/hooks/swap.js";
import { Quote, RouteElement, Token } from "./externals/app/src/hooks/types.js";
import { RoutePlanner } from "./externals/app/src/lib/router.js";
import { ContractFunction, getChainConfig } from "./utils.js";

/**
 * Builds contract call parameters for getting a swap quote.
 *
 * Creates the parameters needed to call the quoter contract's quoteExactInput function,
 * which returns the expected output amount for a given swap route.
 *
 * @template ChainId The chain ID type
 * @param params - Quote parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID where the quote will be executed
 * @param params.path - The swap route as an array of route elements
 * @param params.amountIn - The input amount to quote
 * @returns ContractFunction object containing parameters for calling the quoter's quoteExactInput function
 *
 * @internal
 */
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
    args: [packRoute(chainId, config, path, "quote"), amountIn],
  } satisfies ContractFunction<
    typeof routeQuoterAbi,
    "nonpayable",
    "quoteExactInput"
  >;
}

/**
 * Builds contract call parameters for executing a swap.
 *
 * Creates the parameters needed to call the Universal Router's execute function
 * with the encoded swap commands and inputs.
 *
 * @template ChainId The chain ID type
 * @param params - Execution parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID where the swap will be executed
 * @param params.commands - Encoded command sequence for the router
 * @param params.inputs - Array of encoded input parameters
 * @param params.value - Native token value to send with the transaction
 * @returns ContractFunction object containing parameters for calling the Universal Router's execute function
 *
 * @internal
 */
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

/**
 * Prepares variables needed for getting a swap quote.
 *
 * Validates that both tokens are on the same chain and identifies unsafe tokens
 * that should be excluded from routing paths.
 *
 * @param config - The SDK configuration
 * @param fromToken - The token being sold
 * @param toToken - The token being bought
 * @returns Object containing chainId (number), poolsPageSize (number), mustExcludeTokens (Set<Address>), and spenderAddress (Address)
 * @throws Error if tokens are on different chains
 *
 * @internal
 */
export function getQuoteForSwapVars(
  config: Config,
  fromToken: Token,
  toToken: Token
): {
  chainId: number;
  poolsPageSize: number;
  mustExcludeTokens: Set<Address>;
  spenderAddress: Address;
} {
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

/**
 * Prepares variables and planner needed for executing a swap.
 *
 * Sets up the transaction planner with the quote and slippage tolerance,
 * and determines the native token value to send with the transaction.
 *
 * @param config - The SDK configuration
 * @param quote - The swap quote to execute
 * @param slippagePct - Slippage tolerance as percentage string. Defaults to 1% for concentrated liquidity pools, 0.5% otherwise
 * @param accountAddress - Address of the account executing the swap
 * @returns Object containing chainId (number), planner (with commands and inputs), and amount (bigint)
 *
 * @internal
 */
export function getSwapVars(
  config: Config,
  quote: Quote,
  slippagePct = quote.path.nodes.some((n) => n.type >= 50) ? "1" : "0.5",
  accountAddress?: Address
): {
  chainId: number;
  planner: RoutePlanner;
  amount: bigint;
} {
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
