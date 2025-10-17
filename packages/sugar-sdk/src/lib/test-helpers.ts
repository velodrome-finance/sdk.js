import { connect } from "@wagmi/core";
import type { Chain } from "@wagmi/core/chains";
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  pad,
  parseUnits,
  toHex,
} from "viem";
import { mine, setBalance, setStorageAt } from "viem/actions";

import {
  _getTestConfig,
  base,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  swellchain,
  unichain,
} from "../config.js";

export const TEST_ACCOUNT_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/**
 * Configuration options for initializing test config
 */
export interface InitOptions {
  /**
   * Use legacy honey/supersim ports (4444-4453)
   * @deprecated Use chainUrls instead for more flexibility
   */
  testMode?: boolean;
  /**
   * Map of chain IDs to RPC URLs
   * Example: { 8453: 'http://127.0.0.1:8453/9451' }
   */
  chainUrls?: Record<number, string>;
  /**
   * Whether to connect the test account (for supersim/honey)
   */
  connectTestAccount?: boolean;
}

/**
 * Initialize test configuration with flexible URL mapping.
 * Supports both legacy honey/supersim setup and new Anvil-based testing.
 *
 * @param options - Configuration options
 * @returns Configured test instance
 *
 * @example
 * // Use with Anvil
 * const config = await init({
 *   chainUrls: {
 *     8453: anvilBase.rpcUrl.http,
 *   }
 * });
 *
 * @example
 * // Legacy honey/supersim mode
 * const config = await init({ testMode: true, connectTestAccount: true });
 *
 * @example
 * // Use environment variables (default)
 * const config = await init();
 */
export const init = async (options?: InitOptions | boolean) => {
  // Handle legacy boolean parameter for backwards compatibility
  const opts: InitOptions =
    typeof options === "boolean"
      ? { testMode: options, connectTestAccount: options }
      : options || {};

  const { testMode = false, chainUrls = {}, connectTestAccount = false } = opts;

  // Determine if chainUrls was explicitly provided (not empty)
  const hasChainUrls = Object.keys(chainUrls).length > 0;

  // All supported chains with their legacy honey ports
  const allChains = [
    { chain: optimism, port: 4444 },
    { chain: unichain, port: 4445 },
    { chain: lisk, port: 4446 },
    { chain: metalL2, port: 4447 },
    { chain: soneium, port: 4448 },
    { chain: swellchain, port: 4449 },
    { chain: superseed, port: 4450 },
    { chain: base, port: 4451 },
    { chain: mode, port: 4452 },
    { chain: ink, port: 4453 },
  ];

  const chainsWithUrls = allChains
    .map(({ chain, port }) => {
      // If chainUrls is provided, ONLY use those chains
      if (hasChainUrls) {
        const rpcUrl = chainUrls[chain.id];
        return rpcUrl ? { chain, rpcUrl } : null;
      }

      // Otherwise, use testMode ports or env vars
      const rpcUrl = testMode
        ? `http://localhost:${port}`
        : import.meta.env[`VITE_RPC_URL_${chain.id}`];

      if (!rpcUrl) {
        return null; // Skip chains without URLs
      }

      return {
        chain,
        rpcUrl,
      };
    })
    .filter((c) => c !== null) as { chain: Chain; rpcUrl: string }[];

  const config = _getTestConfig({
    chains: chainsWithUrls,
  });

  if (connectTestAccount) {
    // when using supersim via honey, we need to connect test account
    await connect(config, { connector: config.connectors[1] });
  }

  return config;
};

/**
 * Get the sugar config portion of the test configuration.
 * Convenience wrapper around init() that returns only sugarConfig.
 *
 * @param options - Configuration options (same as init)
 * @returns Sugar configuration object
 */
export const getConfig = async (options?: InitOptions | boolean) => {
  const d = await init(options);
  return d.sugarConfig;
};

/**
 * Token funding configuration for Anvil testing
 */
export interface TokenFundingConfig {
  /**
   * The ERC20 token contract address to fund
   */
  address: Address;
  /**
   * The amount to fund (as a bigint in the token's smallest unit)
   * Or a string amount with decimals (e.g., "1000")
   */
  amount: bigint | string;
  /**
   * The number of decimals for the token (required if amount is a string)
   */
  decimals?: number;
  /**
   * The storage slot where the balances mapping is stored (default: 0)
   * Most ERC20 tokens use slot 0, but some may differ
   */
  storageSlot?: number;
}

/**
 * Options for initializing Anvil-based testing
 */
