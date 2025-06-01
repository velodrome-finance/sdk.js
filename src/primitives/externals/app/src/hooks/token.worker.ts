// src commit 9b5404e1f6e8c4cf3ce7c4f424c37eae9db51607
import { groupBy, sortBy, uniq, uniqBy } from "ramda";
import { Address, zeroAddress, Chain } from "viem";

import { sortByIdx } from "../lib/helpers";

import { SuperchainKey, Token, Tokens } from "./types";
import { mulUnsafe } from "./math.js";
import { RawToken } from "../../../../tokens.js";
import { DromeConfig } from "../../../../../config.js";
import { getChainConfig, getDefaultChainConfig } from "../../../../../utils.js";

export function sortGrouped<T extends Token, S extends Token>(
  grouped: Record<string, T[]>,
  sorted: S[]
) {
  const sortedGrouped: T[][] = [];
  // diff const uniqSymbolSort = uniqBy(sorted, "symbol");
  const uniqSymbolSort = uniqBy(t => t.symbol, sorted);
  for (const token of uniqSymbolSort) {
    sortedGrouped.push(grouped[token.symbol]);
  }
  return sortedGrouped;
}

// diff export async function fetchTokenPricesAndBalances(
export function initTokens(
  // diff+
  dromeConfig: DromeConfig,
  // diff chain: Superchain,
  chainId: number,
  // diff+
  rawTokens: RawToken[],
  // diff+
  nativeCurrency: Chain['nativeCurrency'],
  // diff+
  nativeTokenBalance: bigint = 0n,
  customTokenAddresses: Address[],
  // diff- accountAddress: Address | null,
  // diff+
  prices: Record<Address, bigint>,
  pricesMap: Record<Address, bigint>
) {
  // diff- const tokenList = await paginate({
  // diff-   limit: TOKENS_PAGE_SIZE,
  // diff-   upperBound: POOLS_COUNT_UPPER_BOUND,
  // diff-   fetchData: (limit: number, offset: number) => {
  // diff-     const customAddys =
  // diff-       offset > customTokenAddresses.length ? [] : customTokenAddresses;
  // diff-     //if offset is greater, then those tokens have already been fetched
  // diff-     return readContract({
  // diff-       chainId: chain.id,
  // diff-       address: chain.superchainConfig.sugar,
  // diff-       abi: LP_SUGAR_ABI,
  // diff-       functionName: "tokens",
  // diff-       args: [
  // diff-         BigInt(limit),
  // diff-         BigInt(offset),
  // diff-         accountAddress || zeroAddress,
  // diff-         customAddys,
  // diff-       ],
  // diff-     });
  // diff-   },
  // diff- }).then((toks) => {
    // diff return uniqBy(toks, "token_address").map((tok) => ({
  const tokenList = uniqBy(t => t.token_address, rawTokens).map((tok) => ({
    ...tok,
    // Remap back some attributes
    balance: tok.account_balance,
    address: tok.token_address.toLowerCase(),
    // diff chainId: chain.id,
    chainId,
  }));
  // diff- });

  // diff- // Filter only whitelisted tokens
  // diff- const prices = await fetchOnchainTokenPrices(
  // diff-   tokenList.filter(
  // diff-     (tok) =>
  // diff-       tok.listed || customTokenAddresses.includes(tok.address.toLowerCase())
  // diff-   ),
  // diff-   chain
  // diff- );

  const updatedTokenList: Token[] = tokenList.map((token) => {
    const symbol =
      // diff import.meta.env[`VITE_TOKEN_SYMBOL_${token.address}`] || token.symbol;
      dromeConfig.tokens[token.address]?.TOKEN_SYMBOL || token.symbol;

    const price =
      // diff pricesMap[PRICE_MAPPINGS.map[token.address]] ||
      pricesMap[dromeConfig.PRICE_MAPS[token.address]?.substituteToken] ||
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
  // diff+
  const nativeWrapped = getChainConfig(dromeConfig, chainId).WRAPPED_NATIVE_TOKEN ?? getDefaultChainConfig(dromeConfig).WRAPPED_NATIVE_TOKEN!;
  // diff const nativeTokenPrice = prices[chain.superchainConfig.nativeWrapped] || 0n;
  const nativeTokenPrice = prices[nativeWrapped] || 0n;
  // diff- const nativeTokenBalance =
  // diff-   accountAddress && isAddress(accountAddress)
  // diff-     ? await getBalance({
  // diff-         address: accountAddress,
  // diff-         chainId: chain.id,
  // diff-       })
  // diff-     : 0n;
  const nativeToken = {
    // diff ...chain.nativeCurrency,
    ...nativeCurrency,
    // diff address: chain.nativeCurrency.symbol.toLowerCase() as Address,
    address: nativeCurrency.symbol.toLowerCase() as Address,
    listed: true,
    price: nativeTokenPrice,
    balance: nativeTokenBalance,
    balanceValue: mulUnsafe(
      nativeTokenBalance,
      nativeTokenPrice,
      // diff chain.nativeCurrency.decimals
      nativeCurrency.decimals
    ),
    // diff chainId: chain.id,
    chainId,
    // diff wrappedAddress: chain.superchainConfig.nativeWrapped,
    wrappedAddress: nativeWrapped,
  };

  // diff- const nativeWrapped = chain.superchainConfig.nativeWrapped;
  const hasNative = nativeWrapped && nativeWrapped !== zeroAddress;
  if (hasNative) {
    updatedTokenList.push(nativeToken);
  }

  // Order and hash these out...
  // diff const all: Record<SuperchainKey, Token> = orderBy(updatedTokenList, [
  const all: Record<SuperchainKey, Token> = sortBy(
    (t: Token) => t.symbol.toLowerCase(),
    // diff+
    updatedTokenList
  // diff ]).reduce(
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
      // diff ? all[`${chain.id}:${nativeToken.wrappedAddress}`]
      ? all[`${chainId}:${nativeToken.wrappedAddress}`]
      : undefined,
  };
}

/**
 * Updates tokens with OffchainOracle contract prices
 */
// diff export async function fetchOnchainTokenPrices(
export function initTokenPrices(
  // diff- tokenList: { address: Address; decimals: number }[],
  // diff+
  dromeConfig: DromeConfig,
  // diff chain: Superchain,
  chainId: number,
  // diff+
  tokenList: Pick<RawToken, 'token_address' | 'decimals'>[],
  // diff+
  rawPrices: Record<Address, bigint>,
  // diff+
  nativeCurrency: Chain['nativeCurrency'],
) {
  // diff const ethDecimals = BigInt(chain.nativeCurrency.decimals);
  const ethDecimals = BigInt(nativeCurrency.decimals);
  // diff const stable = chain.superchainConfig.stable;
  const stable = getChainConfig(dromeConfig, chainId).STABLE_TOKEN;
  // diff- const connectors = Array.from(
  // diff-   new Set(chain.superchainConfig.oracleConnectors.concat(stable))
  // diff- );

  // diff- const tokenChunks = chunk(tokenList, PRICES_CHUNK_SIZE);

  // diff- const results = await Promise.allSettled(
  // diff-   tokenChunks.map(async (tokenChunk) => {
  // diff-     const result = await readContract({
  // diff-       chainId: chain.id,
  // diff-       address: chain.superchainConfig.oracle,
  // diff-       abi: PRICES_ABI,
  // diff-       functionName: "getManyRatesToEthWithCustomConnectors",
  // diff-       args: [
  // diff-         tokenChunk.map((t) => t.address as Address),
  // diff-         false,
  // diff-         connectors,
  // diff-         BigInt(PRICE_THRESHOLD_FILTER),
  // diff-       ],
  // diff-     });

  // diff-     return result.map((rate, i) => {
  // diff+
  const ethRates = Object.fromEntries(Object.entries(rawPrices).map(([address, rate]) => {
    // rates are returned multiplied by eth decimals + the difference in decimals to eth
    // we want them all normalized to 18 decimals
    // diff const decimals = BigInt(tokenChunk[i].decimals);
    const decimals = BigInt(tokenList.find(t => t.token_address === address)!.decimals);
    let normalizedRate = rate;
    if (decimals !== ethDecimals) {
      if (decimals < ethDecimals) {
        normalizedRate = rate / 10n ** (ethDecimals - decimals);
      } else {
        normalizedRate = rate * 10n ** (decimals - ethDecimals);
      }
    }
    // diff       return [normalizedRate, tokenChunk[i].address] as const;
    return [address.toLowerCase(), normalizedRate];
  // diff      });
  }));
  // diff-   })
  // diff- );

  // diff- // reduce chunked responses to token prices map
  // diff- const ethRates = results.reduce(
  // diff-   (prices, result) => {
  // diff-     if (result.status === "rejected") {
  // diff-       console.error(result.reason);
  // diff-       return prices;
  // diff-     }
  // diff-     for (const [rate, address] of result.value) {
  // diff-       prices[address] = rate;
  // diff-     }
  // diff-     return prices;
  // diff-   },
  // diff-   {} as Record<Address, bigint>
  // diff- );

  const ethRate =
    ethRates[
      // diff chain.superchainConfig.weth || chain.superchainConfig.nativeWrapped
      getChainConfig(dromeConfig, chainId).WETH_ADDRESS ?? getChainConfig(dromeConfig, chainId).WRAPPED_NATIVE_TOKEN ?? getDefaultChainConfig(dromeConfig).WRAPPED_NATIVE_TOKEN!
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

export function mergeTokens(
  // diff+
  dromeConfig: DromeConfig,
  // diff results: Awaited<ReturnType<typeof fetchTokenPricesAndBalances>>[],
  results: ReturnType<typeof initTokens>[],
  // diff chains: Superchain[]
  chainIds: number[]
) {
  // diff const allTokens = merge({}, ...results.map((r) => r.all));
  const allTokens = Object.assign({}, ...results.map((r) => r.all));
  const listed = uniqBy(
    // diff+
    (token) => `${token.chainId}:${token.address}`,
    // diff concat(...results.map((r) => r.listed)),
    results.map((r) => r.listed).flat()
    // diff- (token) => `${token.chainId}:${token.address}`,
  );

  // important tokens from all chains, sorted by default order
  const importantTokens = uniq(
    // diff chains.reduce((p, c) => {
    chainIds.reduce((p, id) => {
      // diff p.push(c.superchainConfig.stable);
      p.push(getChainConfig(dromeConfig, id).STABLE_TOKEN);
      // diff p.push(...c.superchainConfig.defaultTokens);
      p.push(...getChainConfig(dromeConfig, id).DEFAULT_TOKENS);
      // diff p.push(...c.superchainConfig.oracleConnectors);
      p.push(...getChainConfig(dromeConfig, id).CONNECTOR_TOKENS);
      return p;
    }, [] as Address[])
  )
    .map((a) => listed.find((t) => t.address.toLowerCase() === a.toLowerCase()))
    .filter((t) => !!t)
    .sort((a, b) => {
      return (
        sortByIdx(
          // diff DEFAULT_TOKEN_ORDER.map((s) => s.toLowerCase()),
          dromeConfig.DEFAULT_TOKEN_ORDER.map((s) => s.toLowerCase()),
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
    // diff groupBy(listed, "symbol"),
    groupBy(t => t.symbol, listed) as { [index: string]: Token[] },
    sortedTokenList
  );

  const nativeMap: Record<number, Token> = {},
    wrappedMap: Record<number, Token> = {};
  for (const result of results) {
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
