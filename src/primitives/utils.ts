import {
  Abi,
  Address,
  Chain,
  Client,
  ContractFunctionArgs,
  ContractFunctionName,
  createClient,
  extractChain,
  http,
  ReadContractParameters,
  ReadContractReturnType,
} from "viem";
import { readContract } from "viem/actions";
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
} from "viem/chains";
import { aerodromeConfig } from "./aerodrome-config.js";
import { velodromeConfig } from "./velodrome-config.js";

export const chains = [
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
] as readonly Chain[];
export type ChainId = (typeof chains)[number]["id"];
export type ChainIdOrClient = ChainId | Client;
type SdkClientExtension =
  | { isVelodrome: true; sdkConfig: typeof velodromeConfig }
  | { isVelodrome: false; sdkConfig: typeof aerodromeConfig };

const clients = new Map<ChainId, Client & SdkClientExtension>();

export function getClient(chainId: ChainId) {
  if (!clients.has(chainId)) {
    // TODO rpcs (loadbalance.ts); custom rpcs?
    const chain = extractChain({ chains, id: chainId });
    const isVelodrome = chain !== base;
    const client = createClient({ chain, transport: http() }).extend(
      (client) =>
        ({
          isVelodrome,
          sdkConfig: isVelodrome ? velodromeConfig : aerodromeConfig,
        }) as SdkClientExtension
    );
    clients.set(chainId, client);
  }

  return clients.get(chainId)!;
}

export async function readContractExt<
  const abiType extends Abi,
  functionNameType extends ContractFunctionName<abiType, "pure" | "view">,
  const argsType extends ContractFunctionArgs<
    abiType,
    "pure" | "view",
    functionNameType
  >,
>(
  chainIdOrClient: ChainIdOrClient,
  chainToAddressMap: { [index: number]: Address },
  abi: abiType,
  functionName: functionNameType,
  args: argsType,
  params?: NoInfer<ReadContractParameters<abiType, functionNameType, argsType>>
): Promise<ReadContractReturnType<abiType, functionNameType, argsType>> {
  const client =
    typeof chainIdOrClient === "number"
      ? getClient(chainIdOrClient)
      : chainIdOrClient;
  const address = params?.address ?? chainToAddressMap[client.chain?.id!];

  if (!address) {
    throw new Error("Could not determine contract address.");
  }

  params ??= {
    address,
    abi,
    functionName,
  };

  params.address ??= address;
  params.abi ??= abi;
  params.functionName ??= functionName;
  params.args ??= args;

  return await readContract(
    client,
    params as ReadContractParameters<abiType, functionNameType, argsType>
  );
}
