import { connect, getAccount } from "@wagmi/core";
import {
  type Address,
  encodeAbiParameters,
  formatUnits,
  keccak256,
  pad,
  parseUnits,
  toHex,
} from "viem";
import {
  call,
  getBlock,
  getTransaction,
  getTransactionReceipt,
  mine,
  readContract,
  setBalance,
  setNextBlockTimestamp,
  setStorageAt,
} from "viem/actions";
import { beforeAll, describe, expect, it } from "vitest";

import { init } from "@/lib/test-helpers.js";
import { anvilBase } from "~test/src/anvil.js";
import { accounts } from "~test/src/constants.js";

import { approve } from "./approval.js";
import { initWithAnvil } from "./lib/test-helpers.js";
import { type Token } from "./primitives/index.js";
import { getQuoteForSwap, swap } from "./swap.js";
import { getListedTokens } from "./tokens.js";

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
async function setERC20Balance(
  client: ReturnType<typeof anvilBase.getClient>,
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

interface TestContext {
  config: Awaited<ReturnType<typeof init>>;
  readonlyConfig: Awaited<ReturnType<typeof init>>;
  tokens: {
    opVelo: Token;
    opWeth: Token;
    opUsdc: Token;
    opEth: Token;
    baseAero: Token;
    baseUsdc: Token;
    baseWeth: Token;
    baseEth: Token;
  };
}

const test = it.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  config: async ({}, use) => {
    const config = await initWithAnvil(anvilBase);
    await connect(config, { connector: config.connectors[1] });

    await use(config);
  },
  // eslint-disable-next-line no-empty-pattern
  readonlyConfig: async ({}, use) => {
    const config = await init();
    await use(config);
  },
  tokens: async ({ readonlyConfig }, use) => {
    const allTokens = await getListedTokens({ config: readonlyConfig });

    const findToken = (symbol: string, chainId: number) =>
      allTokens.find(
        (token) =>
          token.symbol.toLowerCase() === symbol.toLowerCase() &&
          token.chainId === chainId
      );

    const opVelo = findToken("velo", 10);
    const opWeth = findToken("weth", 10);
    const opUsdc = findToken("usdc", 10);
    const opEth = findToken("eth", 10);
    const baseAero = findToken("aero", 8453);
    const baseUsdc = findToken("usdc", 8453);
    const baseWeth = findToken("weth", 8453);
    const baseEth = findToken("eth", 8453);

    if (!opVelo) throw new Error("Could not find VELO token for testing (OP)");
    if (!opWeth) throw new Error("Could not find WETH token for testing (OP)");
    if (!opUsdc) throw new Error("Could not find USDC token for testing (OP)");
    if (!opEth) throw new Error("Could not find ETH token for testing (OP)");
    if (!baseAero)
      throw new Error("Could not find BASE AERO token for testing (Base)");
    if (!baseUsdc)
      throw new Error("Could not find BASE USDC token for testing (Base)");
    if (!baseWeth)
      throw new Error("Could not find BASE WETH token for testing (Base)");
    if (!baseEth)
      throw new Error("Could not find BASE ETH token for testing (Base)");

    const tokens = {
      opVelo,
      opWeth,
      opUsdc,
      opEth,
      baseAero,
      baseUsdc,
      baseWeth,
      baseEth,
    };
    await use(tokens);
  },
});

// describe("getCallDataForSwap", () => {
//   test(
//     "works for Base",
//     { timeout: 20000 },
//     async ({ readonlyConfig, tokens }) => {
//       const callData = await getCallDataForSwap({
//         config: readonlyConfig,
//         fromToken: tokens.baseAero,
//         toToken: tokens.baseUsdc,
//         amountIn: parseUnits("100", tokens.baseAero.decimals),
//         account: accounts[0].address,
//         slippage: 0.01,
//       });
//       expect(callData).not.toBeNull();
//       const pi = formatUnits(callData!.priceImpact, 18);
//       // make sure price impact is in decimals for % (ie 2% is 0.02 not 2.0)
//       expect(Math.abs(parseFloat(pi))).toBeLessThan(0.01);
//     }
//   );

//   test("handles invalid slippage values", async ({
//     readonlyConfig,
//     tokens,
//   }) => {
//     await expect(
//       getCallDataForSwap({
//         config: readonlyConfig,
//         fromToken: tokens.baseUsdc,
//         toToken: tokens.baseAero,
//         amountIn: parseUnits("100", tokens.baseUsdc.decimals),
//         account: accounts[0].address,
//         slippage: -0.01, // Invalid slippage (negative)
//       })
//     ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");

