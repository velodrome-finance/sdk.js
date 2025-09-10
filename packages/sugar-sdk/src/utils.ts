import { getAccount, switchChain } from "@wagmi/core";

import { DromeWagmiConfig } from "./config.js";

export interface BaseParams {
  config: DromeWagmiConfig;
}

export interface ChainParams extends BaseParams {
  chainId: number;
}

export async function ensureConnectedChain(params: ChainParams) {
  const { config, chainId } = params;
  if (chainId !== getAccount(config).chainId) {
    await switchChain(config, { chainId });
  }
}
