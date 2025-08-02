import { privateKeyToAccount } from "viem/accounts";
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

export function getTransportURL(
  chainId: number,
  i: number,
  withHoney: boolean = false
): string {
  if (withHoney) {
    return `http://localhost:${4444 + i}`;
  }
  const rpc = process.env[`VITE_RPC_${chainId}`];
  if (!rpc) {
    throw new Error(
      `Missing RPC URL. Please pass VITE_RPC_${chainId} as an environment variable.`
    );
  }
  return rpc;
}

function getTransports(chains: Chain[], withHoney: boolean = false) {
  // sort chains by chain ID to ensure consistent port assignment for honey
  chains.sort((a, b) => a.id - b.id);
  return Object.fromEntries(
    chains.map((chain, i) => {
      return [
        chain.id,
        http(getTransportURL(chain.id, i, withHoney), { batch: true }),
      ];
    })
  );
}

export const initDrome = (withHoney: boolean = false) => {
  const velodromeChains = [
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
      chains: velodromeChains,
      connectors: [
        injected(),
        ...(withHoney && process.env.PRIVATE_KEY
          ? [
              // OMG, there are private keys in this file. What is this amateur hour?
              // Calm down, these are presets from Anvil. No need to panic.
              // see https://getfoundry.sh/anvil/overview#getting-started
              privateKeyToAccount(
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
              ),
            ]
          : []),
      ],
      transports: getTransports(velodromeChains, withHoney),
    }),
    {
      ...velodromeConfig,
      onError(error) {
        throw error;
      },
    }
  );
};

export const getDromeConfig = () => {
  return initDrome().dromeConfig;
};
