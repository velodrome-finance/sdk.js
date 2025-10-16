import { parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getBalance, getTransactionCount } from "viem/actions";
import { beforeAll, describe, expect, it } from "vitest";

import {
  checkHoneyStatus,
  init,
  TEST_ACCOUNT_ADDRESS,
} from "@/lib/test-helpers.js";

import { submitSignedTransaction } from "./utils.js";

interface TestContext {
  supersimConfig: Awaited<ReturnType<typeof init>>;
}

// Standard Hardhat/Anvil test account private key
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;

const test = it.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  supersimConfig: async ({}, use) => {
    const supersimConfig = await init(true);
    await use(supersimConfig);
  },
});

describe("submitSignedTransaction", () => {
  beforeAll(async () => {
    // Check if honey is running correctly in the test setup phase
    const honeyStatus = await checkHoneyStatus();
    if (!honeyStatus) {
      console.warn(
        "⚠️ Honey may not be running properly. Tests may fail if they depend on local blockchain nodes."
      );
    }
  }, 30000); // 30 second timeout for honey startup

  test(
    "submits a pre-signed transaction",
    { timeout: 30000 },
    async ({ supersimConfig }) => {
      const chainId = 10; // Optimism
      const recipientAddress = "0x1e7A6B63F98484514610A9F0D5b399d4F7a9b1dA";
      const amountToSend = parseEther("1"); // Send 1 ETH

      // Get client for the chain
      const client = supersimConfig.getClient({ chainId });

      // Check recipient balance before transfer
      const balanceBefore = await getBalance(client, {
        address: recipientAddress,
      });

      // Get nonce for the test account
      const nonce = await getTransactionCount(client, {
        address: TEST_ACCOUNT_ADDRESS,
      });

      // Create account from private key
      const account = privateKeyToAccount(TEST_PRIVATE_KEY);

      // Sign the transaction using account.signTransaction
      const signedTransaction = await account.signTransaction({
        to: recipientAddress,
        value: amountToSend,
        chainId,
        nonce,
        gas: 21000n, // Standard gas for ETH transfer
        maxFeePerGas: 1000000000n, // 1 gwei
        maxPriorityFeePerGas: 1000000000n, // 1 gwei
      });

      // Submit signed transaction using our new function
      const hash = await submitSignedTransaction({
        config: supersimConfig,
        signedTransaction,
        waitForReceipt: true,
      });

      // Verify the transaction was successful
      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);
      expect(hash.length).toBe(66); // 0x + 64 hex characters

      // Check recipient balance after transfer
      const balanceAfter = await getBalance(client, {
        address: recipientAddress,
      });

      // Verify the balance increased by the expected amount
      expect(balanceAfter).toBe(balanceBefore + amountToSend);
    }
  );
});
