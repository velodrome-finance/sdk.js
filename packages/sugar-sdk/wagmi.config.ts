import { ContractConfig, defineConfig } from "@wagmi/cli";
import { etherscan } from "@wagmi/cli/plugins";
import { optimism } from "viem/chains";

import { baseConfig } from "./src/config.js";

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
  const config = baseConfig.chains.find((c) => c.CHAIN.id === chainId);

  if (!config) {
    throw new Error("Optimism config is required for abi generation");
  }

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
            address: config.LP_SUGAR_ADDRESS,
          },
          {
            name: "rewardsSugar",
            address: config.REWARDS_SUGAR_ADDRESS,
          },
          {
            name: "relaySugar",
            address: config.RELAY_SUGAR_ADDRESS,
          },
          {
            name: "router",
            address: config.ROUTER_ADDRESS,
          },
          {
            name: "universalRouter",
            address: config.UNIVERSAL_ROUTER_ADDRESS,
          },
          {
            name: "veSugar",
            address: config.VE_SUGAR_ADDRESS,
          },
          {
            name: "prices",
            address: config.PRICES_ADDRESS,
          },
          {
            name: "routeQuoter",
            address: config.QUOTER_ADDRESS,
          },
          {
            name: "slipstreamSugar",
            address: config.SLIPSTREAM_SUGAR_ADDRESS,
          },
          {
            name: "nfpm",
            address: config.NFPM_ADDRESS,
          },
          {
            name: "voter",
            address: config.VOTER_ADDRESS,
          },
          {
            name: "tokenBridge",
            address: baseConfig.TOKEN_BRIDGE,
          },
        ] as ContractConfig<number, 10>[],
      }),
    ],
  };
});
