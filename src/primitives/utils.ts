import { Config } from "@wagmi/core";
import {
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
} from "@wagmi/core/chains";
import { Client } from "viem";

export const sdkChains = [
  optimism,
  mode,
  lisk,
  metalL2,
  fraxtal,
  ink,
  soneium,
  superseed,
  swellchain,
  unichain,
  celo,
  base,
] as const;

export type SdkChains = typeof sdkChains;
export type SdkChain = SdkChains[number];
export type SdkChainId = SdkChain["id"];

export type SdkConfig = Config<SdkChains>;

export type ChainId = (typeof sdkChains)[number]["id"];
export type ChainIdOrClient = ChainId | Client;
