import fs from "fs";
import path from "path";
import { pickAll } from "ramda";

const appRepoPath = process.argv[2];

if (!appRepoPath) {
  console.error("Please provide the path to the app repo as an argument.");
  process.exit(1);
}

if (!fs.existsSync(path.join(appRepoPath, ".env"))) {
  console.error(
    "The provided path does not contain the app repo or the .env file is missing."
  );
  process.exit(1);
}

const number = {
  name: "number",
  transform: (str: string) => str,
};
const numberArray = {
  name: "number[]",
  transform: (str: string) => `[${str}]`,
};
const string = {
  name: "string",
  transform: (str: string) => `"${str}"`,
};
const stringArray = {
  name: "string[]",
  transform: (str: string) =>
    `[${str
      .split(",")
      .map((s) => `"${s}"`)
      .join(",")}]`,
};
const address = {
  name: "Address",
  transform: (str: string) => `"${str}" as Address`,
};
const addressArray = {
  name: "Address[]",
  transform: (str: string) => `["${str.replaceAll(",", `","`)}"] as Address[]`,
};
const priceMap = {
  name: "PriceMap",
  transform: (str: string) =>
    `{${
      !str
        ? ""
        : str
            .split(",")
            .map((entry) => entry.split(/[:=]/))
            .map(
              ([chainId, substituteToken, token]) =>
                `"${token}":{chainId:${chainId},substituteToken:"${substituteToken}"}`
            )
            .join(",")
    }} as PriceMap`,
};

const params = [
  // key has to match the property name between VITE_ and the _chainId if isChainConfig is set to true or _tokenId if isTokenConfig is set to true
  { key: "CHAIN_IDS", type: numberArray },
  { key: "EXTERNAL_CHAIN_IDS", type: numberArray },
  { key: "DEFAULT_TOKEN_ORDER", type: stringArray },
  { key: "PRICE_THRESHOLD_FILTER", type: number },
  { key: "MAX_HOPS", type: number, defaultValue: "3" },
  { key: "QUOTER_STABLE_POOL_FILLER", type: number, defaultValue: "2097152" },
  { key: "QUOTER_VOLATILE_POOL_FILLER", type: number, defaultValue: "4194304" },
  { key: "PRICES_CHUNK_SIZE", type: number, defaultValue: "20" },
  { key: "PRICE_MAPS", type: priceMap, defaultValue: "" },
  { key: "POOLS_PAGE_SIZE", type: number, defaultValue: "300" },
  { key: "POOLS_COUNT_UPPER_BOUND", type: number },
  { key: "TOKENS_PAGE_SIZE", type: number, defaultValue: "1000" },
  { key: "TOKEN_BRIDGE", type: address, isOptional: true },
  { key: "CONNECTOR_TOKENS", type: addressArray, isChainConfig: true },
  { key: "STABLE_TOKEN", type: address, isChainConfig: true },
  { key: "DEFAULT_TOKENS", type: addressArray, isChainConfig: true },
  {
    key: "WRAPPED_NATIVE_TOKEN",
    type: address,
    isChainConfig: true,
    isOptional: true,
  },
  {
    key: "WETH_ADDRESS",
    type: address,
    isChainConfig: true,
    isOptional: true,
  },
  {
    key: "UNSAFE_TOKENS",
    type: addressArray,
    isChainConfig: true,
    isOptional: true,
  },
  { key: "LP_SUGAR_ADDRESS", type: address, isChainConfig: true },
  { key: "REWARDS_SUGAR_ADDRESS", type: address, isChainConfig: true },
  { key: "ROUTER_ADDRESS", type: address, isChainConfig: true },
  { key: "PRICES_ADDRESS", type: address, isChainConfig: true },
  { key: "VOTER_ADDRESS", type: address, isChainConfig: true },
  { key: "QUOTER_ADDRESS", type: address, isChainConfig: true },
  { key: "UNIVERSAL_ROUTER_ADDRESS", type: address, isChainConfig: true },
  { key: "SLIPSTREAM_SUGAR_ADDRESS", type: address, isChainConfig: true },
  { key: "NFPM_ADDRESS", type: address, isChainConfig: true },
  {
    key: "VE_SUGAR_ADDRESS",
    type: address,
    isChainConfig: true,
    isOptional: true,
  },
  {
    key: "RELAY_SUGAR_ADDRESS",
    type: address,
    isChainConfig: true,
    isOptional: true,
  },
  { key: "TOKEN_SYMBOL", type: string, isTokenConfig: true, isOptional: true },
] as {
  key: string;
  type: { name: string; transform: (str: string) => string };
  isChainConfig?: boolean;
  isTokenConfig?: boolean;
  isOptional?: boolean;
  defaultValue?: string;
}[];

