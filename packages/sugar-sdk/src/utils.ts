import {
  Config,
  createConfig,
  getAccount,
  http,
  injected,
  mock,
  switchChain,
} from "@wagmi/core";
import { type Chain } from "@wagmi/core/chains";
import { Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createNonceManager, jsonRpc } from "viem/nonce";

import { chains } from "./chains.js";
import { DromeConfig } from "./config.js";
import { velodromeConfig } from "./config.js";

// OMG, there are private keys in this file. What is this amateur hour?
// Calm down, these are presets from Anvil. No need to panic.
// see https://getfoundry.sh/anvil/overview#getting-started
const TEST_ACCOUNT_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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

export function getTransportURL(
  chainId: number,
  i: number,
  testMode: boolean = false
): string {
  if (testMode) {
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

function getTransports(chains: Chain[], testMode: boolean = false) {
  return Object.fromEntries(
    chains.map((chain, i) => {
      return [
        chain.id,
        http(getTransportURL(chain.id, i, testMode), { batch: true }),
      ];
    })
  );
}

export function getDefaultDrome(testMode: boolean = false) {
  const chainsToUse = chains.map((chain, i) => ({
    ...chain,
    rpcUrls: {
      ...chain.rpcUrls,
      default: {
        ...chain.rpcUrls.default,
        http: [getTransportURL(chain.id, i, testMode)],
      },
    },
  }));
  return initDrome(
    createConfig({
      chains: chainsToUse as unknown as [Chain, ...Chain[]],
      connectors: [
        injected(),
        ...(testMode
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
      transports: getTransports(chainsToUse, testMode),
    }),
    {
      ...velodromeConfig,
      CHAIN_IDS: chains.map((c) => c.id),
      chains: Object.assign(
        {
          "8453": {
            // <- Base in the house
            LP_SUGAR_ADDRESS:
              "0x27fc745390d1f4BaF8D184FBd97748340f786634" as Address,
            REWARDS_SUGAR_ADDRESS:
              "0xD4aD2EeeB3314d54212A92f4cBBE684195dEfe3E" as Address,
            VE_SUGAR_ADDRESS:
              "0x4c5d3925fe65DFeB5A079485136e4De09cb664A5" as Address,
            RELAY_SUGAR_ADDRESS:
              "0xE1328FFaDa4f9CC2b6EFE4aD4db63C5ABAC9bab1" as Address,
            ROUTER_ADDRESS:
              "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43" as Address,
            PRICES_ADDRESS:
              "0x288a124CB87D7c95656Ad7512B7Da733Bb60A432" as Address,
            VOTER_ADDRESS:
              "0x16613524e02ad97eDfeF371bC883F2F5d6C480A5" as Address,
            DEFAULT_TOKENS: [
              "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
              "eth",
            ] as Address[],
            QUOTER_ADDRESS:
              "0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6" as Address,
            UNIVERSAL_ROUTER_ADDRESS:
              "0x01D40099fCD87C018969B0e8D4aB1633Fb34763C" as Address,
            WRAPPED_NATIVE_TOKEN:
              "0x4200000000000000000000000000000000000006" as Address,
            UNSAFE_TOKENS: [
              "0x74ccbe53f77b08632ce0cb91d3a545bf6b8e0979",
              "0x8901cb2e82cc95c01e42206f8d1f417fe53e7af0",
              "0x9cbd543f1b1166b2df36b68eb6bb1dce24e6abdf",
              "0x025f99977db78317a4eba606998258b502bb256f",
              "0xd260115030b9fb6849da169a01ed80b6496d1e99",
              "0x608d5401d377228e465ba6113517dcf9bd1f95ca",
              "0x728cda34d732a87fd6429129e23d4742d9ff0064",
              "0x728cda34d732a87fd6429129e23d4742d9ff0064",
              "0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4",
              "0x0f929c29dce303f96b1d4104505f2e60ee795cac",
              "0x47e78d664e6c339693e8638b7a7d9543abcc99d4",
              "0xff0c532fdb8cd566ae169c1cb157ff2bdc83e105",
              "0x373504da48418c67e6fcd071f33cb0b3b47613c7",
              "0x628c5ba9b775dacecd14e237130c537f497d1cc7",
            ] as Address[],
            CONNECTOR_TOKENS: [
              "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
              "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
              "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
              "0x4621b7a9c75199271f773ebd9a499dbd165c3191",
              "0x4200000000000000000000000000000000000006",
              "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
              "0xf7a0dd3317535ec4f4d29adf9d620b3d8d5d5069",
              "0xcfa3ef56d303ae4faaba0592388f19d7c3399fb4",
              "0xcb327b99ff831bf8223cced12b1338ff3aa322ff",
              "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22",
              "0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452",
              "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42",
              "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
              "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
            ] as Address[],
            STABLE_TOKEN:
              "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca" as Address,
            SLIPSTREAM_SUGAR_ADDRESS:
              "0x9c62ab10577fB3C20A22E231b7703Ed6D456CC7a" as Address,
            NFPM_ADDRESS:
              "0x827922686190790b37229fd06084350E74485b72" as Address,
          },
        },
        Object.entries(velodromeConfig.chains)
          .filter(([k]) => k === "10")
          .reduce(
            (acc, [key, value]) => {
              acc[key] = value;
              return acc;
            },
            {} as Record<string, any>
          )
      ),
      onError(error: any) {
        throw error;
      },
    }
  );
}
