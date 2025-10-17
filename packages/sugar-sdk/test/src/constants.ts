/**
 * Test account with pre-funded balance from Anvil.
 * This is the default Anvil test account from Foundry.
 */
export const account = {
  address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  balance: 10000000000000000000000n,
  privateKey:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
} as const;

/**
 * Additional useful addresses for testing
 */
export const address = {
  burn: "0x0000000000000000000000000000000000000000",
  notDeployed: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
} as const;

/**
 * Pool ID for test isolation.
 * Each vitest worker gets a unique ID to avoid conflicts.
 */
export const poolId =
  Number(process.env.VITEST_POOL_ID ?? 1) *
    Number(process.env.VITEST_SHARD_ID ?? 1) +
  Math.floor(Math.random() * 10000);
