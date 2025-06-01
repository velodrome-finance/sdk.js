import { Config } from "@wagmi/core";

import { DromeChainConfig, DromeConfig } from "./config.js";

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DromeWagmiConfig = Config & { dromeConfig: DromeConfig };

export function initDrome<WagmiConfig extends Config>(
  wagmiConfig: WagmiConfig,
  dromeConfig: DromeConfig
) {
  for (const chainId of dromeConfig.CHAIN_IDS) {
    if (!(chainId in dromeConfig.chains)) {
      throw new Error(
        `No entry found in config.chains for chain id ${chainId}.`
      );
    }
  }

  for (const chainId of dromeConfig.EXTERNAL_CHAIN_IDS) {
    if (!(chainId in dromeConfig.externalChains)) {
      throw new Error(
        `No entry found in config.externalChains for chain id ${chainId}.`
      );
    }
  }

  const dromeWagmiConfig = wagmiConfig as unknown as DromeWagmiConfig;
  dromeWagmiConfig.dromeConfig = dromeConfig;

  return dromeWagmiConfig as WagmiConfig & { dromeConfig: DromeConfig };
}

export function getChainConfig(config: DromeConfig, chainId: number) {
  if (chainId in config.chains) {
    return config.chains[chainId];
  }

  if (chainId in config.externalChains) {
    return config.externalChains[chainId] as DromeChainConfig;
  }

  throw new Error(`chainId ${chainId} is not part of the current config.`);
}

export function getDefaultChainConfig(config: DromeConfig) {
  return getChainConfig(config, config.DEFAULT_CHAIN_ID);
}

export function onDromeError(config: DromeConfig, error: unknown) {
  if (config.onError) {
    config.onError(error);
  } else {
    console.log(error);
  }
}
