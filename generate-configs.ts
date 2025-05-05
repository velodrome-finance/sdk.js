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

const address = (str: string) => `"${str}" as Address`;
const numberArray = (str: string) => `[${str}]`;

const filters = [
  // regex has to match the variable name between VITE_ and =
  [/LP_SUGAR_ADDRESS_\d+/, address],
  [/REWARDS_SUGAR_ADDRESS_\d+/, address],
  [/VE_SUGAR_ADDRESS_\d+/, address],
  [/RELAY_SUGAR_ADDRESS_\d+/, address],
  [/ROUTER_ADDRESS_\d+/, address],
  [/PRICES_ADDRESS_\d+/, address],
  [/VOTER_ADDRESS_\d+/, address],
  [/QUOTER_ADDRESS_\d+/, address],
  [/UNIVERSAL_ROUTER_ADDRESS_\d+/, address],
  [/SLIPSTREAM_SUGAR_ADDRESS_\d+/, address],
  [/NFPM_ADDRESS_\d+/, address],
  [/TOKEN_BRIDGE/, address],
  [/CHAIN_IDS/, numberArray],
] as [RegExp, (str: string) => string][];

function generateConfig(target: "velo" | "aero") {
  const lines = [...readLines(".env"), ...readLines(`.env.${target}`)];
  const keyValues = {} as Record<string, string>;

  for (const line of lines) {
    for (const filter of filters) {
      const [regex, transform] = filter;

      if (new RegExp(`^VITE_${regex.source}=`).test(line)) {
        const [key, value] = line.split("=");
        const transformedValue = transform(value);
        keyValues[key] = transformedValue;
        break;
      }
    }
  }

  const output = `// This file is auto-generated. Do not edit manually.
import { Address } from "viem";

export const ${target}dromeConfig = {
${Object.entries(keyValues)
  .map((kv) => `  ${kv[0].slice(5)}: ${kv[1]},`)
  .join("\n")}
};`;

  fs.writeFileSync(`./src/primitives/${target}drome-config.ts`, output, "utf8");
}

function readLines(subPath: string) {
  return fs
    .readFileSync(path.join(appRepoPath, subPath), "utf8")
    .split(/\r?\n/);
}

generateConfig("velo");
generateConfig("aero");
