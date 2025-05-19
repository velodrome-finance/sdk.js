import fs from "fs";
import path from "path";

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

const address = {
  name: "Address",
  transform: (str: string) => `"${str}" as Address`,
};
const number = {
  name: "number",
  transform: (str: string) => str,
};
const numberArray = {
  name: "number[]",
  transform: (str: string) => `[${str}]`,
};
const addressArray = {
  name: "Address[]",
  transform: (str: string) => `["${str.replaceAll(",", `","`)}"] as Address[]`,
};

const params = [
  // key has to match the property name between VITE_ and the _chainId if isChainConfig is set to true
  { key: "CHAIN_IDS", type: numberArray },
  { key: "MAX_HOPS", type: number, defaultValue: "3" },
  { key: "QUOTER_STABLE_POOL_FILLER", type: number, defaultValue: "2097152" },
  { key: "QUOTER_VOLATILE_POOL_FILLER", type: number, defaultValue: "4194304" },
  { key: "TOKEN_BRIDGE", type: address, isOptional: true },
  { key: "CONNECTOR_TOKENS", type: addressArray, isChainConfig: true },
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
] as {
  key: string;
  type: { name: string; transform: (str: string) => string };
  isChainConfig?: boolean;
  isOptional?: boolean;
  defaultValue?: string;
}[];

function generateConfig(target: "velo" | "aero") {
  const lines = [...readLines(".env"), ...readLines(`.env.${target}`)];
  const config = {} as Record<string, string>;
  const chainConfigs = {} as Record<number, Record<string, string>>;

  // read values
  for (const line of lines) {
    for (const { key, type, isChainConfig } of params) {
      const match = new RegExp(
        `^VITE_${key}${isChainConfig ? "_(\\d+)" : "()"}=(.*)$`
      ).exec(line);

      if (!match) {
        continue;
      }

      const [, chainId, value] = match;
      let targetConfig = config;

      if (isChainConfig) {
        chainConfigs[chainId] ??= {};
        targetConfig = chainConfigs[chainId];
      }

      targetConfig[key] = type.transform(value);
      break;
    }
  }

  // set default values
  for (const { key, defaultValue, isChainConfig, type } of params) {
    if (defaultValue === undefined) {
      continue;
    }

    const configs = isChainConfig ? Object.values(chainConfigs) : [config];

    for (const config of configs) {
      if (!(key in config)) {
        config[key] = type.transform(defaultValue);
      }
    }
  }

  return `export const ${target}dromeConfig = {
  type: "${target}drome",
${Object.entries(config)
  .map(([key, value]) => `  ${key}: ${value},`)
  .join("\n")}
  chains: {
${Object.entries(chainConfigs)
  .map(
    ([chainId, config]) => `    "${chainId}": {
${Object.entries(config)
  .map(([key, value]) => `      ${key}: ${value},`)
  .join("\n")}
    },`
  )
  .join("\n")}
  },
} as DromeConfig;`;
}

function generateTypes() {
  const config = [] as string[];
  const chainConfig = [] as string[];

  for (const { key, isOptional, isChainConfig, type } of params) {
    (isChainConfig ? chainConfig : config).push(
      `  ${key + (isOptional ? "?" : "")}: ${type.name};`
    );
  }

  return `export type DromeConfig = {
  type: "velodrome" | "aerodrome"
${config.join("\n")} 
  chains: { [chainId: number]: DromeChainConfig; };
};

export type DromeChainConfig = {
${chainConfig.join("\n")}
};`;
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
