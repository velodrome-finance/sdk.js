import { getAccount, getBalance, readContract } from "@wagmi/core";
import { mergeAll } from "ramda";
import { uniqBy } from "ramda";
import { Address, extractChain, isAddress } from "viem";

import { getPoolsPagination } from "./pools.js";
import type { Token } from "./primitives/index.js";
import {
  getCustomPricesVars,
  getTokenPricesParams as getTokenRatesParams,
  getTokenPricesVars,
  getTokensParams,
  mergeTokens,
  paginate,
  RawTokenRateWithDecimals,
  transformTokenPrices,
  transformTokens,
} from "./primitives/index.js";
import { onDromeError } from "./primitives/utils.js";
import { BaseParams, ChainParams } from "./utils.js";

/**
 * Retrieves all listed tokens across all configured chains.
 *
 * Fetches token data from every chain in the configuration, including balances for the
 * connected account, current prices, and metadata. Results are merged and sorted according
 * to the configured token order.
 *
 * @param params - Base parameters
 * @param params.config - The Sugar SDK configuration
 * @returns Promise that resolves to an array of Token objects representing all listed tokens sorted by configured order
 *
 * @example
 * ```typescript
 * const tokens = await getListedTokens({ config });
 * console.log(`Found ${tokens.length} tokens across all chains`);
 * tokens.forEach(token => {
 *   console.log(`${token.symbol}: $${token.price}`);
 * });
 * // tokens: Token[]
 * ```
 */
export async function getListedTokens(params: BaseParams): Promise<Token[]> {
  const { config } = params;
  const customPrices = await getCustomPrices({ config });

  const results = await Promise.allSettled(
    config.sugarConfig.chains.map((chain) =>
      getTokensFromChain({ config, chainId: chain.CHAIN.id, customPrices })
    )
  );

  const chainIds = [] as number[];
  const tokens = [] as Awaited<ReturnType<typeof getTokensFromChain>>[];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const chainId = config.sugarConfig.chains[i].CHAIN.id;

    if (result.status === "rejected") {
      onDromeError(
        config.sugarConfig,
        `Failed to fetch tokens for chain ${chainId}.`,
        result.reason
      );
      continue;
    }

    chainIds.push(chainId);
    tokens.push(result.value);
  }

  return mergeTokens({
    config: config.sugarConfig,
    tokensPerChain: tokens,
    chainIds,
  }).sorted;
}

/**
 * Fetches token data from a specific blockchain.
 *
 * Retrieves all listed tokens from the specified chain, including their balances,
 * prices, and metadata. Uses pagination to handle large token lists efficiently.
 *
 * @param params - Chain-specific parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.chainId - The chain ID to fetch tokens from
 * @param params.customPrices - Mapping of token addresses to custom price overrides
 * @returns Promise that resolves to an array of Token objects from the specified chain
 *
 * @internal
 */
async function getTokensFromChain({
  config,
  chainId,
  customPrices,
}: ChainParams & {
  customPrices: Record<Address, bigint>;
}): Promise<ReturnType<typeof transformTokens>> {
  const accountAddress = getAccount(config).address;
  const { upperBound } = await getPoolsPagination({ config, chainId });

  const rawTokens = await paginate({
    // TODO: once https://github.com/velodrome-finance/sugar/pull/130/commits/4c6f795383dd5338ebdd8b258ae8a94a45e52487 is deployed we can paginate this call
    limit: 1000, // currently limit is for tokens or pools, while offset is only for pools
    upperBound,
    fetchData: (limit, offset) => {
      return readContract(
        config,
        getTokensParams({
          config: config.sugarConfig,
          chainId,
          offset,
          count: limit,
          accountAddress,
        })
      );
    },
  }).then((toks) => {
    return uniqBy((t) => t.token_address, toks).map((tok) => ({
      ...tok,
      // Remap back some attributes
      balance: tok.account_balance,
      address: tok.token_address.toLowerCase(),
      chainId,
    }));
  });

  const nativeTokenBalance =
    accountAddress && isAddress(accountAddress)
      ? (
          await getBalance(config, {
            address: accountAddress,
            chainId,
          })
        ).value
      : 0n;

  const prices = await getTokenPrices({
    config,
    chainId,
    rawTokens: rawTokens.filter((token) => token.listed),
  });

  return transformTokens({
    config: config.sugarConfig,
    chainId,
    rawTokens,
    nativeCurrency: extractChain({ chains: config.chains, id: chainId })
      .nativeCurrency,
    nativeTokenBalance,
    prices,
    customPrices,
  });
}

/**
 * Fetches custom price overrides for tokens that need cross-chain price lookups.
 *
 * Some tokens require their price to be fetched from a different chain than where
 * they exist. This function handles those custom price mappings.
 *
 * @param params - Base parameters
 * @param params.config - The Sugar SDK configuration
 * @returns Promise that resolves to a Record mapping token addresses (Address) to their custom prices (bigint)
 *
 * @internal
 */
async function getCustomPrices({
  config,
}: BaseParams): Promise<Record<Address, bigint>> {
  const requests = getCustomPricesVars(config.sugarConfig).map(
    ({ chainId, tokens }) =>
      getTokenPrices({ config, chainId, rawTokens: tokens })
  );

  try {
    const prices = await Promise.all(requests);
    return mergeAll(prices);
  } catch (error) {
    onDromeError(config.sugarConfig, "Failed to fetch custom prices.", error);
    return {};
  }
}

/**
 * Retrieves current prices for a set of tokens on a specific chain.
 *
 * Fetches token prices from the on-chain prices oracle contract. Handles chunking
 * of requests to avoid hitting gas limits and returns normalized price data.
 *
 * @param params - Price fetching parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.chainId - The chain ID where tokens exist
 * @param params.rawTokens - Array of token objects with address and decimals
 * @returns Promise that resolves to a Record mapping token addresses (Address) to their USD prices (bigint)
 *
 * @internal
 */
async function getTokenPrices({
  config,
  chainId,
  rawTokens,
}: ChainParams & {
  rawTokens: Array<{ token_address: Address; decimals: number }>;
}): Promise<Record<Address, bigint>> {
  const { tokenChunks, customConnectors, useWrappers, thresholdFilter } =
    getTokenPricesVars(config.sugarConfig, chainId, rawTokens);
  const rawRates: RawTokenRateWithDecimals[] = [];

  await Promise.all(
    tokenChunks.map(async (tokenChunk) => {
      try {
        const rateChunk = await readContract(
          config,
          getTokenRatesParams({
            config: config.sugarConfig,
            chainId,
            tokens: tokenChunk.map((t) => t.token_address),
            useWrappers,
            customConnectors,
            thresholdFilter,
          })
        );

        rawRates.push(
          ...rateChunk.map((rate, i) => ({
            address: tokenChunk[i].token_address,
            decimals: tokenChunk[i].decimals,
            rate,
          }))
        );
      } catch (error) {
        onDromeError(
          config.sugarConfig,
          `Failed to get token price chunk.`,
          error
        );
      }
    })
  );

  return transformTokenPrices({
    config: config.sugarConfig,
    chainId,
    rawRates,
    nativeCurrency: extractChain({ chains: config.chains, id: chainId })
      .nativeCurrency,
  });
}

export { Token } from "./primitives";
