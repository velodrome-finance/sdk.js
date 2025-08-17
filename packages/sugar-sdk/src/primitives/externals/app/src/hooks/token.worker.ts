// src commit 9b5404e1f6e8c4cf3ce7c4f424c37eae9db51607
import { groupBy, sortBy, uniq, uniqBy } from "ramda";
import { Address, zeroAddress, Chain } from "viem";

import { sortByIdx } from "../lib/helpers.js";

import { SuperchainKey, Token, Tokens } from "./types.js";
import { mulUnsafe } from "./math.js";
import { RawTokenRateWithDecimals, RawToken } from "../../../../tokens.js";
import { DromeConfig } from "../../../../../config.js";
import { getChainConfig, getDefaultChainConfig } from "../../../../utils.js";

export function sortGrouped<T extends Token, S extends Token>(
  grouped: Record<string, T[]>,
  sorted: S[]
) {
  const sortedGrouped: T[][] = [];
  const uniqSymbolSort = uniqBy(t => t.symbol, sorted);
  for (const token of uniqSymbolSort) {
    sortedGrouped.push(grouped[token.symbol]);
  }
  return sortedGrouped;
}

export function transformTokens({
  config,
  chainId,
  rawTokens,
  nativeCurrency,
  nativeTokenBalance = 0n,
  customTokenAddresses = [],
  prices,
  customPrices
}:{
  config: DromeConfig;
  chainId: number;
  rawTokens: RawToken[];
  nativeCurrency: Chain['nativeCurrency'];
  nativeTokenBalance?: bigint;
  customTokenAddresses?: Address[];
  prices: Record<Address, bigint>;
  customPrices: Record<Address, bigint>;
}) {
  const tokenList = uniqBy(t => t.token_address, rawTokens).map((tok) => ({
    ...tok,
    // Remap back some attributes
    balance: tok.account_balance,
    address: tok.token_address.toLowerCase(),
    chainId,
  }));

  const updatedTokenList: Token[] = tokenList.map((token) => {
    const symbol =
      config.tokens[token.address]?.TOKEN_SYMBOL || token.symbol;

    const price =
      customPrices[config.PRICE_MAPS[token.address]?.substituteToken] ||
      prices[token.address] ||
      0n;
    const balanceValue = mulUnsafe(
      token.balance,
      price,
      token.decimals,
      18,
      token.decimals
    );
    return { ...token, price, balanceValue, symbol };
  });

  // Add native token
  const nativeWrapped = getChainConfig(config, chainId).WRAPPED_NATIVE_TOKEN ?? getDefaultChainConfig(config).WRAPPED_NATIVE_TOKEN!;
  const nativeTokenPrice = prices[nativeWrapped] || 0n;
  const nativeToken = {
    ...nativeCurrency,
    address: nativeCurrency.symbol.toLowerCase() as Address,
    listed: true,
    price: nativeTokenPrice,
    balance: nativeTokenBalance,
    balanceValue: mulUnsafe(
      nativeTokenBalance,
      nativeTokenPrice,
      nativeCurrency.decimals
    ),
    chainId,
    wrappedAddress: nativeWrapped,
  };

  const hasNative = nativeWrapped && nativeWrapped !== zeroAddress;
  if (hasNative) {
    updatedTokenList.push(nativeToken);
  }

  // Order and hash these out...
  const all: Record<SuperchainKey, Token> = sortBy(
    (t: Token) => t.symbol.toLowerCase(),
    updatedTokenList
  ).reduce(
    (acc, curr) => {
      acc[`${curr.chainId}:${curr.address}`] = curr;
      return acc;
    },
    {} as Record<SuperchainKey, Token>
  );

  // Leave out non-listed tokens...
  const listed: Token[] = updatedTokenList.filter(
    (token) => token.listed || customTokenAddresses.includes(token.address)
  );

  return {
    all,
    listed,
    native: hasNative ? nativeToken : undefined,
    wrapped: hasNative
      ? all[`${chainId}:${nativeToken.wrappedAddress}`]
      : undefined,
  };
}

/**
 * Updates tokens with OffchainOracle contract prices
 */
