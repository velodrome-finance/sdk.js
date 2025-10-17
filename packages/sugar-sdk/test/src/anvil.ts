import { base } from "@wagmi/core/chains";
import { createServer } from "prool";
import { anvil, type AnvilParameters } from "prool/instances";
import {
  type Account,
  type Address,
  type Chain,
  type Client,
  type ClientConfig,
  createClient,
  type ExactPartial,
  http,
  type ParseAccount,
  type Transport,
} from "viem";

import { account, poolId } from "./constants.js";

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, fallback: string): string {
  if (typeof process.env[key] === "string") return process.env[key] as string;
  console.warn(
    `\`process.env.${key}\` not found. Falling back to \`${fallback}\`.`
  );
  return fallback;
}

type DefineAnvilParameters<chain extends Chain> = Omit<
  AnvilParameters,
  "forkBlockNumber" | "forkUrl"
> & {
  chain: chain;
  forkBlockNumber: bigint;
  forkUrl: string;
  port: number;
};

type DefineAnvilReturnType<chain extends Chain> = {
  chain: chain;
  clientConfig: ClientConfig<Transport, chain, undefined>;
  forkBlockNumber: bigint;
  forkUrl: string;
  getClient<
    config extends ExactPartial<
      Omit<ClientConfig, "account" | "chain"> & {
        account?: true | Address | Account | undefined;
        chain?: false | undefined;
      }
    >,
  >(
    config?: config | undefined
  ): Client<
    config["transport"] extends Transport ? config["transport"] : Transport,
    config["chain"] extends false ? undefined : chain,
    config["account"] extends Address
      ? ParseAccount<config["account"]>
      : config["account"] extends Account
        ? config["account"]
        : config["account"] extends true
          ? ParseAccount<(typeof account)["address"]>
          : undefined,
    undefined,
    { mode: "anvil" }
  >;
  port: number;
  rpcUrl: {
    http: string;
    ws: string;
  };
  restart(): Promise<void>;
  start(): Promise<() => Promise<void>>;
};

function defineAnvil<const chain extends Chain>(
  parameters: DefineAnvilParameters<chain>
): DefineAnvilReturnType<chain> {
  const {
    chain: chain_,
    forkUrl,
    forkBlockNumber,
    port,
    ...options
  } = parameters;

  const rpcUrl = {
    http: `http://127.0.0.1:${port}/${poolId}`,
    ws: `ws://127.0.0.1:${port}/${poolId}`,
  } as const;

  const chain = {
    ...chain_,
    name: `${chain_.name} (Local)`,
    rpcUrls: {
      default: {
        http: [rpcUrl.http],
        webSocket: [rpcUrl.ws],
      },
    },
  } as const satisfies Chain;

  const clientConfig = {
    chain,
    pollingInterval: 100,
    transport: http(rpcUrl.http),
  } as const satisfies ClientConfig;

  return {
    chain,
    clientConfig,
    forkBlockNumber,
    forkUrl,
    getClient(config) {
      return (
        createClient({
          ...clientConfig,
          ...config,
          account: config?.account === true ? account.address : config?.account,
          chain: config?.chain === false ? undefined : chain,
          transport: http(rpcUrl.http),
        }) as any
      ).extend(() => ({ mode: "anvil" })) as never;
    },
    rpcUrl,
    port,
    async restart() {
      await fetch(`${rpcUrl.http}/restart`);
    },
    async start() {
      return await createServer({
        instance: anvil({
          chainId: chain.id,
          forkUrl,
          forkBlockNumber,
          hardfork: "Prague",
          ...options,
        }),
        port,
      }).start();
    },
  } as const;
}

/**
 * Anvil instance for Base chain forked from latest block.
 * Configure via VITE_ANVIL_FORK_URL_BASE env var or defaults to Base mainnet RPC.
 *
 * Note: Not specifying forkBlockNumber will fork from the latest block,
 * ensuring all contracts are deployed but tests may be less deterministic.
 */
export const anvilBase = defineAnvil({
  chain: base,
  forkUrl: getEnv("VITE_ANVIL_FORK_URL_BASE", "https://mainnet.base.org"),
  // Fork from latest block to ensure all Aerodrome contracts are deployed
  // For more deterministic tests, specify a recent block number via env var
  forkBlockNumber: process.env.VITE_ANVIL_FORK_BLOCK_BASE
    ? BigInt(process.env.VITE_ANVIL_FORK_BLOCK_BASE)
    : (undefined as any), // Anvil will use latest block
  noMining: true,
  port: 8453, // Using Base chain ID as port for easy identification
});
