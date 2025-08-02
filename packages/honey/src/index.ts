// Thanks Claude for porting this from https://github.com/velodrome-finance/sugar-sdk/blob/main/honey.py

import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as yaml from "js-yaml";

// Types
export interface TokenBalance {
  token: string;
  address: string;
  amount: number;
  holder: string;
}

export interface ChainConfig {
  name: string;
  id: string;
  balance: TokenBalance[];
  port: number;
}

export interface HoneyConfig {
  wallet: string;
  chains: ChainConfig[];
  starting_port: number;
}

export interface TokenRequest {
  token: string;
  chain: string;
  amount: string;
  holder: string;
}

interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

// Configuration class
export class Honey {
  constructor(
    public wallet: string,
    public chains: ChainConfig[],
    public starting_port: number
  ) {}

  static fromConfig(configPath: string = "honey.yaml"): Honey {
    const data = yaml.load(fs.readFileSync(configPath, "utf8")) as any;

    // Extract configuration values
    const startingPort =
      data.honey.find((item: any) => item.starting_port !== undefined)
        ?.starting_port || 4444;

    // Extract wallet private key
    const walletItem =
      data.honey.find((item: any) => item.wallet !== undefined) || {};
    const walletPk = walletItem.wallet?.find(
      (w: any) => w.pk !== undefined
    )?.pk;

    if (!walletPk) {
      throw new Error("No wallet private key found in honey.yaml");
    }

    // Extract chains
    const chainsList: ChainConfig[] = [];
    const chainsItem =
      data.honey.find((item: any) => item.chains !== undefined) || {};

    for (const chainData of chainsItem.chains || []) {
      if (chainData.name) {
        const balanceList: TokenBalance[] = (chainData.balance || []).map(
          (b: any) => ({
            token: b.token || "",
            address: b.address || "",
            amount: parseInt(b.amount || "0"),
            holder: b.holder || "",
          })
        );

        chainsList.push({
          name: chainData.name,
          id: chainData.id || "",
          balance: balanceList,
          port: startingPort + chainsList.length,
        });
      }
    }

    const honeyConfig = new Honey(walletPk, chainsList, startingPort);

    console.log("🍯 Loaded Honey configuration:");
    console.log(`  Wallet: ${honeyConfig.wallet.slice(0, 10)}...`);
    console.log(`  Chains: ${honeyConfig.chains.length} configured`);

    return honeyConfig;
  }
}

// Utility functions
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

function runCommandWithResult(args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(args[0], args.slice(1), {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
      });
    });

    child.on("error", (error) => {
      resolve({
        success: false,
        stdout,
        stderr: error.message,
      });
    });
  });
}

function runCommandWithTimeout(
  args: string[],
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Command timed out"));
    }, timeoutMs);

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Wallet functions
export async function createWallet(
  honeyConfig: Honey
): Promise<[string, string]> {
  try {
    // Derive address from private key
    const address = await runCommand("cast", [
      "wallet",
      "address",
      "--private-key",
      honeyConfig.wallet,
    ]);

    if (address) {
      const cleanAddress = address.trim();
      console.log(`Using wallet from honey config: ${cleanAddress}`);
      return [cleanAddress, honeyConfig.wallet];
    } else {
      throw new Error("Failed to derive address from honey config private key");
    }
  } catch (error) {
    console.error(`Error using honey config private key: ${error}`);
    throw error;
  }
}

export async function checkEthBalance(
  address: string,
  chainPort: number
): Promise<number | null> {
  try {
    const result = await runCommand("cast", [
      "balance",
      address,
      "--rpc-url",
      `http://localhost:${chainPort}`,
    ]);

    if (result) {
      return parseInt(result.trim());
    } else {
      console.debug(`Balance check failed for port ${chainPort}`);
      return null;
    }
  } catch (error) {
    console.error(`Error checking balance on port ${chainPort}: ${error}`);
    return null;
  }
}

export async function checkTokenBalance(
  walletAddress: string,
  chainPort: number,
  tokenAddress: string
): Promise<number> {
  try {
    const result = await runCommand("cast", [
      "call",
      tokenAddress,
      "balanceOf(address)(uint256)",
      walletAddress,
      "--rpc-url",
      `http://localhost:${chainPort}`,
    ]);

    if (result) {
      let balanceStr = result.trim();
      // Handle scientific notation like "1000000000000000000000 [1e21]"
      if (balanceStr.includes("[")) {
        balanceStr = balanceStr.split("[")[0].trim();
      }
      return parseInt(balanceStr);
    } else {
      console.debug(
        `Token balance check failed for ${tokenAddress} on port ${chainPort}`
      );
      return 0;
    }
  } catch (error) {
    console.error(
      `Error checking token balance for ${tokenAddress} on port ${chainPort}: ${error}`
    );
    return 0;
  }
}