export interface InitWithAnvilOptions {
  /**
   * Tokens to automatically fund the test account with
   */
  fundTokens?: TokenFundingConfig[];
  /**
   * ETH amount to fund the test account with (in ETH, e.g., "10000")
   * Default: "10000" ETH
   */
  fundEth?: string;
  /**
   * The account address to fund (defaults to TEST_ACCOUNT_ADDRESS)
   */
  accountAddress?: Address;
}

/**
 * Initialize config for Anvil-based testing.
 * Helper to create config pointing to specific Anvil instance(s).
 * Automatically funds the test account with ETH and optionally with ERC20 tokens.
 *
 * @param anvilInstances - Anvil instance(s) to use for testing
 * @param options - Funding and configuration options
 * @returns Configured test instance
 *
 * @example
 * import { anvilBase } from '~test/src/anvil.js';
 *
 * const config = await initWithAnvil(anvilBase, {
 *   fundTokens: [
 *     {
 *       address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', // AERO
 *       amount: '1000',
 *       decimals: 18
 *     }
 *   ]
 * });
 *
 * @example
 * // Multiple anvil instances with token funding
 * const config = await initWithAnvil(
 *   { 8453: anvilBase, 10: anvilOptimism },
 *   { fundTokens: [{ address: '0x...', amount: 1000n }] }
 * );
 */
export const initWithAnvil = async (
  anvilInstances:
    | { rpcUrl: { http: string }; chain: Chain; getClient: any }
    | Record<
        number,
        { rpcUrl: { http: string }; chain: Chain; getClient: any }
      >,
  options?: InitWithAnvilOptions
) => {
  const {
    fundTokens = [],
    fundEth = "10000",
    accountAddress = TEST_ACCOUNT_ADDRESS,
  } = options || {};

  // Handle single instance or multiple instances
  const instancesArray =
    "rpcUrl" in anvilInstances
      ? [anvilInstances]
      : Object.values(anvilInstances);

  const chainUrls =
    "rpcUrl" in anvilInstances
      ? { [anvilInstances.chain.id]: anvilInstances.rpcUrl.http }
      : Object.fromEntries(
          Object.entries(anvilInstances).map(([chainId, instance]) => [
            Number(chainId),
            instance.rpcUrl.http,
          ])
        );

  // Fund the account with ETH and tokens on each anvil instance
  for (const instance of instancesArray) {
    const client = instance.getClient();

    // Fund with ETH
    await setBalance(client, {
      address: accountAddress as Address,
      value: parseUnits(fundEth, 18),
    });

    // Fund with ERC20 tokens
    for (const token of fundTokens) {
      const amount =
        typeof token.amount === "string"
          ? parseUnits(token.amount, token.decimals || 18)
          : token.amount;

      await setERC20Balance(
        client,
        token.address,
        accountAddress as Address,
        amount,
        token.storageSlot
      );
    }

    // Mine a block to apply the changes
    await mine(client, { blocks: 1 });
  }

  return init({ chainUrls });
};

// Honey health check function
export async function checkHoneyStatus(): Promise<boolean> {
  try {
    // Check if honey is running by testing connectivity to the expected ports
    /*
      optimism,  // 4444
      unichain,  // 4445
      [MISSING] fraxtal,
      lisk,      // 4446
      metalL2,   // 4447
      soneium,   // 4448
      swellchain,// 4449
      superseed, // 4450
      base,      // 44451
      mode,      // 44452
      [MISSING] celo,
      ink,       // 44453
    */
    const expectedPorts = [
      4444, 4445, 4446, 4447, 4448, 4449, 4450, 4451, 4452, 4453,
    ];

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

/**
 * Sets the ERC20 token balance for a given account using Anvil's setStorageAt.
 * This manipulates the storage slot where the balance is stored.
 *
 * @param client - The Anvil test client
 * @param tokenAddress - The ERC20 token contract address
 * @param accountAddress - The account to set the balance for
 * @param balance - The balance amount (in wei/smallest unit)
 * @param storageSlot - The storage slot where balances mapping is stored (default: 0)
 */
export async function setERC20Balance(
  client: any,
  tokenAddress: Address,
  accountAddress: Address,
  balance: bigint,
  storageSlot: number = 0
) {
  // Calculate the storage slot for this account's balance in the mapping
  // Storage slot = keccak256(abi.encode(accountAddress, mappingSlot))
  const slotData = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [accountAddress, BigInt(storageSlot)]
  );
  const slot = keccak256(slotData);

  // Set the balance at the calculated storage slot
  await setStorageAt(client, {
    address: tokenAddress,
    index: slot,
    value: pad(toHex(balance), { size: 32 }),
  });
}
