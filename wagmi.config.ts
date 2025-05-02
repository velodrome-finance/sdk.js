import { ContractConfig, defineConfig } from "@wagmi/cli";
import { etherscan } from "@wagmi/cli/plugins";
import { optimism } from "viem/chains";
import { velodromeConfig } from "./src/velodrome-config";

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
  const cfg = velodromeConfig;

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
            address: cfg[`LP_SUGAR_ADDRESS_${chainId}`],
          },
          {
            name: "rewardsSugar",
            address: cfg[`REWARDS_SUGAR_ADDRESS_${chainId}`],
          },
          {
            name: "relaySugar",
            address: cfg[`RELAY_SUGAR_ADDRESS_${chainId}`],
          },
          {
            name: "router",
            address: cfg[`ROUTER_ADDRESS_${chainId}`],
          },
          {
            name: "universalRouter",
            address: cfg[`UNIVERSAL_ROUTER_ADDRESS_${chainId}`],
          },
          {
            name: "veSugar",
            address: cfg[`VE_SUGAR_ADDRESS_${chainId}`],
          },
          {
            name: "prices",
            address: cfg[`PRICES_ADDRESS_${chainId}`],
          },
          {
            name: "routeQuoter",
            address: cfg[`QUOTER_ADDRESS_${chainId}`],
          },
          {
            name: "slipstreamSugar",
            address: cfg[`SLIPSTREAM_SUGAR_ADDRESS_${chainId}`],
          },
          {
            name: "nfpm",
            address: cfg[`NFPM_ADDRESS_${chainId}`],
          },
          {
            name: "voter",
            address: cfg[`VOTER_ADDRESS_${chainId}`],
          },
          {
            name: "tokenBridge",
            address: cfg.TOKEN_BRIDGE,
          },
        ],
      }),
    ],
  };
});
