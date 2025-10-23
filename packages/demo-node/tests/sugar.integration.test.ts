import {
  base,
  celo,
  fraxtal,
  getCallDataForSwap,
  getDefaultConfig,
  getListedTokens,
  getQuoteForSwap,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  swap,
  swellchain,
  unichain,
} from "@dromos-labs/sdk.js";
import { describe, expect, it } from "vitest";

export const TEST_ACCOUNT_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("env", () => {
  it("is set up", () => {
    [
      base,
      celo,
      fraxtal,
      ink,
      lisk,
      metalL2,
      mode,
      optimism,
      soneium,
      superseed,
      swellchain,
      unichain,
    ].forEach((chain) => {
      expect(import.meta.env[`VITE_RPC_URL_${chain.id}`]).toBeDefined();
    });
  });
});

describe("@dromos-labs/sdk.js integration smoke tests", () => {
  it("can fetch tokens", async () => {
    const config = getDefaultConfig({
      chains: [
        { chain: base, rpcUrl: import.meta.env.VITE_RPC_URL_8453 },
        { chain: optimism, rpcUrl: import.meta.env.VITE_RPC_URL_10 },
      ],
    });
    const tokens = await getListedTokens({ config });
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("can pull raw quote data on optimism and base", async () => {
    const config = getDefaultConfig({
      chains: [
        { chain: base, rpcUrl: import.meta.env.VITE_RPC_URL_8453 },
        { chain: optimism, rpcUrl: import.meta.env.VITE_RPC_URL_10 },
      ],
    });
    const tokens = await getListedTokens({
      config,
    });

    const getToken = (address: string, chainId: number) =>
      tokens.find(
        (t) =>
          t.address.toLowerCase() === address.toLowerCase() &&
          t.chainId === chainId
      );

    const velo = getToken("0x9560e827af36c94d2ac33a39bce1fe78631088db", 10);
    const opEth = getToken("eth", 10);

    expect(velo).toBeDefined();
    expect(opEth).toBeDefined();

    const opResult = await getCallDataForSwap({
      config,
      fromToken: opEth!,
      toToken: velo!,
      amountIn: BigInt(1 * 10 ** opEth!.decimals),
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
    });

    expect(opResult).toBeTruthy();

    const aero = getToken("0x940181a94a35a4569e4529a3cdfb74e38fd98631", 8453);
    const baseEth = getToken("eth", 8453);

    expect(aero).toBeDefined();
    expect(baseEth).toBeDefined();

    const baseResult = await getCallDataForSwap({
      config,
      fromToken: baseEth!,
      toToken: aero!,
      amountIn: BigInt(1 * 10 ** baseEth!.decimals),
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
    });

    expect(baseResult).toBeTruthy();
  });

  it("can build an unsigned transaction for swap", async () => {
    const config = getDefaultConfig({
      chains: [{ chain: optimism, rpcUrl: import.meta.env.VITE_RPC_URL_10 }],
    });

    const tokens = await getListedTokens({ config });

    const getToken = (identifier: string, chainId: number) =>
      tokens.find(
        (t) =>
          t.chainId === chainId &&
          (t.address.toLowerCase() === identifier.toLowerCase() ||
            t.symbol?.toLowerCase() === identifier.toLowerCase())
      );

    const opEth = getToken("eth", 10);
    const opUsdc = getToken("usdc", 10);

    expect(opEth).toBeDefined();
    expect(opUsdc).toBeDefined();

    const quote = await getQuoteForSwap({
      config,
      fromToken: opEth!,
      toToken: opUsdc!,
      amountIn: 1n * 10n ** BigInt(opEth!.decimals),
    });

    expect(quote).toBeTruthy();

    const unsignedTx = await swap({
      config,
      quote: quote!,
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
      unsignedTransactionOnly: true,
    });

    expect(unsignedTx).toBeDefined();
    expect(unsignedTx.to).toBeDefined();
    expect(unsignedTx.data.startsWith("0x")).toBe(true);
    expect(unsignedTx.value).toBeDefined();
    expect(unsignedTx.chainId).toBe(opEth!.chainId);
  });
});
