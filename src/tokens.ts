import { getAccount, getBalance, readContract } from "@wagmi/core";
import { mergeAll, splitEvery, uniqBy } from "ramda";
import { Address, extractChain, isAddress } from "viem";

import {
  depaginate,
  getTokenPricesParams,
  getTokensParams,
  initTokenPrices,
  initTokens,
  mergeTokens,
  RawToken,
} from "./primitives/index.js";
import {
  DromeWagmiConfig,
  getChainConfig,
  getDefaultChainConfig,
  onDromeError,
} from "./utils.js";

export async function getListedTokens(config: DromeWagmiConfig) {
  const customPrices = await getCustomPrices(config);

  const results = await Promise.allSettled(
    config.dromeConfig.CHAIN_IDS.map((chainId) =>
      getTokensFromChain(config, chainId, customPrices)
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
        `Failed to fetch tokens for chain ${chainId}.`
      );
      continue;
    }

    chainIds.push(chainId);
    tokens.push(result.value);
  }

  return mergeTokens(config.dromeConfig, tokens, chainIds).sorted;
}

async function getTokensFromChain(
  config: DromeWagmiConfig,
  chainId: number,
  customPrices: Record<Address, bigint>
) {
  const accountAddress = getAccount(config).address;

  const rawTokens = await depaginate(
    (offset, length) =>
      readContract(
        config,
        getTokensParams(
          config.dromeConfig,
          chainId,
          offset,
          length,
          accountAddress
        )
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

  const prices = await getTokenPrices(
    config,
    chainId,
    rawTokens.filter((token) => token.listed)
  );

  return initTokens(
    config.dromeConfig,
    chainId,
    rawTokens,
    extractChain({ chains: config.chains, id: chainId }).nativeCurrency,
    nativeTokenBalance,
    [],
    prices,
    customPrices
  );
}

async function getCustomPrices(config: DromeWagmiConfig) {
  const requests = Object.values(config.dromeConfig.PRICE_MAPS).map(
    (mapping) => {
      const chainConfig = getChainConfig(config.dromeConfig, mapping.chainId);

      //including 2 more tokens as USD pricing requires both ETH and stablecoin prices in the tokenlist
      const tokenList = [
        {
          token_address: chainConfig.STABLE_TOKEN,
          decimals: 6,
        },
        {
          token_address:
            chainConfig.WETH_ADDRESS ??
            chainConfig.WRAPPED_NATIVE_TOKEN ??
            getDefaultChainConfig(config.dromeConfig).WRAPPED_NATIVE_TOKEN!,
          decimals: 18,
        },
        { token_address: mapping.substituteToken, decimals: 18 },
      ];

      return getTokenPrices(config, mapping.chainId, tokenList);
    }
  );

  try {
    const prices = await Promise.all(requests);
    return mergeAll(prices);
  } catch {
    onDromeError(config.dromeConfig, "Failed to fetch custom prices.");
    return {};
  }
}

async function getTokenPrices(
  config: DromeWagmiConfig,
  chainId: number,
  tokens: Pick<RawToken, "token_address" | "decimals">[]
) {
  const chainConfig = getChainConfig(config.dromeConfig, chainId);
  const stable = chainConfig.STABLE_TOKEN;
  const connectors = Array.from(
    new Set(chainConfig.CONNECTOR_TOKENS.concat(stable))
  );
  const uniqueTokens = uniqBy((t) => t.token_address, tokens);
  const tokenChunks = splitEvery(
    config.dromeConfig.PRICES_CHUNK_SIZE,
    uniqueTokens
  );
  const rawPrices = {} as Record<Address, bigint>;

  await Promise.all(
    tokenChunks.map(async (tokenChunk) => {
      try {
        const priceChunk = await readContract(
          config,
          getTokenPricesParams(
            config.dromeConfig,
            chainId,
            tokenChunk.map((t) => t.token_address),
            false,
            connectors,
            config.dromeConfig.PRICE_THRESHOLD_FILTER
          )
        );

        Object.assign(
          rawPrices,
          Object.fromEntries(
            priceChunk.map((price, i) => [tokenChunk[i].token_address, price])
          )
        );
      } catch (error) {
        onDromeError(config.dromeConfig, error);
      }
    })
  );

  return initTokenPrices(
    config.dromeConfig,
    chainId,
    uniqueTokens.filter((t) => t.token_address in rawPrices),
    rawPrices,
    extractChain({ chains: config.chains, id: chainId }).nativeCurrency
  );
}
