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
import { mock } from "wagmi/connectors";

import { initDrome as baseInitDrome, velodromeConfig } from "../index.js";

export function getTransportURL(
  chainId: number,
  i: number,
  withHoney: boolean = false
): string {
  if (withHoney) {
    // Eth mainnet is the first chain in the list of chains
    // since we currently do not use simnet for it, we skip it
    return `http://localhost:${4444 + i - 1}`;
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

  // sort chains by chain ID to ensure consistent port assignment for honey
  velodromeChains.sort((a, b) => a.id - b.id);

  // When honey is enabled, modify chain RPC URLs to use localhost
  const chainsToUse = withHoney
    ? velodromeChains.map((chain, i) => ({
        ...chain,
        rpcUrls: {
          ...chain.rpcUrls,
          default: {
            ...chain.rpcUrls.default,
            http: [getTransportURL(chain.id, i, true)],
          },
        },
      }))
    : velodromeChains;

  return baseInitDrome(
    createConfig({
      chains: chainsToUse as [Chain, ...Chain[]],
      connectors: [
        injected(),
        ...(withHoney
          ? [
              // OMG, there are private keys in this file. What is this amateur hour?
              // Calm down, these are presets from Anvil. No need to panic.
              // see https://getfoundry.sh/anvil/overview#getting-started
              mock({
                accounts: [
                  privateKeyToAccount(
                    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
                  ).address,
                ],
              }),
            ]
          : []),
      ],
      transports: getTransports(chainsToUse, withHoney),
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
