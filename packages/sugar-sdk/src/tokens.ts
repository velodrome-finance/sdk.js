import { getAccount, getBalance, readContract } from "@wagmi/core";
import { mergeAll } from "ramda";
import { uniqBy } from "ramda";
import { Address, extractChain, isAddress } from "viem";

import { getPoolsPagination } from "./pools.js";
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

export async function getListedTokens(params: BaseParams) {
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

async function getTokensFromChain({
  config,
  chainId,
  customPrices,
}: ChainParams & {
  customPrices: Record<Address, bigint>;
}) {
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

async function getCustomPrices({ config }: BaseParams) {
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

async function getTokenPrices({
  config,
  chainId,
  rawTokens,
}: ChainParams & {
  rawTokens: Array<{ token_address: Address; decimals: number }>;
}) {
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
