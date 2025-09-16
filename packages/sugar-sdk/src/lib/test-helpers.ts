import { connect } from "@wagmi/core";

import {
  base,
  getDefaultDrome,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  swellchain,
  unichain,
} from "../config.js";

export const TEST_ACCOUNT_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const initDrome = async (testMode: boolean = false) => {
  // When honey is enabled, modify chain RPC URLs to use localhost
  const config = getDefaultDrome({
    chains: [
      optimism, // 4444
      unichain, // 4445
      lisk, // 4446
      metalL2, // 4447
      soneium, // 4448
      swellchain, // 4449
      superseed, // 4450
      base, // 44451
      mode, // 44452
      ink, // 44453
    ].map((chain, i) => {
      const rpcUrl = testMode
        ? `http://localhost:${i + 4444}`
        : process.env[`RPC_URI_${chain.id}`];
      console.log(`RPC_URI_${chain.id}`, process.env[`RPC_URI_${chain.id}`]);
      if (!rpcUrl) {
        throw new Error(
          `RPC URL not defined for chain ${chain.name} (${chain.id})`
        );
      }
      return {
        chain,
        rpcUrl,
      };
    }),
    testMode,
  });

  if (!testMode) {
    return config;
  }

  // when using supersim via honey, we need to connect test account
  await connect(config, { connector: config.connectors[1] });
  return config;
};

export const getDromeConfig = async (testMode: boolean = false) => {
  const d = await initDrome(testMode);
  return d.dromeConfig;
};

// Honey health check function
export async function checkHoneyStatus(): Promise<boolean> {
  try {
    // Check if honey is running by testing connectivity to the expected ports
    /*
      optimism,  // 4444
      unichain,  // 4445
      [MISSING] fraxtal,   
      lisk,      // 4446
      metalL2,   // 4447
      soneium,   // 4448
      swellchain,// 4449
      superseed, // 4450
      base,      // 44451
      mode,      // 44452
      [MISSING] celo,
      ink,       // 44453
    */
    const expectedPorts = [
      4444, 4445, 4446, 4447, 4448, 4449, 4450, 4451, 4452, 4453,
    ];

    for (const port of expectedPorts) {
      const response = await fetch(`http://localhost:${port}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        console.warn(`Honey port ${port} not responding`);
        return false;
      }
    }

    console.log("✅ Honey is running correctly on all expected ports");
    return true;
  } catch (error) {
    console.warn("⚠️ Honey connectivity check failed:", error);
    return false;
  }
}
