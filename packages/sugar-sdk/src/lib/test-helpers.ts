import { connect } from "@wagmi/core";

import { getDefaultDrome } from "../utils.js";

export const TEST_ACCOUNT_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const initDrome = async (testMode: boolean = false) => {
  // When honey is enabled, modify chain RPC URLs to use localhost
  const config = getDefaultDrome(testMode);

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
    const expectedPorts = [4444, 4445]; // OP, Base based on honey.yaml

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