//     await expect(
//       getCallDataForSwap({
//         config: readonlyConfig,
//         fromToken: tokens.baseUsdc,
//         toToken: tokens.baseAero,
//         amountIn: parseUnits("100", tokens.baseUsdc.decimals),
//         account: accounts[0].address,
//         slippage: 1.1, // Invalid slippage (> 1)
//       })
//     ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");
//   });

//   test("handles missing quotes", async ({ readonlyConfig, tokens }) => {
//     const d = await getCallDataForSwap({
//       config: readonlyConfig,
//       fromToken: Object.assign({}, tokens.baseUsdc, {
//         // not a real token
//         address: "0x7f9adfbd38b669f03d1d11000bc76b9aaea28a81",
//       }),
//       toToken: tokens.baseAero,
//       amountIn: parseUnits("100", tokens.baseUsdc.decimals),
//       account: accounts[0].address,
//       slippage: 0.01,
//     });
//     expect(d).toBeNull();
//   });
// });

describe("Test swap functionality with Anvil", () => {
  let client: ReturnType<typeof anvilBase.getClient>;

  beforeAll(async () => {
    // Get a client for Base Anvil instance
    client = anvilBase.getClient();

    // Fund test accounts with ETH
    for (const account of accounts.slice(0, 3)) {
      await setBalance(client, {
        address: account.address,
        value: parseUnits("10000", 18),
      });
    }

    // Mine a block to apply the changes
    await mine(client, { blocks: 1 });
  }, 30000);

  test.only(
    "quote and swap from AERO to USDC",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      // Advance block timestamp AHEAD of current time to prevent deadline expiration issues
      // Adding 120 seconds buffer to account for test execution time
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 120;
      await setNextBlockTimestamp(client, { timestamp: BigInt(futureTime) });
      await mine(client, { blocks: 1 });
      console.log(
        "Advanced blockchain time to:",
        futureTime,
        "(current:",
        currentTime,
        ")"
      );

      // Check which account wagmi is connected to
      const wagmiAccount = getAccount(config);
      console.log("Wagmi connected account:", wagmiAccount.address);

      // We need to fund the connected account since that's what will be used for approval/swap
      const account = wagmiAccount.address!;
      console.log("Using account for funding and operations:", account);

      // Read AERO token balance
      const aeroBalance = await readContract(client, {
        address: tokens.baseAero.address as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [account],
      });

      console.log(
        "AERO balance:",
        formatUnits(aeroBalance, tokens.baseAero.decimals),
        "AERO"
      );
      console.log("AERO balance (raw):", aeroBalance);

      // Fund the account with AERO tokens
      const amountIn = parseUnits("100", tokens.baseAero.decimals);
      const fundAmount = parseUnits("1000", tokens.baseAero.decimals); // Fund with 1000 AERO

      console.log(
        "Funding account with",
        formatUnits(fundAmount, tokens.baseAero.decimals),
        "AERO"
      );
      await setERC20Balance(
        client,
        tokens.baseAero.address as Address,
        account,
        fundAmount
      );

      // Verify the balance was set
      const newAeroBalance = await readContract(client, {
        address: tokens.baseAero.address as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [account],
      });
      console.log(
        "New AERO balance:",
        formatUnits(newAeroBalance, tokens.baseAero.decimals),
        "AERO"
      );
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseAero,
        toToken: tokens.baseUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.baseAero);
      expect(quote!.toToken).toEqual(tokens.baseUsdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);
      expect(quote!.spenderAddress).toBeDefined();

      console.log("Quote details:");
      console.log("  - Spender address:", quote!.spenderAddress);
      console.log(
        "  - Amount in:",
        formatUnits(quote!.amount, tokens.baseAero.decimals),
        "AERO"
      );
      console.log(
        "  - Amount out:",
        formatUnits(quote!.amountOut, tokens.baseUsdc.decimals),
        "USDC"
      );
      console.log("  - Path nodes:", quote!.path.nodes.length);

      // Approve tokens before swap using private key
      const approvalHash = await approve({
        config,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
        waitForReceipt: false,
      });

      console.log("Approval transaction hash:", approvalHash);

      // Get the approval transaction to see which account it's from
      const approvalTx = await getTransaction(client, {
        hash: approvalHash as `0x${string}`,
      });
      console.log("Approval sent from:", approvalTx.from);
      console.log("Funding/checking balance for:", account);

      // Mine the approval transaction
      await mine(client, { blocks: 1 });

      // Check approval transaction status
      const approvalReceipt = await getTransactionReceipt(client, {
        hash: approvalHash as `0x${string}`,
      });
      console.log("Approval receipt status:", approvalReceipt.status);

      if (approvalReceipt.status === "reverted") {
        console.log("Approval REVERTED!");

        // Try to get the revert reason by simulating the transaction
        const approvalTx = await getTransaction(client, {
          hash: approvalHash as `0x${string}`,
        });
        try {
          await call(client, {
            to: approvalTx.to!,
            data: approvalTx.input,
            from: approvalTx.from,
            value: approvalTx.value,
          });
        } catch (error: any) {
          console.log("Approval revert reason:", error.message);
          console.log("Full error:", error);
        }
      }

      // Assert approval succeeded
      expect(approvalReceipt.status).toBe("success");

      // Check allowance was set correctly
      const allowance = await readContract(client, {
        address: tokens.baseAero.address as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "allowance",
        args: [account, quote!.spenderAddress as Address],
      });
      console.log(
        "Allowance set:",
        formatUnits(allowance, tokens.baseAero.decimals),
        "AERO"
      );
      console.log(
        "Amount to swap:",
        formatUnits(quote!.amount, tokens.baseAero.decimals),
        "AERO"
      );

      // Check current block timestamp and advance if needed
      const blockBeforeSwap = await getBlock(client);
      const timeBeforeSwap = Math.floor(Date.now() / 1000);
      console.log("Block timestamp before swap:", blockBeforeSwap.timestamp);
      console.log("Current real time:", timeBeforeSwap);
      console.log(
        "Time difference:",
        timeBeforeSwap - Number(blockBeforeSwap.timestamp),
        "seconds"
      );

      // Set Anvil's next block timestamp to current time to avoid deadline expiration
      if (Number(blockBeforeSwap.timestamp) < timeBeforeSwap) {
        console.log("Advancing block timestamp to current time...");
        await setNextBlockTimestamp(client, {
          timestamp: BigInt(timeBeforeSwap),
        });
        await mine(client, { blocks: 1 });
        const newBlock = await getBlock(client);
        console.log("New block timestamp:", newBlock.timestamp);
      }

      // Execute swap using private key
      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      console.log("Swap transaction hash:", hash);

      // Mine the swap transaction
      await mine(client, { blocks: 1 });

      // Get transaction details
      const tx = await getTransaction(client, { hash: hash as `0x${string}` });
      console.log("Transaction details:", {
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        nonce: tx.nonce,
        input: tx.input.slice(0, 66) + "...", // Just show first part of calldata
      });

      // Get transaction receipt
      const receipt = await getTransactionReceipt(client, {
        hash: hash as `0x${string}`,
      });
      console.log("Transaction receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        logs: receipt.logs.length,
      });

      if (receipt.status === "reverted") {
        console.log("Swap transaction REVERTED!");

        // Try to get the revert reason by simulating the transaction
        try {
          await call(client, {
            to: tx.to!,
            data: tx.input,
            from: tx.from,
            value: tx.value,
          });
        } catch (error: any) {
          console.log("Swap revert reason:", error.message);
          console.log("Full error:", error);

          // Also log the shortMessage if available (viem usually provides a nice error message)
          if (error.shortMessage) {
            console.log("Short message:", error.shortMessage);
          }
          if (error.details) {
            console.log("Details:", error.details);
          }
          if (error.cause) {
            console.log("Cause:", error.cause);
          }
        }
      } else {
        console.log("Swap transaction SUCCESS!");
      }

      // Assert swap transaction succeeded
      expect(receipt.status).toBe("success");
    }
  );

  test(
    "quote and swap from ETH to AERO",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("0.1", tokens.baseEth.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseEth,
        toToken: tokens.baseAero,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.baseEth);
      expect(quote!.toToken).toEqual(tokens.baseAero);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      // For ETH swaps, approval is not needed, just execute swap
      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      // Mine the transaction
      await mine(client, { blocks: 1 });
    }
  );

  test(
    "swap without waiting for receipt",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("50", tokens.baseAero.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseAero,
        toToken: tokens.baseUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();

      // Approve tokens before swap
      await approve({
        config,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
        waitForReceipt: false,
      });

      await mine(client, { blocks: 1 });

      // Call swap without waiting for receipt
      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);
      // Hash should be returned immediately without waiting for confirmation

      // Mine manually
      await mine(client, { blocks: 1 });
    }
  );

  test(
    "separate approval and swap",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("100", tokens.baseWeth.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseWeth,
        toToken: tokens.baseUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();

      // Manually approve tokens before swap
      await approve({
        config,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
        waitForReceipt: false,
      });

      await mine(client, { blocks: 1 });

      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      await mine(client, { blocks: 1 });
    }
  );
});
