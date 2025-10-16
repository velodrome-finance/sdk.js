import {
  getAccount,
  getClient,
  switchChain,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { splitEvery } from "ramda";
import { Hex } from "viem";
import { sendRawTransaction } from "viem/actions";

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

/**
 * Submit a pre-signed transaction to the network
 * @param config - Wagmi configuration
 * @param signedTransaction - The serialized signed transaction (RLP-encoded)
 * @param waitForReceipt - Whether to wait for transaction receipt (default: true)
 * @returns Transaction hash
 */
export async function submitSignedTransaction({
  config,
  signedTransaction,
  waitForReceipt = true,
}: BaseParams & {
  signedTransaction: Hex;
  waitForReceipt?: boolean;
}): Promise<Hex> {
  const client = getClient(config);

  if (!client) {
    throw new Error("No client found in config");
  }

  // Send the raw signed transaction using viem's action
  const hash = await sendRawTransaction(client, {
    serializedTransaction: signedTransaction,
  });

  if (!waitForReceipt) {
    return hash;
  }

  // Wait for transaction receipt
  const receipt = await waitForTransactionReceipt(config, { hash });

  if (receipt.status !== "success") {
    throw new Error(`Transaction failed: ${receipt.status}`);
  }

  return hash;
}
