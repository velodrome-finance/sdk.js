import { getAccount, getBalance, readContract } from "@wagmi/core";
import { mergeAll } from "ramda";
import { Address, extractChain, isAddress } from "viem";

import {
  depaginate,
  getCustomPricesVars,
  getTokenPricesParams as getTokenRatesParams,
  getTokenPricesVars,
  getTokensParams,
  mergeTokens,
  RawTokenRateWithDecimals,
  transformTokenPrices,
  transformTokens,
} from "./primitives/index.js";
import { onDromeError } from "./primitives/utils.js";
import { BaseParams, ChainParams } from "./utils.js";

export async function getListedTokens(params: BaseParams) {
  const { config } = params;
  const customPrices = await getCustomPrices({ config });

  const results = await Promise.allSettled(
    config.dromeConfig.CHAIN_IDS.map((chainId) =>
      getTokensFromChain({ config, chainId, customPrices })
    )
  );

  const chainIds = [] as number[];
  const tokens = [] as Awaited<ReturnType<typeof getTokensFromChain>>[];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const chainId = config.dromeConfig.CHAIN_IDS[i];

    if (result.status === "rejected") {
      onDromeError(
        config.dromeConfig,
        `Failed to fetch tokens for chain ${chainId}.`,
        result.reason
      );
      continue;
    }

    chainIds.push(chainId);
    tokens.push(result.value);
  }

  return mergeTokens({
    config: config.dromeConfig,
    tokensPerChain: tokens,
    chainIds,
  }).sorted;
}

async function getTokensFromChain({
  config,
  chainId,
  customPrices,
}: ChainParams & {
  customPrices: Record<Address, bigint>;
}) {
  const accountAddress = getAccount(config).address;

  const rawTokens = await depaginate(
    (offset, count) =>
      readContract(
        config,
        getTokensParams({
          config: config.dromeConfig,
          chainId,
          offset,
          count,
          accountAddress,
        })
      ),
    config.dromeConfig.TOKENS_PAGE_SIZE,
    config.dromeConfig.POOLS_COUNT_UPPER_BOUND
  );

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
    config: config.dromeConfig,
    chainId,
    rawTokens,
    nativeCurrency: extractChain({ chains: config.chains, id: chainId })
      .nativeCurrency,
    nativeTokenBalance,
    prices,
    customPrices,
  });
}

async function getCustomPrices({ config }: BaseParams) {
  const requests = getCustomPricesVars(config.dromeConfig).map(
    ({ chainId, tokens }) =>
      getTokenPrices({ config, chainId, rawTokens: tokens })
  );

  try {
    const prices = await Promise.all(requests);
    return mergeAll(prices);
  } catch (error) {
    onDromeError(config.dromeConfig, "Failed to fetch custom prices.", error);
    return {};
  }
}

async function getTokenPrices({
  config,
  chainId,
  rawTokens,
}: ChainParams & {
  rawTokens: Array<{ token_address: Address; decimals: number }>;
}) {
  const { tokenChunks, customConnectors, useWrappers, thresholdFilter } =
    getTokenPricesVars(config.dromeConfig, chainId, rawTokens);
  const rawRates: RawTokenRateWithDecimals[] = [];

  await Promise.all(
    tokenChunks.map(async (tokenChunk) => {
      try {
        const rateChunk = await readContract(
          config,
          getTokenRatesParams({
            config: config.dromeConfig,
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
          config.dromeConfig,
          `Failed to get token price chunk.`,
          error
        );
      }
    })
  );

  return transformTokenPrices({
    config: config.dromeConfig,
    chainId,
    rawRates,
    nativeCurrency: extractChain({ chains: config.chains, id: chainId })
      .nativeCurrency,
  });
}

export { Token } from "./primitives";
