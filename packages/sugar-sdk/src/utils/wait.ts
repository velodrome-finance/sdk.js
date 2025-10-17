/**
 * Utility to wait for a specified amount of time.
 * Useful for ensuring transactions reach the mempool before mining blocks in tests.
 *
 * @param time - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 *
 * @example
 * await wait(100)  // Wait 100ms
 * await mine(client, { blocks: 1 })
 */
export async function wait(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