export function transformTokenPrices({
  config,
  chainId,
  rawRates,
  nativeCurrency,
}: {
  config: DromeConfig;
  chainId: number;
  rawRates: RawTokenRateWithDecimals[];
  nativeCurrency: Chain['nativeCurrency'];
}) {
  const ethDecimals = BigInt(nativeCurrency.decimals);
  const stable = getChainConfig(config, chainId).STABLE_TOKEN;

  const ethRates = Object.fromEntries(rawRates.map((rawRate) => {
    // rates are returned multiplied by eth decimals + the difference in decimals to eth
    // we want them all normalized to 18 decimals
    const { rate, address } = rawRate;
    const decimals = BigInt(rawRate.decimals);
    let normalizedRate = rate;
    if (decimals !== ethDecimals) {
      if (decimals < ethDecimals) {
        normalizedRate = rate / 10n ** (ethDecimals - decimals);
      } else {
        normalizedRate = rate * 10n ** (decimals - ethDecimals);
      }
    }
    return [address.toLowerCase(), normalizedRate];
  }));

  const ethRate =
    ethRates[
      getChainConfig(config, chainId).WETH_ADDRESS ?? getChainConfig(config, chainId).WRAPPED_NATIVE_TOKEN ?? getDefaultChainConfig(config).WRAPPED_NATIVE_TOKEN!
    ] || 0n;
  const usdEthRate = ethRates[stable.toLowerCase()] || 1n;

  // this gives us the price of 1 eth in usd with 18 decimals precision
  const usdEthPrice = (ethRate * 10n ** ethDecimals) / usdEthRate;

  // convert all rates to usd prices
  return Object.entries(ethRates).reduce(
    (acc, [address, rate]) => {
      // to get the price in usd we multiply the token/eth rate by the usd price of 1 eth
      // and divide by 10^18 to get back to 18 decimals
      acc[address as Address] = (rate * usdEthPrice) / 10n ** ethDecimals;
      return acc;
    },
    {} as { [key: Address]: bigint }
  );
}

export function mergeTokens({
  config,
  tokensPerChain,
  chainIds
}: {
  config: DromeConfig;
  tokensPerChain: ReturnType<typeof transformTokens>[];
  chainIds: number[];
}) {
  const allTokens = Object.assign({}, ...tokensPerChain.map((r) => r.all));
  const listed = uniqBy(
    (token) => `${token.chainId}:${token.address}`,
    tokensPerChain.map((r) => r.listed).flat()
  );

  // important tokens from all chains, sorted by default order
  const importantTokens = uniq(
    chainIds.reduce((p, id) => {
      p.push(getChainConfig(config, id).STABLE_TOKEN);
      p.push(...getChainConfig(config, id).DEFAULT_TOKENS);
      p.push(...getChainConfig(config, id).CONNECTOR_TOKENS);
      return p;
    }, [] as Address[])
  )
    .map((a) => listed.find((t) => t.address.toLowerCase() === a.toLowerCase()))
    .filter((t) => !!t)
    .sort((a, b) => {
      return (
        sortByIdx(
          config.DEFAULT_TOKEN_ORDER.map((s) => s.toLowerCase()),
          a.symbol.toLowerCase(),
          b.symbol.toLowerCase()
        ) ?? b.symbol.localeCompare(a.symbol)
      );
    })
    .map((t) => t.address);

  const sortedTokenList = listed.sort((a, b) => {
    // First priority: balanceValue (descending order)
    if (a.balanceValue !== b.balanceValue)
      return a.balanceValue > b.balanceValue ? -1 : 1;

    // Next priority: whether address is in importantTokens
    const importantIdx = sortByIdx(importantTokens, a.address, b.address);
    if (importantIdx !== undefined) return importantIdx;

    // Lowest priority: symbol (ascending order)
    return a.symbol.localeCompare(b.symbol);
  });

  const tokens = Object.fromEntries(
    sortedTokenList.map((token) => [`${token.chainId}:${token.address}`, token])
  );

  // grouping loses the sorting so need resort
  const groupedBySymbol = sortGrouped(
    groupBy(t => t.symbol, listed) as { [index: string]: Token[] },
    sortedTokenList
  );

  const nativeMap: Record<number, Token> = {},
    wrappedMap: Record<number, Token> = {};
  for (const result of tokensPerChain) {
    if (result.native) nativeMap[result.native.chainId] = result.native;
    if (result.wrapped) wrappedMap[result.wrapped.chainId] = result.wrapped;
  }

  return {
    ...tokens,
    all: allTokens,
    sorted: sortedTokenList,
    native: nativeMap,
    wrapped: wrappedMap,
    grouped: groupedBySymbol,
  } as Tokens;
}