// Supersim functions
export async function checkSupersimReady(
  honeyConfig: Honey,
  timeoutSeconds: number = 60
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutSeconds * 1000) {
    try {
      const result = await runCommandWithTimeout(
        [
          "cast",
          "call",
          // TODO: figure out what this address is supposed to be
          "0x7F6D3A4c8a1111DDbFe282794f4D608aB7Cb23A2",
          "MAX_TOKENS()(uint256)",
          "--rpc-url",
          `http://localhost:${honeyConfig.starting_port}`,
        ],
        10000
      );

      if (result && result.trim()) {
        return true;
      }
    } catch {
      // Ignore errors and continue trying
    }

    await sleep(2000);
  }

  return false;
}

export function runSupersim(honeyConfig: Honey): ChildProcess {
  console.log("Starting supersim in background mode...");

  const env: NodeJS.ProcessEnv = { ...global.process.env };
  // Load .env if it exists
  try {
    const envContent = fs.readFileSync(".env", "utf8");
    envContent.split("\n").forEach((line: string) => {
      const [key, value] = line.split("=");
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
  } catch {
    // .env file doesn't exist, continue without it
  }

  const supersimProcess = spawn(
    "supersim",
    [
      "fork",
      "--l2.host=0.0.0.0",
      `--l2.starting.port=${honeyConfig.starting_port}`,
      `--chains=${honeyConfig.chains.map((chain) => chain.name.toLowerCase()).join(",")}`,
    ],
    { env }
  );

  console.log("Waiting for supersim to be ready...");

  return supersimProcess;
}

// Token functions
export async function addTokensByAddress(
  walletAddress: string,
  tokenRequests: TokenRequest[],
  honeyConfig: Honey
): Promise<void> {
  const processTokenRequest = async (
    request: TokenRequest,
    delaySeconds: number = 0
  ): Promise<void> => {
    // Add delay to prevent nonce conflicts when using same holder
    if (delaySeconds > 0) {
      await sleep(delaySeconds * 1000);
    }

    const {
      token: tokenAddress,
      chain: chainName,
      amount,
      holder: largeHolder,
    } = request;
    const chainConfig = honeyConfig.chains.find((c) => c.name === chainName);

    if (!chainConfig) {
      throw new Error(`Chain ${chainName} not found in honey config`);
    }

    const chain = {
      name: chainConfig.name,
      id: chainConfig.id,
      port: chainConfig.port,
    };

    const maxRetries = 3;
    let retryDelay = 2.0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Impersonate the large holder
        const impersonateResult = await runCommandWithResult([
          "cast",
          "rpc",
          "anvil_impersonateAccount",
          largeHolder,
          "--rpc-url",
          `http://localhost:${chain.port}`,
        ]);

        if (!impersonateResult.success) {
          throw new Error(
            `Failed to impersonate account ${largeHolder} on ${chainName}`
          );
        }

        // Transfer tokens using raw amount
        const transferResult = await runCommandWithResult([
          "cast",
          "send",
          tokenAddress,
          "transfer(address,uint256)",
          walletAddress,
          amount,
          "--rpc-url",
          `http://localhost:${chain.port}`,
          "--from",
          largeHolder,
          "--unlocked",
        ]);

        if (transferResult.success) {
          console.log(
            `  ✓ Successfully added ${amount} tokens (${tokenAddress.slice(0, 10)}...) on ${chainName}`
          );
          return; // Success, exit retry loop
        } else {
          const errorMsg = transferResult.stderr;

          // Check if it's an underpriced transaction error
          if (
            errorMsg.includes("replacement transaction underpriced") ||
            errorMsg.includes("underpriced")
          ) {
            if (attempt < maxRetries) {
              console.warn(
                `  ⚠️  Underpriced transaction on ${chainName}, retrying in ${retryDelay}s (attempt ${attempt + 1}/${maxRetries + 1})`
              );
              await sleep(retryDelay * 1000);
              retryDelay *= 1.5; // Exponential backoff
              continue;
            } else {
              console.error(
                `Failed to transfer tokens on ${chainName} after ${maxRetries + 1} attempts: ${errorMsg}`
              );
            }
          } else {
            console.error(
              `Failed to transfer tokens on ${chainName}: ${errorMsg}`
            );
            return; // Non-retryable error, exit
          }
        }
      } catch (error) {
        if (attempt < maxRetries) {
          console.warn(
            `  ⚠️  Error on ${chainName}, retrying in ${retryDelay}s (attempt ${attempt + 1}/${maxRetries + 1}): ${error}`
          );
          await sleep(retryDelay * 1000);
          retryDelay *= 1.5;
          continue;
        } else {
          console.error(
            `Error adding tokens on ${chainName} after ${maxRetries + 1} attempts: ${error}`
          );
          return;
        }
      }
    }
  };

  // Process token requests in parallel with limited concurrency
  const maxWorkers = Math.min(tokenRequests.length, 4);

  for (let i = 0; i < tokenRequests.length; i += maxWorkers) {
    const batch = tokenRequests.slice(i, i + maxWorkers);
    const batchPromises = batch.map((request) => processTokenRequest(request));

    // Wait for this batch to complete before starting the next
    await Promise.allSettled(batchPromises);
  }
}