function generateConfig(target: "velo" | "aero") {
  const lines = [...readLines(".env"), ...readLines(`.env.${target}`)];
  const config = {} as Record<string, string>;
  const chainConfigs = {} as Record<string, typeof config>;
  const tokenConfigs = {} as typeof chainConfigs;
  let chainIds: string[];
  let externalChainIds: string[];

  // read values
  for (const line of lines) {
    for (const { key, type, isChainConfig, isTokenConfig } of params) {
      const idSuffix = isChainConfig
        ? "_(\\d+)"
        : isTokenConfig
          ? "_(0x[0-9a-f]+)"
          : "()";
      const match = new RegExp(`^VITE_${key}${idSuffix}=(.*)$`).exec(line);

      if (!match) {
        continue;
      }

      const [, id, value] = match;
      let targetConfig = config;

      if (isChainConfig) {
        chainConfigs[id] ??= {};
        targetConfig = chainConfigs[id];
      } else if (isTokenConfig) {
        tokenConfigs[id] ??= {};
        targetConfig = tokenConfigs[id];
      }

      targetConfig[key] = type.transform(value);

      if (key === "CHAIN_IDS") {
        chainIds = value.split(",");
      } else if (key === "EXTERNAL_CHAIN_IDS") {
        externalChainIds = value.split(",");
      }

      break;
    }
  }

  // set default values
  for (const {
    key,
    defaultValue,
    isChainConfig,
    isTokenConfig,
    isOptional,
    type,
  } of params) {
    if (defaultValue === undefined) {
      continue;
    }

    const configs = isChainConfig
      ? chainConfigs
      : isTokenConfig
        ? tokenConfigs
        : { root: config };

    for (const id in configs) {
      const config = configs[id];

      if (key in config) {
        continue;
      }

      if (defaultValue !== undefined) {
        config[key] = type.transform(defaultValue);
      }
      // external chains have all properties set to optional
      else if (
        !isOptional &&
        (!isChainConfig || !externalChainIds!.includes(id))
      ) {
        throw new Error(
          `Mandatory property '${key} missing in config with id ${id}.`
        );
      }
    }
  }

  return `export const ${target}dromeConfig = {
  type: "${target}drome",
${Object.entries(config)
  .map(([key, value]) => `  ${key}: ${value},`)
  .join("\n")}
  DEFAULT_CHAIN_ID: ${config.CHAIN_IDS.slice(1, config.CHAIN_IDS.indexOf(","))},
  chains: {
${getSubconfigsOutput(pickAll(chainIds!, chainConfigs))}
  },
  externalChains: {
${getSubconfigsOutput(pickAll(externalChainIds!, chainConfigs))}
  },
  tokens: {
${getSubconfigsOutput(tokenConfigs)}
  },
} as DromeConfig;`;
}

function getSubconfigsOutput(configs: Record<string, Record<string, string>>) {
  return Object.entries(configs)
    .map(
      ([id, config]) => `    "${id}": {
${Object.entries(config ?? {})
  .map(([key, value]) => `      ${key}: ${value},`)
  .join("\n")}
    },`
    )
    .join("\n");
}

function generateTypes() {
  const config = [] as string[];
  const chainConfig = [] as string[];
  const tokenConfig = [] as string[];

  for (const {
    key,
    isOptional,
    isChainConfig,
    isTokenConfig,
    type,
  } of params) {
    (isChainConfig ? chainConfig : isTokenConfig ? tokenConfig : config).push(
      `  ${key + (isOptional ? "?" : "")}: ${type.name};`
    );
  }

  return `export type DromeConfig = {
  type: "velodrome" | "aerodrome";
${config.join("\n")}
  DEFAULT_CHAIN_ID: number;
  chains: { [chainId: number]: DromeChainConfig; };
  externalChains: { [chainId: number]: Partial<DromeChainConfig>; };
  tokens: { [tokenAddress: Address]: DromeTokenConfig; };
  onError?: (error: unknown) => void;
};

export type DromeChainConfig = {
${chainConfig.join("\n")}
};

export type DromeTokenConfig = {
${tokenConfig.join("\n")}
};

export type PriceMap = Record<Address, { chainId: number,  substituteToken: Address }>;`;
}

function readLines(subPath: string) {
  return fs
    .readFileSync(path.join(appRepoPath, subPath), "utf8")
    .split(/\r?\n/);
}

const output = `// This file is auto-generated. Do not edit manually.
import { Address } from "viem";

${generateTypes()}

${generateConfig("velo")}

${generateConfig("aero")}`;

fs.writeFileSync(`./src/config.ts`, output, "utf8");
