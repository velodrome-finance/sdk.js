import { ChildProcess } from "child_process";
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
export declare class Honey {
    wallet: string;
    chains: ChainConfig[];
    starting_port: number;
    constructor(wallet: string, chains: ChainConfig[], starting_port: number);
    static fromConfig(configPath?: string): Honey;
}
export declare function createWallet(honeyConfig: Honey): Promise<[string, string]>;
export declare function checkEthBalance(address: string, chainPort: number): Promise<number | null>;
export declare function checkTokenBalance(walletAddress: string, chainPort: number, tokenAddress: string): Promise<number>;
export declare function checkSupersimReady(honeyConfig: Honey, timeoutSeconds?: number): Promise<boolean>;
export declare function runSupersim(honeyConfig: Honey): ChildProcess;
export declare function addTokensByAddress(walletAddress: string, tokenRequests: TokenRequest[], honeyConfig: Honey): Promise<void>;
export declare function checkTokenBalancesAllChains(walletAddress: string, honeyConfig: Honey): Promise<void>;
