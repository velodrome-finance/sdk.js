import { base, type Chain, optimism } from "@wagmi/core/chains";

// supported chains
export const chains = [optimism, base] as [Chain, ...Chain[]];

// sort chains by chain ID to ensure consistent port assignment for honey
chains.sort((a, b) => a.id - b.id);
