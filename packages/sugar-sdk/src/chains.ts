import { base, type Chain, optimism } from "@wagmi/core/chains";

/**
 * Array of supported blockchain networks.
 * Currently includes Optimism and Base chains.
 *
 * @remarks
 * Chains are sorted by chain ID to ensure consistent port assignment for honey.
 */
export const chains = [optimism, base] as [Chain, ...Chain[]];

// Sort chains by chain ID to ensure consistent port assignment for honey
chains.sort((a, b) => a.id - b.id);
