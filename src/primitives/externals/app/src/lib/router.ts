// src commit efc754bec699419b901397e63d23efe996ff4ca0
// source: https://github.com/velodrome-finance/universal-router/blob/main/test/integration-tests/shared/planner.ts

import { encodeAbiParameters, parseAbiParameters } from "viem";

/**
 * CommandTypes
 * @description Flags that modify a command's execution
 * @enum {number}
 */
export enum CommandType {
  V2_SWAP_EXACT_IN = 0x08,
  V3_SWAP_EXACT_IN = 0x00,
  V2_SWAP_EXACT_OUT = 0x09,
  V3_SWAP_EXACT_OUT = 0x01,
  WRAP_ETH = 0x0b,
  UNWRAP_WETH = 0x0c,
  SWEEP = 0x04,
}

const ABI_DEFINITION = {
  [CommandType.V3_SWAP_EXACT_IN]: parseAbiParameters(
    "address, uint256, uint256, bytes, bool"
  ),
  [CommandType.V2_SWAP_EXACT_IN]: parseAbiParameters(
    "address, uint256, uint256, (address from, address to, bool stable)[], bool"
  ),
  [CommandType.V2_SWAP_EXACT_OUT]: parseAbiParameters(
    "address, uint256, uint256, (address from, address to, bool stable)[], bool"
  ),
  [CommandType.V3_SWAP_EXACT_OUT]: parseAbiParameters(
    "address, uint256, uint256, bytes, bool"
  ),

  // Token Actions and Checks
  [CommandType.WRAP_ETH]: parseAbiParameters("address, uint256"),
  [CommandType.UNWRAP_WETH]: parseAbiParameters("address, uint256"),
  [CommandType.SWEEP]: parseAbiParameters("address, address, uint256"),
} as const;

export class RoutePlanner {
  commands: string;
  inputs: string[];

  constructor() {
    this.commands = "0x";
    this.inputs = [];
  }

  addCommand<T extends CommandType>(type: T, parameters: any[]): void {
    const encodedInput = encodeAbiParameters(
      ABI_DEFINITION[type],
      parameters as any // type safety could be achieved by using abitype here
    );

    this.inputs.push(encodedInput);

    this.commands = this.commands.concat(type.toString(16).padStart(2, "0"));
  }
}
