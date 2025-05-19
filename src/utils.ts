import {
  base,
  celo,
  fraxtal,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  swellchain,
  unichain,
} from "@wagmi/core/chains";
import { DromeConfig } from "./config.js";

export const dromeChains = [
  optimism,
  mode,
  lisk,
  metalL2,
  fraxtal,
  ink,
  soneium,
  superseed,
  swellchain,
  unichain,
  celo,
  base,
] as const;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

let currentConfig: DeepReadonly<DromeConfig> | null = null;

export function initDrome(config: DromeConfig) {
  for (const chainId of config.CHAIN_IDS) {
    if (!dromeChains.some((chain) => chain.id === chainId)) {
      throw new Error(
        `Chain id ${chainId} in config.CHAIN_IDS is not supported.`
      );
    }

    if (!(chainId in config.chains)) {
      throw new Error(
        `No entry found in config.chains for chain id ${chainId}.`
      );
    }
  }

  currentConfig = structuredClone(config);
}

export function getConfig() {
  if (!currentConfig) {
    throw new Error("SDK is not initialized. Call initDrome first.");
  }

  return currentConfig;
}

export function getChainConfig(chainId: number) {
  if (!currentConfig) {
    throw new Error("SDK is not initialized. Call initDrome first.");
  }

  if (!currentConfig.CHAIN_IDS.includes(chainId)) {
    throw new Error(`chainId ${chainId} is not part of the current config.`);
  }

  return currentConfig.chains[chainId];
}
