import { Config } from "@wagmi/core";

import { DromeConfig } from "./config.js";

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

  const dromeWagmiConfig = wagmiConfig as unknown as DromeWagmiConfig;
  dromeWagmiConfig.dromeConfig = dromeConfig;

  return dromeWagmiConfig as WagmiConfig & { dromeConfig: DromeConfig };
}

export function getChainConfig(config: DromeConfig, chainId: number) {
  if (!config.CHAIN_IDS.includes(chainId)) {
    throw new Error(`chainId ${chainId} is not part of the current config.`);
  }

  return config.chains[chainId];
}
