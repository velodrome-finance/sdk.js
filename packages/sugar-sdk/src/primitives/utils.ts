import {
  Abi,
  AbiStateMutability,
  ContractFunctionArgs,
  ContractFunctionName,
} from "viem";

import { Config } from "../config.js";

interface PaginationBatch {
  limit: number;
  offset: number;
}

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
 *  Pagination helper for async functions
 *
 *  Usage example:
 *
 *  async function allLps(limit: number, offset: number) {
 *     return readContract({
 *       address: LP_SUGAR_ADDRESS,
 *       abi: LP_SUGAR_ABI,
 *       functionName: "all",
 *       args: [BigNumber.from(limit), BigNumber.from(offset)],
 *     });
 *  }
 *
 *  const pools = await paginate<Pool>({ limit: 100, upperBound: 1000, fetchData: allLps });
 */
export async function paginate<T>({
  limit,
  upperBound,
  fetchData,
  configuration,
}: {
  limit: number;
  upperBound: number;
  fetchData: (limit: number, offset: number) => Promise<readonly T[]>;
  configuration?: PaginationBatch[];
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

  // Check if the last batch returned non-zero items per page
  const loadMore =
    batches.length > 0 && batches[batches.length - 1].length !== 0;

  if (batches.length !== 0 && loadMore) {
    console.warn(`${fetchData.name}: passed optimistic pagination bound`);

    /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
    while (true) {
      const nextBatch = await fetchData(limit, batches.length * limit);

      if (nextBatch.length === 0) {
        break;
      }

      batches.push(nextBatch);
    }
  }
  return batches.reduce((s, batch) => [...s, ...batch], []);
}

/**
 * Call a paginated function repeatedly until all records are returned.
 * @param callback Async function that loads the page.
 * @param pageLength Number of records to request per page.
 * @param totalLength Number of total records. If ommited, pages are requested until a page has less records than {@link pageLength}.
 * @returns All records.
 */
export async function depaginate<T>(
  callback: (offset: number, count: number) => Promise<readonly T[] | T[]>,
  pageLength = 300,
  totalLength?: number
) {
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
 * used to validate function name and args
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

export function onDromeError(
  config: Config,
  message: string,
  originalError?: unknown
) {
  const error = new DromeError(message, originalError);

  if (config.onError) {
    config.onError(error);
  } else {
    console.log(error);
  }
}
class DromeError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "DromeError";
  }
}

export function getChainConfig(config: Config, chainId: number) {
  const entry = config.chains.find((c) => c.CHAIN.id === chainId);
  if (entry) return entry;
  throw new Error(`chainId ${chainId} is not part of the current config.`);
}

export function getDefaultChainConfig(config: Config) {
  return getChainConfig(config, config.DEFAULT_CHAIN_ID);
}
