import { getAccount, getClient, switchChain, writeContract } from "@wagmi/core";
import { splitEvery } from "ramda";
import { Abi, createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { SugarWagmiConfig } from "./config.js";

/**
 * Base parameters required for most SDK functions.
 * Contains the minimal configuration needed to interact with the SDK.
 */
export interface BaseParams {
  /** The combined Wagmi and Sugar SDK configuration */
  config: SugarWagmiConfig;
}

/**
 * Extended parameters that include chain-specific information.
 * Used for operations that target a specific blockchain network.
 */
export interface ChainParams extends BaseParams {
  /** The chain ID to operate on */
  chainId: number;
}

/**
 * Ensures the wallet is connected to the specified chain.
 *
 * Checks if the current connected chain matches the target chain ID.
 * If they don't match, automatically switches the wallet to the correct chain.
 *
 * @param params - Chain parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.chainId - The chain ID to ensure connection to
 * @returns Promise that resolves when the chain switch is complete (or immediately if already on correct chain)
 *
 * @example
 * ```typescript
 * await ensureConnectedChain({ config, chainId: 10 }); // Switch to Optimism if needed
 * ```
 */
export async function ensureConnectedChain(params: ChainParams): Promise<void> {
  const { config, chainId } = params;
  if (chainId !== getAccount(config).chainId) {
    await switchChain(config, { chainId });
  }
}

/**
 * Processes items in batches with controlled concurrency.
 *
 * Splits a large array into smaller batches and processes them with a limit on
 * concurrent operations. This prevents overwhelming RPCs or hitting rate limits
 * while maximizing throughput.
 *
 * @template T The type of items being processed
 * @template R The type of results returned by processing
 *
 * @param params - Batch processing parameters
 * @param params.items - Array of items to process
 * @param params.batchSize - Number of items per batch
 * @param params.concurrentLimit - Maximum number of concurrent batch operations
 * @param params.processBatch - Async function that processes a batch of items
 * @returns Promise that resolves to a flattened array of type R[] containing all results from all batches
 *
 * @example
 * ```typescript
 * const results = await processBatchesConcurrently({
 *   items: tokenAddresses,
 *   batchSize: 50,
 *   concurrentLimit: 10,
 *   processBatch: async (batch) => fetchPrices(batch),
 * });
 * // results: PriceResult[] (flattened from all batches)
 * ```
 */
export async function processBatchesConcurrently<T, R>({
  items,
  batchSize,
  concurrentLimit,
  processBatch,
}: {
  items: T[];
  batchSize: number;
  concurrentLimit: number;
  processBatch: (batch: T[]) => Promise<R[]>;
}): Promise<R[]> {
  const batches = splitEvery(batchSize, items);
  const batchPromises: Promise<R[]>[] = [];
  const executing: Promise<R[]>[] = [];

  for (const batch of batches) {
    const promise = processBatch(batch).then((result) => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });

    batchPromises.push(promise);
    executing.push(promise);

    if (executing.length >= concurrentLimit) {
      await Promise.race(executing);
    }
  }

  const results = await Promise.all(batchPromises);
  return results.flat();
}

/**
 * Parameters for writing to a contract.
 */
export interface WriteContractParams {
  /** Contract address */
  address: string;
  /** Contract ABI */
  abi: Abi;
  /** Function name to call */
  functionName: string;
  /** Function arguments */
  args?: readonly unknown[];
  /** Value to send with the transaction */
  value?: bigint;
}

/**
 * Writes to a contract with automatic routing based on configuration.
 *
 * This helper function automatically chooses the correct method for writing to contracts:
 * - If a private key is configured in `config.sugarConfig.privateKey`, it uses viem's wallet client for direct signing
 * - Otherwise, it uses wagmi's writeContract with the connected wallet, ensuring the chain is switched if needed
 *
 * This eliminates the need for duplicate code in functions that support both private key and wallet-based transactions.
 *
 * @param params - Write contract parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.chainId - The chain ID where the contract is deployed
 * @param params.contractParams - The contract write parameters (address, abi, functionName, args, value)
 * @returns Promise that resolves to the transaction hash
 * @throws Error if no client is found for the specified chain when using private key mode
 *
 * @example
 * ```typescript
 * const hash = await writeContractWithConfig({
 *   config,
 *   chainId: 10,
 *   contractParams: {
 *     address: "0x...",
 *     abi: erc20Abi,
 *     functionName: "approve",
 *     args: ["0x...", 1000000n],
 *   }
 * });
 * ```
 */
export async function writeContractWithConfig({
  config,
  chainId,
  contractParams,
}: ChainParams & {
  contractParams: WriteContractParams;
}): Promise<Hex> {
  const { privateKey } = config.sugarConfig;

  if (privateKey) {
    // Use viem's wallet client for private key transactions
    const account = privateKeyToAccount(privateKey);

    // Get the viem client from wagmi for the specific chain
    const viemClient = getClient(config, { chainId });

    if (!viemClient) {
      throw new Error(`No client found for chain ${chainId}`);
    }

    // Get the RPC URL from the chain configuration and create a new transport
    const rpcUrl = viemClient.chain.rpcUrls.default.http[0];
    const transport = http(rpcUrl, { batch: true });

    // Create wallet client reusing the chain config and RPC transport
    const walletClient = createWalletClient({
      account,
      chain: viemClient.chain,
      transport,
    });

    return await walletClient.writeContract({
      address: contractParams.address as Hex,
      abi: contractParams.abi,
      functionName: contractParams.functionName,
      args: contractParams.args,
      value: contractParams.value,
    });
  } else {
    // Use wagmi's writeContract for injected wallet transactions
    await ensureConnectedChain({ config, chainId });
    return await writeContract(config, {
      chainId,
      address: contractParams.address as Hex,
      abi: contractParams.abi,
      functionName: contractParams.functionName,
      args: contractParams.args,
      value: contractParams.value,
    });
  }
}
