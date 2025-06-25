import { Config, getAccount, switchChain } from "@wagmi/core";

import { DromeConfig } from "./config.js";

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

export async function ensureConnectedChain(
  config: DromeWagmiConfig,
  chainId: number
) {
  if (chainId !== getAccount(config).chainId) {
    await switchChain(config, { chainId });
  }
}
