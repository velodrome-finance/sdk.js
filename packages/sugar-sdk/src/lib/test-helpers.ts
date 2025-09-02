import { connect, createConfig, http, injected, mock } from "@wagmi/core";
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
} from "@wagmi/core/chains";
import { createTestClient, publicActions, testActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createNonceManager, jsonRpc } from "viem/nonce";

import { initDrome as baseInitDrome, velodromeConfig } from "../index.js";

export const TEST_ACCOUNT_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// OMG, there are private keys in this file. What is this amateur hour?
// Calm down, these are presets from Anvil. No need to panic.
// see https://getfoundry.sh/anvil/overview#getting-started
const TEST_ACCOUNT_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export function getTransportURL(
  chainId: number,
  i: number,
  withHoney: boolean = false
): string {
  if (withHoney) {
    // Eth mainnet is the first chain in the list of chains
    // since we currently do not use supersim for it, we skip it
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

// Store test clients for access
const testClients: Map<number, ReturnType<typeof createTestClient>> = new Map();

function getTransports(chains: Chain[], withHoney: boolean = false) {
  return Object.fromEntries(
    chains.map((chain, i) => {
      if (withHoney) {
        // Create the test client and store it
        const testClient = createTestClient({
          mode: "anvil",
          cacheTime: 0,
          chain,
          transport: http(getTransportURL(chain.id, i, withHoney)),
        })
          .extend(publicActions)
          .extend(testActions({ mode: "anvil" }));

        // testClient.setAutomine(false);
        testClients.set(chain.id, testClient);

        // Return regular http transport for wagmi compatibility
        return [
          chain.id,
          http(getTransportURL(chain.id, i, withHoney), { batch: true }),
        ];
      }

      return [
        chain.id,
        http(getTransportURL(chain.id, i, withHoney), { batch: true }),
      ];
    })
  );
}

export const initDrome = async (withHoney: boolean = false) => {
  // Clear any existing test clients
  if (!withHoney) {
    testClients.clear();
  }

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
  const chainsToUse = velodromeChains.map((chain, i) => ({
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: {
        ...chain.rpcUrls.default,
        http: [getTransportURL(chain.id, i, withHoney)],
      },
    },
  }));

  const config = baseInitDrome(
    createConfig({
      chains: chainsToUse as unknown as [Chain, ...Chain[]],
      connectors: [
        injected(),
        ...(withHoney
          ? [
              mock({
                accounts: [
                  privateKeyToAccount(TEST_ACCOUNT_PK, {
                    nonceManager: createNonceManager({
                      source: jsonRpc(),
                    }),
                  }).address,
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

  if (!withHoney) {
    return config;
  }

  // when using supersim via honey, we need to connect test account
  await connect(config, { connector: config.connectors[1] });
  return config;
};

export const getDromeConfig = async (withHoney: boolean = false) => {
  const d = await initDrome(withHoney);
  return d.dromeConfig;
};

export function getTestClientForChain(chainId: number) {
  const testClient = testClients.get(chainId);
  if (!testClient) {
    throw new Error(
      `Test client for chain ${chainId} not found. Make sure initDrome was called with withHoney=true`
    );
  }
  return testClient;
}

// Honey health check function
export async function checkHoneyStatus(): Promise<boolean> {
  try {
    // Check if honey is running by testing connectivity to the expected ports
    const expectedPorts = [4444, 4445, 4446]; // OP, Lisk, Base based on honey.yaml

    for (const port of expectedPorts) {
      const response = await fetch(`http://localhost:${port}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        console.warn(`Honey port ${port} not responding`);
        return false;
      }
    }

    console.log("✅ Honey is running correctly on all expected ports");
    return true;
  } catch (error) {
    console.warn("⚠️ Honey connectivity check failed:", error);
    return false;
  }
}
