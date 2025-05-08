import { ReadContractParameters } from "@wagmi/core";
import {
  AbiStateMutability,
  ContractFunctionArgs,
  ContractFunctionName,
} from "viem";
import { lpSugarAbi, lpSugarAddress } from "../abis.js";
import { SdkChain, SdkConfig } from "../utils.js";

// TODO if this type is used as a return type below, the result of a readContract call does not have all properties. if assigned type here is used directly in the return type, everything works as it should...
type PoolReadParamaters<
  functionName extends ContractFunctionName<typeof lpSugarAbi, "pure" | "view">,
> = ReadContractParameters<
  typeof lpSugarAbi,
  functionName,
  ContractFunctionArgs<typeof lpSugarAbi, "pure" | "view", functionName>,
  SdkConfig
>;

type PoolFunctionArgs<
  functionName extends ContractFunctionName<typeof lpSugarAbi>,
> = ContractFunctionArgs<typeof lpSugarAbi, AbiStateMutability, functionName>;

/**
 *
 * @param chain The target chain.
 * @param offset The offset in the pool list.
 * @param length The amount of pools to return.
 * @returns The requested pools.
 */
export function getAllPoolsParams(
  chain: SdkChain,
  offset: number,
  length: number
): ReadContractParameters<
  typeof lpSugarAbi,
  "all",
  ContractFunctionArgs<typeof lpSugarAbi, "pure" | "view", "all">,
  SdkConfig
> {
  return {
    chainId: chain.id,
    address: lpSugarAddress[chain.id],
    abi: lpSugarAbi,
    functionName: "all",
    args: [BigInt(length), BigInt(offset)],
  };
}
