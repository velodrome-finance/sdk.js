import {
  Config,
  createConfig,
  getAccount,
  http,
  injected,
  switchChain,
} from "@wagmi/core";
import { type Chain, optimism } from "@wagmi/core/chains";

import { DromeConfig } from "./config.js";
import { velodromeConfig } from "./config.js";

export type DromeWagmiConfig = Config & { dromeConfig: DromeConfig };

export interface BaseParams {
  config: DromeWagmiConfig;
}

export interface ChainParams extends BaseParams {
  chainId: number;
}

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

export async function ensureConnectedChain(params: ChainParams) {
  const { config, chainId } = params;
  if (chainId !== getAccount(config).chainId) {
    await switchChain(config, { chainId });
  }
}

export function getDefaultDrome() {
  const chains = [optimism] as [Chain, ...Chain[]];

  return initDrome(
    createConfig({
      chains,
      connectors: [injected()],
      transports: Object.fromEntries(
        chains.map((chain) => {
          const rpc = process.env[`VITE_RPC_${chain.id}`];
          if (!rpc) {
            throw new Error(
              `Missing RPC URL. Please pass VITE_RPC_${chain.id} as an environment variable.`
            );
          }
          return [chain.id, http(rpc, { batch: true })];
        })
      ),
    }),
    {
      ...velodromeConfig,
      CHAIN_IDS: chains.map((c) => c.id),
      chains: Object.entries(velodromeConfig.chains)
        .filter(([k]) => k === "10")
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, any>
        ),
      onError(error: any) {
        throw error;
      },
    }
  );
}
