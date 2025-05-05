import {
  type ContractFunctionArgs,
  type ContractFunctionName,
  type ReadContractParameters,
} from "viem";
import { lpSugarAbi, lpSugarAddress } from "../abis.js";
import { ChainIdOrClient, readContractExt } from "../utils.js";

type LpSugarParameter<
  functionName extends ContractFunctionName<typeof lpSugarAbi, "pure" | "view">,
> = ReadContractParameters<
  typeof lpSugarAbi,
  functionName,
  ContractFunctionArgs<typeof lpSugarAbi, "pure" | "view", functionName>
>;

// TODO tree-shakeable?
export namespace LpSugar {
  export async function all(
    chainIdOrClient: ChainIdOrClient,
    limit: number,
    offset: number,
    params?: LpSugarParameter<"all">
  ) {
    return await readContractExt(
      chainIdOrClient,
      lpSugarAddress,
      lpSugarAbi,
      "all",
      [BigInt(limit), BigInt(offset)],
      params
    );
  }
}
