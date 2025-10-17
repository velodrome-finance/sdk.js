import { setIntervalMining } from "viem/actions";
import { beforeEach } from "vitest";

import * as instances from "./src/anvil.js";

/**
 * Get a test client for the Base chain
 */
const client = instances.anvilBase.getClient();

/**
 * Per-test setup - runs before each test to ensure clean state
 */
beforeEach(async () => {
  if (process.env.SKIP_GLOBAL_SETUP) return;

  // Reset to manual mining (no auto-mining)
  // This ensures tests have full control over block creation
  await setIntervalMining(client, { interval: 0 });
}, 20_000);
