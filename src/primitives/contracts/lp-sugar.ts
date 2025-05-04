import type { ReadContractParameters } from "viem";
import { lpSugarAbi, lpSugarAddress } from "../abis.js";
import { ChainIdOrClient, readContractExt } from "../utils.js";

// TODO tree-shakeable?
export namespace LpSugar {
  export async function all(chainIdOrClient: ChainIdOrClient, limit: number, offset: number, params?: ReadContractParameters) {
    return await readContractExt(chainIdOrClient, lpSugarAddress, lpSugarAbi, "all", [BigInt(limit), BigInt(offset)], params);
  }
}
