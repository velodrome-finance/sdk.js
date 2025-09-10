import {
  Abi,
  AbiStateMutability,
  ContractFunctionArgs,
  ContractFunctionName,
} from "viem";

import { DromeConfig } from "../config.js";

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
  config: DromeConfig,
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

export function getChainConfig(config: DromeConfig, chainId: number) {
  const entry = config.chains.find((c) => c.chainId === chainId);
  if (entry) return entry;
  throw new Error(`chainId ${chainId} is not part of the current config.`);
}

export function getDefaultChainConfig(config: DromeConfig) {
  return getChainConfig(config, config.DEFAULT_CHAIN_ID);
}
