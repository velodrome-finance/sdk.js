import * as executionInstances from "./src/anvil.js";

/**
 * Global setup for tests - starts Anvil instances before running tests.
 *
 * This uses prool's proxy server pattern to enable parallel test execution:
 * - Each vitest worker gets a unique VITEST_POOL_ID
 * - Requests to http://127.0.0.1:PORT/<ID> are routed to separate Anvil instances
 * - This allows tests to run in parallel without interfering with each other
 */
export default async function () {
  if (process.env.SKIP_GLOBAL_SETUP) return;

  const shutdown = await Promise.all([
    ...Object.values(executionInstances).map((instance) => instance.start()),
  ]);

  // Return cleanup function
  return () => Promise.all(shutdown.map((fn) => fn()));
}
