// source: https://github.com/velodrome-finance/universal-router/blob/main/test/integration-tests/shared/planner.ts

import { AbiParametersToPrimitiveTypes } from "abitype";
import { encodeAbiParameters, Hex, pad, parseAbiParameters } from "viem";

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
  TRANSFER_FROM = 0x07,
  BRIDGE_TOKEN = 0x12,
  EXECUTE_CROSS_CHAIN = 0x13,
  EXECUTE_SUB_PLAN = 0x21,
}

export const FLAG_ALLOW_REVERT = 0x80;

export const ABI_DEFINITION = {
  [CommandType.V3_SWAP_EXACT_IN]: parseAbiParameters(
    "address recipient, uint256 amountIn, uint256 amountOutMin, bytes path,bool payerIsUser, bool isUni"
  ),
  [CommandType.V2_SWAP_EXACT_IN]: parseAbiParameters(
    "address, uint256, uint256, bytes path, bool, bool isUni"
  ),
  [CommandType.V2_SWAP_EXACT_OUT]: parseAbiParameters(
    "address, uint256, uint256, (address from, address to, bool stable)[], bool, bool isUni"
  ),
  [CommandType.V3_SWAP_EXACT_OUT]: parseAbiParameters(
    "address recipient, uint256 amountOut, uint256 amountInMax, bytes path,bool payerIsUser, bool isUni"
  ),

  // Token Actions and Checks
  [CommandType.WRAP_ETH]: parseAbiParameters("address, uint256"),
  [CommandType.UNWRAP_WETH]: parseAbiParameters("address, uint256"),
  [CommandType.SWEEP]: parseAbiParameters("address, address, uint256"),
  [CommandType.TRANSFER_FROM]: parseAbiParameters(
    "address sender, address recipient, uint256 amount"
  ),

  [CommandType.BRIDGE_TOKEN]: parseAbiParameters(
    "uint8 bridgeType,address recipient,address token,address bridge,uint256 amount,uint256 msgFee, uint32 domain,bool payerIsUser"
  ),
  [CommandType.EXECUTE_SUB_PLAN]: parseAbiParameters("bytes, bytes[]"),
  [CommandType.EXECUTE_CROSS_CHAIN]: parseAbiParameters(
    "uint32 domain,address icaRouter, bytes32 remoteRouter,bytes32 ism,bytes32 commitment, uint256 msgFee, address hook, bytes"
  ),
} as const;

export enum BridgeType {
  HYP_XERC20 = 0x01,
  XVELO = 0x02,
}

type CommandParameters<T extends CommandType> = AbiParametersToPrimitiveTypes<
  (typeof ABI_DEFINITION)[T]
>;

export class RoutePlanner {
  commands: string;
  bytesCommands: Hex[];
  inputs: Hex[];

  constructor() {
    this.commands = "0x";
    this.bytesCommands = [];
    this.inputs = [];
  }

  addCommand<T extends CommandType>(
    type: T,
    parameters: CommandParameters<T>
  ): void {
    const encodedInput = encodeAbiParameters(
      ABI_DEFINITION[type],
      parameters as any // type safety could be achieved by using abitype here
    );

    this.inputs.push(encodedInput);

    this.commands = this.commands.concat(type.toString(16).padStart(2, "0"));
    //js converts the commands runtime to numbers, so need to convert to stringified bytes of length 1
    this.bytesCommands.push(getCommandByte(type));
  }
}

export function getCommandByte(command: number) {
  return pad(command.toString(16) as Hex, { size: 1 });
}