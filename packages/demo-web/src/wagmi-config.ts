import {
  base,
  celo,
  fraxtal,
  getDefaultConfig,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  type SugarWagmiConfig,
  superseed,
  swellchain,
  unichain,
} from "sugar-sdk";
import { type Chain } from "viem";

function getRpcUrl(chain: Chain) {
  const rpc = import.meta.env[`VITE_RPC_URI_${chain.id}`];

  if (!rpc) {
    throw new Error(
      `Missing RPC URL. Please pass ${`VITE_RPC_URI_${chain.id}`} as an environment variable.`
    );
  }

  return rpc;
}

export const config: SugarWagmiConfig = getDefaultConfig({
  chains: [
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
  ].map((chain) => ({
    chain,
    rpcUrl: getRpcUrl(chain),
  })),
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
