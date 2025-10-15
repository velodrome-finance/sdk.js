import { getAccount, switchChain } from "@wagmi/core";
import { splitEvery } from "ramda";

import { SugarWagmiConfig } from "./config.js";

export interface BaseParams {
  config: SugarWagmiConfig;
}

export interface ChainParams extends BaseParams {
  chainId: number;
}

export async function ensureConnectedChain(params: ChainParams) {
  const { config, chainId } = params;
  if (chainId !== getAccount(config).chainId) {
    await switchChain(config, { chainId });
  }
}

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
