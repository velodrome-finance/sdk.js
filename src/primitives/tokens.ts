import { Address, ContractFunctionReturnType, zeroAddress } from "viem";

import { DromeConfig } from "../config.js";
import { getChainConfig } from "../utils.js";
import { lpSugarAbi, pricesAbi } from "./abis.js";
import { ContractFunction } from "./utils.js";

export function getTokensParams<ChainId extends number>(
  config: DromeConfig,
  chainId: ChainId,
  offset: number,
  length: number,
  account: Address = zeroAddress,
  addresses: Address[] = []
) {
  return {
    chainId,
    address: getChainConfig(config, chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "tokens",
    args: [BigInt(length), BigInt(offset), account, addresses],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "tokens">;
}

export function getTokenPricesParams<ChainId extends number>(
  config: DromeConfig,
  chainId: ChainId,
  tokens: Address[],
  useWrappers: boolean,
  customConnectors: Address[],
  thresholdFilter: number
) {
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

export type RawToken = ContractFunctionReturnType<
  typeof lpSugarAbi,
  "view",
  "tokens"
>[0];

export {
  initTokenPrices,
  initTokens,
  mergeTokens,
} from "./externals/app/src/hooks/token.worker.js";
export type { Token } from "./externals/app/src/hooks/types.js";
