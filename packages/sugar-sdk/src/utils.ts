import { getAccount, switchChain } from "@wagmi/core";
import { splitEvery } from "ramda";

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
