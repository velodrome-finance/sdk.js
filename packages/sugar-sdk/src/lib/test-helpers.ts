import { createConfig, http, injected } from "wagmi";
import {
  celo,
  type Chain,
  fraxtal,
  ink,
  lisk,
  mainnet,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  swellchain,
  unichain,
} from "wagmi/chains";

import { initDrome as baseInitDrome, velodromeConfig } from "../index.js";

function getTransports(chains: Chain[]) {
  return Object.fromEntries(
    chains.map((chain) => {
      const rpc = process.env["VITE_RPC_" + chain.id];

      if (!rpc) {
        throw new Error(
          `Missing RPC URL. Please pass VITE_RPC_${chain.id} as an environment variable.`
        );
      }

      return [chain.id, http(rpc, { batch: true })];
    })
  );
}

export const initDrome = () => {
  const velodromChains = [
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
    mainnet,
  ] as [Chain, ...Chain[]];

  return baseInitDrome(
    createConfig({
      chains: velodromChains,
      connectors: [injected()],
      transports: getTransports(velodromChains),
    }),
    {
      ...velodromeConfig,
      onError(error) {
        throw error;
      },
    }
  );
};
