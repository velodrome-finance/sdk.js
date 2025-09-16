import {
  aerodromeConfig,
  init,
  type SugarWagmiConfig,
  velodromeConfig,
} from "sugar-sdk";
import { createConfig, http, injected } from "wagmi";
import {
  base,
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

function getTransports(chains: Chain[]) {
  return Object.fromEntries(
    chains.map((chain) => {
      const rpc = import.meta.env["VITE_RPC_" + chain.id];

      if (!rpc) {
        throw new Error(
          `Missing RPC URL. Please pass VITE_RPC_${chain.id} as an environment variable.`
        );
      }

      return [chain.id, http(rpc, { batch: true })];
    })
  );
}

export let config: SugarWagmiConfig;

if (import.meta.env.MODE === "aero") {
  const aerodromChains = [base, optimism] as [Chain, ...Chain[]];

  config = init(
    createConfig({
      chains: aerodromChains,
      connectors: [injected()],
      transports: getTransports(aerodromChains),
    }),
    {
      ...aerodromeConfig,
      onError(error) {
        console.log(error);
      },
    }
  );
} else if (import.meta.env.MODE === "velo") {
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

  config = init(
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
} else {
  throw new Error("Vite mode must be set to aero or velo.");
}

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
