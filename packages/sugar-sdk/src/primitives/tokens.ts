import { splitEvery, uniqBy } from "ramda";
import { Address, ContractFunctionReturnType, zeroAddress } from "viem";

import { Config } from "../config.js";
import { lpSugarAbi, pricesAbi } from "./abis.js";
import {
  ContractFunction,
  getChainConfig,
  getDefaultChainConfig,
} from "./utils.js";

/**
 * Builds contract call parameters for fetching token data.
 *
 * Returns parameters for calling the LP Sugar contract's "tokens" function,
 * which retrieves token metadata, balances, and other information.
 *
 * @template ChainId The chain ID type
 * @param params - Parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID to query
 * @param params.offset - The starting index in the token list
 * @param params.count - The number of tokens to return
 * @param params.accountAddress - Optional account address to fetch balances for
 * @param params.addresses - Optional array of specific token addresses to fetch
 * @returns ContractFunction object containing parameters for calling the LP Sugar tokens function
 *
 * @internal
 */
export function getTokensParams<ChainId extends number>({
  config,
  chainId,
  offset,
  count,
  accountAddress = zeroAddress,
  addresses = [],
}: {
  config: Config;
  chainId: ChainId;
  offset: number;
  count: number;
  accountAddress?: Address;
  addresses?: Address[];
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "tokens",
    args: [BigInt(count), BigInt(offset), accountAddress, addresses],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "tokens">;
}

/**
 * Builds contract call parameters for fetching token prices.
 *
 * Returns parameters for calling the Prices contract's getManyRatesToEthWithCustomConnectors
 * function, which calculates token prices relative to ETH using specified routing connectors.
 *
 * @template ChainId The chain ID type
 * @param params - Parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID to query
 * @param params.tokens - Array of token addresses to get prices for
 * @param params.useWrappers - Whether to use wrapped token prices
 * @param params.customConnectors - Array of connector token addresses for routing
 * @param params.thresholdFilter - Minimum liquidity threshold for valid prices
 * @returns ContractFunction object containing parameters for calling the Prices contract's getManyRatesToEthWithCustomConnectors function
 *
 * @internal
 */
export function getTokenPricesParams<ChainId extends number>({
  config,
  chainId,
  tokens,
  useWrappers,
  customConnectors,
  thresholdFilter,
}: {
  config: Config;
  chainId: ChainId;
  tokens: Address[];
  useWrappers: boolean;
  customConnectors: Address[];
  thresholdFilter: number;
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).PRICES_ADDRESS,
    abi: pricesAbi,
    functionName: "getManyRatesToEthWithCustomConnectors",
    args: [tokens, useWrappers, customConnectors, BigInt(thresholdFilter)],
  } satisfies ContractFunction<
    typeof pricesAbi,
    "view",
    "getManyRatesToEthWithCustomConnectors"
  >;
}

/**
 * Prepares variables for fetching custom cross-chain token prices.
 *
 * For tokens configured with custom price mappings (in PRICE_MAPS), this function
 * builds the necessary parameters to fetch their prices from substitute tokens on
 * different chains.
 *
 * @param config - The SDK configuration
 * @returns Array of objects with chainId (number) and tokens (array of token objects with address and decimals)
 *
 * @internal
 */
export function getCustomPricesVars(config: Config): Array<{
  chainId: number;
  tokens: Array<{ token_address: Address; decimals: number }>;
}> {
  return Object.values(config.PRICE_MAPS).map(
    ({ chainId, substituteToken }) => {
      const chainConfig = getChainConfig(config, chainId);

      //including 2 more tokens as USD pricing requires both ETH and stablecoin prices in the tokenlist
      const tokens = [
        {
          token_address: chainConfig.STABLE_TOKEN,
          decimals: 6,
        },
        {
          token_address:
            chainConfig.WETH_ADDRESS ??
            chainConfig.WRAPPED_NATIVE_TOKEN ??
            getDefaultChainConfig(config).WRAPPED_NATIVE_TOKEN!,
          decimals: 18,
        },
        { token_address: substituteToken, decimals: 18 },
      ];

      return { chainId, tokens };
    }
  );
}

/**
 * Prepares variables for fetching token prices in batches.
 *
 * Splits the token list into optimally-sized chunks and prepares connector tokens
 * for price routing calculations.
 *
 * @param config - The SDK configuration
 * @param chainId - The chain ID where tokens exist
 * @param rawTokens - Array of tokens to get prices for
 * @returns Object containing tokenChunks (array of token arrays), customConnectors (Address[]), useWrappers (boolean), and thresholdFilter (number)
 *
 * @internal
 */
export function getTokenPricesVars(
  config: Config,
  chainId: number,
  rawTokens: Pick<RawToken, "token_address" | "decimals">[]
): {
  tokenChunks: Array<Pick<RawToken, "token_address" | "decimals">[]>;
  customConnectors: Address[];
  useWrappers: boolean;
  thresholdFilter: number;
} {
  const { STABLE_TOKEN, CONNECTOR_TOKENS } = getChainConfig(config, chainId);
  const customConnectors = Array.from(
    new Set(CONNECTOR_TOKENS.concat(STABLE_TOKEN))
  );
  const tokenChunks = splitEvery(
    Math.max(3, Math.min(Math.ceil(rawTokens.length / 60), 20)), // keep chunk size between 3 and 20,
    uniqBy((t) => t.token_address, rawTokens)
  );

  return {
    tokenChunks,
    customConnectors,
    useWrappers: false,
    thresholdFilter: config.PRICE_THRESHOLD_FILTER,
  };
}

/**
 * Type representing raw token data as returned from the LP Sugar contract.
 * Contains all token metadata, balances, and pool information.
 */
export type RawToken = ContractFunctionReturnType<
  typeof lpSugarAbi,
  "view",
  "tokens"
>[0];

/**
 * Type representing a token's price rate with its decimal precision.
 * Used for converting raw price data to human-readable formats.
 */
export type RawTokenRateWithDecimals = {
  /** Token contract address */
  address: Address;
  /** Price rate as a bigint */
  rate: bigint;
  /** Number of decimal places for the token */
  decimals: number;
};

export {
  mergeTokens,
  transformTokenPrices,
  transformTokens,
} from "./externals/app/src/hooks/token.worker.js";
export type { Token } from "./externals/app/src/hooks/types.js";
