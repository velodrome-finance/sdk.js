// src commit 7033ad288c0bf70324bf7fd93e2af244d213cf79
import { Address } from "viem";

// An extended ERC-20 type to address our needs

// Mainly:
//  * works with native tokens which require a wrapped address
//  * provides for additional attributes from `LpToken` (on-chain token data)
//  * provides for internal cached attributes like price, balance ($-value)
export type Token = Readonly<{
  chainId: number;
  address: Address;
  // diff- name?: string;
  // diff- symbol: string;
  listed: boolean;
  decimals: number;
  // diff- balance: bigint;
  price: bigint;
  // diff- balanceValue: bigint;
  wrappedAddress?: Address;
}>;

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

/*
  In swaps, Quote gives you the following info:

    <amount> of <fromToken> is quoted in <amountOut> of <toToken>

  and to get there you need to follows <nodes> inside <path>
*/
export type Quote = {
  path: RoutePath;
  amount: bigint;
  amountOut: bigint;
  fromToken: Token;
  toToken: Token;
  priceImpact: bigint;
};