export async function checkTokenBalancesAllChains(
  walletAddress: string,
  honeyConfig: Honey
): Promise<void> {
  console.log("Checking balances across all chains:");

  const checkChainBalances = async (
    chainConfig: ChainConfig
  ): Promise<[string, string, string]> => {
    // Check ETH balance
    const ethBalance = await checkEthBalance(walletAddress, chainConfig.port);
    const ethStr = ethBalance !== null ? `${ethBalance} ETH` : "Failed";

    // Check token balances for tokens configured on this chain
    const tokenBalances: string[] = [];
    for (const tokenConfig of chainConfig.balance) {
      const tokenBalance = await checkTokenBalance(
        walletAddress,
        chainConfig.port,
        tokenConfig.address
      );
      if (tokenBalance > 0) {
        tokenBalances.push(`${tokenBalance} ${tokenConfig.token}`);
      }
    }

    // Format output
    const tokenStr =
      tokenBalances.length > 0 ? ", " + tokenBalances.join(", ") : "";

    return [chainConfig.name, ethStr, tokenStr];
  };

  // Process all chains in parallel
  const promises = honeyConfig.chains.map((chainConfig) =>
    checkChainBalances(chainConfig)
  );

  try {
    const results = await Promise.allSettled(promises);

    // Collect successful results and sort by chain name
    const successfulResults: [string, string, string][] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        successfulResults.push(result.value);
      } else {
        console.error(`Error checking chain balances: ${result.reason}`);
      }
    }

    // Sort results by chain name for consistent output
    successfulResults.sort((a, b) => a[0].localeCompare(b[0]));

    // Log all results
    for (const [chainName, ethStr, tokenStr] of successfulResults) {
      console.log(`  ${chainName}: ${ethStr}${tokenStr}`);
    }
  } catch (error) {
    console.error(`Error checking balances: ${error}`);
  }
}

// Main function
async function main() {
  try {
    // Load configuration from honey.yaml (mandatory)
    const honeyConfig = Honey.fromConfig();

    const process = runSupersim(honeyConfig);

    const ready = await checkSupersimReady(honeyConfig);
    if (ready) {
      console.log("Supersim started successfully. Listening on ports:");
      for (const chain of honeyConfig.chains) {
        console.log(
          `  ${chain.name} (Chain ID ${chain.id}): http://localhost:${chain.port}`
        );
      }
    } else {
      console.error("Supersim failed to start or become ready within timeout");
      process.kill();
      global.process.exit(1);
    }

    // Create wallet for cross-chain operations
    console.log("Creating new wallet...");
    const [walletAddress] = await createWallet(honeyConfig);

    console.log(`Wallet loaded: ${walletAddress}`);

    // Add tokens to wallet from honey config
    const tokenRequests: TokenRequest[] = [];
    for (const chainConfig of honeyConfig.chains) {
      for (const balance of chainConfig.balance) {
        tokenRequests.push({
          token: balance.address, // Using address as token identifier
          chain: chainConfig.name,
          amount: balance.amount.toString(), // Convert int to string for subprocess
          holder: balance.holder, // Use custom holder from config
        });
      }
    }

    if (tokenRequests.length > 0) {
      console.log("🍯 Adding tokens from honey.yaml configuration...");
      await addTokensByAddress(walletAddress, tokenRequests, honeyConfig);
    } else {
      console.log("🍯 No token balances configured in honey.yaml");
    }

    // Check final balances (ETH + tokens)
    await checkTokenBalancesAllChains(walletAddress, honeyConfig);

    // Keep the process running
    global.process.on("SIGINT", () => {
      console.log("Shutting down supersim...");
      process.kill();
      global.process.exit(0);
    });

    return new Promise<void>((resolve) => {
      process.on("exit", () => {
        resolve();
      });
    });
  } catch (error) {
    console.error("Error in honey main:", error);
    global.process.exit(1);
  }
}

if (import.meta.url === `file://${global.process.argv[1]}`) {
  main().catch(console.error);
}
