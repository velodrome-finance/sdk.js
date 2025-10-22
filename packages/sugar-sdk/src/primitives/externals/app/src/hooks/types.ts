// src commit 7033ad288c0bf70324bf7fd93e2af244d213cf79
import { Address } from "viem";

/**
 * Represents a token tracked by the Sugar SDK, enriched with metadata and cached values.
 *
 * @property {number} chainId - Chain identifier where the token exists
 * @property {Address} address - Token contract address (lowercased)
 * @property {string | undefined} name - Optional human-readable token name
 * @property {string} symbol - Short ticker symbol displayed in UI
 * @property {boolean} listed - Indicates whether the token is discoverable via the SDK
 * @property {number} decimals - Number of decimal places used by the token
 * @property {bigint} balance - Current account balance for the token
 * @property {bigint} price - USD price scaled according to SDK conventions
 * @property {bigint} balanceValue - USD value of the current balance
 * @property {Address | undefined} wrappedAddress - Optional wrapped representation when the token is native
 */
export type Token = Readonly<{
  chainId: number;
  address: Address;
  name?: string;
  symbol: string;
  listed: boolean;
  decimals: number;
  balance: bigint;
  price: bigint;
  balanceValue: bigint;
  wrappedAddress?: Address;
}>;

export type SuperchainKey = `${number}:${Address}`;

export interface Tokens {
  [k: SuperchainKey]: Token;
  all: Record<SuperchainKey, Token>;
  sorted: Token[];
  // Native token reference
  native: Record<number, Token | undefined>;
  // Wrapped native token reference
  wrapped: Record<number, Token | undefined>;
  //grouped by symbol and sorted
  grouped: Token[][];
}

/*
  In swaps, RouteElement is derived from a pool. It represents a hop in a chain of conversions
*/
export type RouteElement = {
  from: Address;
  to: Address;
  lp: Address;
  factory: Address;
  type: number;
  pool_fee: bigint;
  chainId: number;
};

/*
  In swaps, RoutePath is a collection of hops to get from source token to target token
*/
export type RoutePath = {
  nodes: RouteElement[];
};

/**
 * Describes the result of quoting a swap, including the path and pricing metadata.
 *
 * @property {RoutePath} path - Ordered list of hops required to execute the swap
 * @property {bigint} amount - Input token amount for the quote
 * @property {bigint} amountOut - Expected output token amount
 * @property {Token} fromToken - Metadata for the input token
 * @property {Token} toToken - Metadata for the output token
 * @property {bigint} priceImpact - Estimated price impact in basis points
 * @property {Address} spenderAddress - Address that must be approved to spend the input token
 */
export type Quote = {
  path: RoutePath;
  amount: bigint;
  amountOut: bigint;
  fromToken: Token;
  toToken: Token;
  priceImpact: bigint;
  spenderAddress: Address;
};
