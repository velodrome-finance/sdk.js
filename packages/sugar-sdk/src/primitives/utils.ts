import {
  Abi,
  AbiStateMutability,
  ContractFunctionArgs,
  ContractFunctionName,
} from "viem";

import { Config } from "../config.js";

/**
 * Represents a single pagination batch with offset and limit.
 * @internal
 */
interface PaginationBatch {
  /** Number of items to fetch in this batch */
  limit: number;
  /** Starting index for this batch */
  offset: number;
}

/**
 * Calculates pagination batches needed to fetch all items.
 *
 * Divides the total number of items into batches of the specified limit size.
 *
 * @param params - Pagination parameters
 * @param params.limit - Number of items per batch
 * @param params.upperBound - Total number of items to fetch
 * @returns Array of PaginationBatch objects with limit and offset properties
 *
 * @internal
 */
export const setupPaginationBatches = ({
  limit,
  upperBound,
}: {
  limit: number;
  upperBound: number;
}): PaginationBatch[] => {
  const result: PaginationBatch[] = [];

  while (upperBound > 0) {
    const offset = limit * result.length;
    result.push({ limit, offset });
    upperBound -= limit;
  }

  return result;
};

/**
 * Generic pagination helper for fetching large datasets.
 *
 * Automatically handles splitting requests into multiple pages and fetching them
 * in parallel. Can optionally continue fetching beyond the upper bound if more
 * data is available.
 *
 * @template T The type of items being fetched
 *
 * @param params - Pagination parameters
 * @param params.limit - Number of items per page
 * @param params.upperBound - Expected total number of items
 * @param params.fetchData - Async function that fetches a single page
 * @param params.configuration - Optional pre-calculated batch configuration
 * @param params.canLoadMore - If true, continues fetching beyond upperBound when pages are full
 * @returns Promise that resolves to a readonly array of type T[] containing all fetched items from all pages
 *
 * @example
 * ```typescript
 * const pools = await paginate<Pool>({
 *   limit: 100,
 *   upperBound: 1000,
 *   fetchData: async (limit, offset) => {
 *     return readContract(config, {
 *       address: LP_SUGAR_ADDRESS,
 *       abi: LP_SUGAR_ABI,
 *       functionName: "all",
 *       args: [BigInt(limit), BigInt(offset)],
 *     });
 *   }
 * });
 * // pools: readonly Pool[]
 * ```
 */
export async function paginate<T>({
  limit,
  upperBound,
  fetchData,
  configuration,
  canLoadMore,
}: {
  limit: number;
  upperBound: number;
  fetchData: (limit: number, offset: number) => Promise<readonly T[]>;
  configuration?: PaginationBatch[];
  canLoadMore?: boolean;
}): Promise<readonly T[]> {
  const batches = await Promise.all(
    (
      configuration ||
      setupPaginationBatches({
        limit,
        upperBound,
      })
    ).map(({ limit, offset }) => fetchData(limit, offset))
  );

  const loadMore =
    canLoadMore && batches.length && batches.at(-1)!.length !== 0;

  if (batches.length !== 0 && loadMore) {
    while (true) {
      const nextBatch = await fetchData(limit, batches.length * limit);
      if (nextBatch.length < limit) break;
      batches.push(nextBatch);
    }
    console.warn(`${fetchData.name}: passed optimistic pagination bound`);
  }
  return batches.reduce((s, batch) => [...s, ...batch], []);
}

/**
 * Repeatedly calls a paginated function until all records are fetched.
 *
 * Continues fetching pages until either the total length is reached or a page
 * returns fewer items than the page length (indicating the end of data).
 *
 * @template T The type of records being fetched
 *
 * @param callback - Async function that loads a single page of data
 * @param pageLength - Number of records to request per page (default: 300)
 * @param totalLength - Total number of records expected. If omitted, fetches until a partial page is returned
 * @returns Promise that resolves to an array of type T[] containing all fetched records
 *
 * @example
 * ```typescript
 * const allTokens = await depaginate(
 *   async (offset, count) => fetchTokens(offset, count),
 *   300
 * );
 * // allTokens: Token[]
 * ```
 */
export async function depaginate<T>(
  callback: (offset: number, count: number) => Promise<readonly T[] | T[]>,
  pageLength = 300,
  totalLength?: number
): Promise<T[]> {
  const results: T[] = [];

  for (
    let offset = 0;
    totalLength != null ? offset < totalLength : true;
    offset += pageLength
  ) {
    const result = await callback(offset, pageLength);

    results.push(...result);

    if (totalLength == null && result.length < pageLength) {
      return results;
    }

    offset += pageLength;
  }

  return results;
}

/**
 * Type helper for validating contract function calls.
 *
 * Ensures that function names and arguments match the ABI definition for the
 * specified state mutability.
 *
 * @template abi The contract ABI type
 * @template mutability The state mutability (view, pure, nonpayable, payable)
 * @template functionName The specific function name from the ABI
 */
export type ContractFunction<
  abi extends Abi,
  mutability extends AbiStateMutability,
  functionName extends ContractFunctionName<abi, mutability>,
> = {
  abi: abi;
  functionName: functionName;
  args: ContractFunctionArgs<abi, mutability, functionName>;
  [index: string]: unknown;
};

/**
 * Handles errors that occur within the SDK.
 *
 * Calls the configured error handler if one exists, otherwise logs to console.
 * Wraps the original error in a DromeError for consistent error handling.
 *
 * @param config - The SDK configuration
 * @param message - Human-readable error message
 * @param originalError - The original error that occurred
 * @returns void - Calls the configured error handler or logs to console
 *
 * @internal
 */
export function onDromeError(
  config: Config,
  message: string,
  originalError?: unknown
): void {
  const error = new DromeError(message, originalError);

  if (config.onError) {
    config.onError(error);
  } else {
    console.log(error);
  }
}

/**
 * Custom error class for SDK errors.
 * Wraps original errors while providing consistent error handling.
 *
 * @internal
 */
class DromeError extends Error {
  /**
   * @param message - The error message
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "DromeError";
  }
}

/**
 * Retrieves the chain configuration for a specific chain ID.
 *
 * @param config - The SDK configuration
 * @param chainId - The chain ID to find configuration for
 * @returns The ChainConfig object for the specified chain
 * @throws Error if the chain ID is not found in the configuration
 *
 * @example
 * ```typescript
 * const optimismConfig = getChainConfig(config, 10);
 * console.log(optimismConfig.ROUTER_ADDRESS);
 * // optimismConfig: ChainConfig
 * ```
 */
export function getChainConfig(
  config: Config,
  chainId: number
): import("../config.js").ChainConfig {
  const entry = config.chains.find((c) => c.CHAIN.id === chainId);
  if (entry) return entry;
  throw new Error(`chainId ${chainId} is not part of the current config.`);
}

/**
 * Retrieves the default chain configuration.
 *
 * Returns the configuration for the chain specified as DEFAULT_CHAIN_ID in the config.
 *
 * @param config - The SDK configuration
 * @returns The ChainConfig object for the default chain
 *
 * @example
 * ```typescript
 * const defaultChain = getDefaultChainConfig(config);
 * console.log(`Default chain: ${defaultChain.CHAIN.name}`);
 * // defaultChain: ChainConfig
 * ```
 */
export function getDefaultChainConfig(
  config: Config
): import("../config.js").ChainConfig {
  return getChainConfig(config, config.DEFAULT_CHAIN_ID);
}
