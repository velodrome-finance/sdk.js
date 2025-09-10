import { ContractConfig, defineConfig } from "@wagmi/cli";
import { etherscan } from "@wagmi/cli/plugins";
import type { Address } from "viem";
import { optimism } from "viem/chains";

import {
  aerodromeConfig,
  DromeChainConfig,
  DromeConfig,
  velodromeConfig,
} from "./src";

function etherscanWithRetries({
  maxAttempts,
  baseDelayMs,
  ...args
}: {
  maxAttempts: number;
  baseDelayMs: number;
} & Parameters<typeof etherscan>[0]) {
  const CPS = 2;
  const CPS_DELAY = 1_000;

  let attempt = 1;

  const contracts: ContractConfig[] = [];

  async function run() {
    try {
      for (let i = contracts.length; i < args.contracts.length; i += CPS) {
        contracts.push(
          ...(await etherscan({
            ...args,
            contracts: args.contracts.slice(i, i + CPS),
          }).contracts())
        );
        await new Promise((r) => setTimeout(r, CPS_DELAY));
      }
      return contracts;
    } catch (error) {
      console.log(error);
      if (attempt >= maxAttempts) {
        throw error;
      }

      const delayMs = baseDelayMs * 2 ** attempt;
      console.log(`, failed... Retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      attempt++;
      return run();
    }
  }

  return {
    name: "etherscanWithRetries",
    contracts: run,
  };
}

export default defineConfig(() => {
  const chainId = optimism.id;

  const getAddresses = (configKey: string) => {
    const getAddressesFromConfig = (config: DromeConfig) => {
      const addresses = {} as Record<number, Address>;

      // Check if it's a top-level config property (like TOKEN_BRIDGE)
      if (config[configKey]) {
        addresses[chainId] = config[configKey];
      }

      // Look in the chains list for addresses
      if (config.chains) {
        for (const {
          chainId,
          ...chainConfig
        } of config.chains as (DromeChainConfig & { chainId: number })[]) {
          const value = (chainConfig as Record<string, Address | undefined>)[
            configKey
          ];
          if (value) {
            addresses[chainId] = value;
          }
        }
      }

      return addresses;
    };

    return {
      ...getAddressesFromConfig(aerodromeConfig),
      ...getAddressesFromConfig(velodromeConfig),
    };
  };

  return {
    out: "src/primitives/abis.ts",
    contracts: [],
    plugins: [
      etherscanWithRetries({
        maxAttempts: 3,
        baseDelayMs: 2_500,
        apiKey: process.argv[3],
        chainId,
        contracts: [
          {
            name: "lpSugar",
            address: getAddresses("LP_SUGAR_ADDRESS"),
          },
          {
            name: "rewardsSugar",
            address: getAddresses("REWARDS_SUGAR_ADDRESS"),
          },
          {
            name: "relaySugar",
            address: getAddresses("RELAY_SUGAR_ADDRESS"),
          },
          {
            name: "router",
            address: getAddresses("ROUTER_ADDRESS"),
          },
          {
            name: "universalRouter",
            address: getAddresses("UNIVERSAL_ROUTER_ADDRESS"),
          },
          {
            name: "veSugar",
            address: getAddresses("VE_SUGAR_ADDRESS"),
          },
          {
            name: "prices",
            address: getAddresses("PRICES_ADDRESS"),
          },
          {
            name: "routeQuoter",
            address: getAddresses("QUOTER_ADDRESS"),
          },
          {
            name: "slipstreamSugar",
            address: getAddresses("SLIPSTREAM_SUGAR_ADDRESS"),
          },
          {
            name: "nfpm",
            address: getAddresses("NFPM_ADDRESS"),
          },
          {
            name: "voter",
            address: getAddresses("VOTER_ADDRESS"),
          },
          {
            name: "tokenBridge",
            address: getAddresses("TOKEN_BRIDGE"),
          },
        ] as ContractConfig<number, 10>[],
      }),
    ],
  };
});
