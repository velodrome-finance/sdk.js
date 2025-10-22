import {
  base,
  celo,
  type Chain,
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
} from "@wagmi/core/chains";

/**
 * Array of supported blockchain networks.
 * Currently includes Optimism, Unichain, Fraxtal, Lisk, Metal L2, Soneium,
 * Swellchain, Superseed, Base, Mode, Celo, and Ink.
 *
 * @remarks
 * Chains are sorted by chain ID to ensure consistent port assignment for honey.
 */
export const chains = [
  optimism,
  unichain,
  fraxtal,
  lisk,
  metalL2,
  soneium,
  swellchain,
  superseed,
  base,
  mode,
  celo,
  ink,
] as [Chain, ...Chain[]];

// Sort chains by chain ID to ensure consistent port assignment for honey
chains.sort((a, b) => a.id - b.id);
