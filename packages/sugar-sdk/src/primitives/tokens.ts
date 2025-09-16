import { splitEvery, uniqBy } from "ramda";
import { Address, ContractFunctionReturnType, zeroAddress } from "viem";

import { Config } from "../config.js";
import { lpSugarAbi, pricesAbi } from "./abis.js";
import {
  ContractFunction,
  getChainConfig,
  getDefaultChainConfig,
} from "./utils.js";

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

export function getCustomPricesVars(config: Config) {
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

export function getTokenPricesVars(
  config: Config,
  chainId: number,
  rawTokens: Pick<RawToken, "token_address" | "decimals">[]
) {
  const { STABLE_TOKEN, CONNECTOR_TOKENS } = getChainConfig(config, chainId);
  const customConnectors = Array.from(
    new Set(CONNECTOR_TOKENS.concat(STABLE_TOKEN))
  );
  const tokenChunks = splitEvery(
    config.PRICES_CHUNK_SIZE,
    uniqBy((t) => t.token_address, rawTokens)
  );

  return {
    tokenChunks,
    customConnectors,
    useWrappers: false,
    thresholdFilter: config.PRICE_THRESHOLD_FILTER,
  };
}

export type RawToken = ContractFunctionReturnType<
  typeof lpSugarAbi,
  "view",
  "tokens"
>[0];

export type RawTokenRateWithDecimals = {
  address: Address;
  rate: bigint;
  decimals: number;
};

export {
  mergeTokens,
  transformTokenPrices,
  transformTokens,
} from "./externals/app/src/hooks/token.worker.js";
export type { Token } from "./externals/app/src/hooks/types.js";
