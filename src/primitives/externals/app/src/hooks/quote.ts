// src commit 7033ad288c0bf70324bf7fd93e2af244d213cf79
import Graph from "graphology";
import { allSimpleEdgeGroupPaths } from "graphology-simple-path";
import AbstractGraph from "graphology-types";
import { Address } from "viem";
import { PoolForSwap } from "../../../../pools.js";
import { RouteElement, RoutePath, Token } from "./types.js";
import { DromeConfig } from "../../../../../config.js";
import { getChainConfig } from "../../../../utils.js";

/**
 * Returns pairs graph and a map of pairs to their addresses
 *
 * We build the edge keys using the pair address and the direction.
 */
export function buildGraph(
  pairs: PoolForSwap[],
  matchTokens: Address[] = []
): [AbstractGraph, Record<string, PoolForSwap>] {
  const graph = new Graph({ multi: true });
  const pairsByAddress: Record<Address, PoolForSwap & { address: Address }> = {};

  pairs.forEach((pair) => {
    const tokenA = pair.token0.toLowerCase();
    const tokenB = pair.token1.toLowerCase();
    const pairAddress = pair.lp.toLowerCase();
    pairsByAddress[pairAddress] = { ...pair, address: pairAddress };
    if (
      matchTokens.length &&
      !matchTokens.includes(tokenA) &&
      !matchTokens.includes(tokenB)
    ) {
      return;
    }

    graph.mergeEdgeWithKey(`direct:${pairAddress}`, tokenA, tokenB);
    graph.mergeEdgeWithKey(`reversed:${pairAddress}`, tokenB, tokenA);
  });

  return [graph, pairsByAddress];
}

/**
 * Generates possible routes from token A -> token B
 *
 * Based on the graph, returns a list of hops to get from tokenA to tokenB.
 *
 * Eg.:
 *  [
 *    [
 *      { fromA, toB, type, factory1 }
 *    ],
 *    [
 *      { fromA, toX, type, factory2 },
 *      { fromX, toB, type, factory1 }
 *    ],
 *    [
 *      { fromA, toY, type, factory1 },
 *      { fromY, toX, type, factory2 },
 *      { fromX, toB, type, factory1 }
 *    ]
 *  ]
 */
export function getPaths({
  config,
  chainId,
  pools,
  fromToken,
  toToken,
  maxHops,
  mustIncludeTokens,
  mustExcludeTokens,
}: {
  config: DromeConfig
  chainId: number;
  pools: PoolForSwap[];
  fromToken: Token;
  toToken: Token;
  maxHops?: number;
  mustIncludeTokens?: Set<Address>; // <-- nice for testing
  mustExcludeTokens?: Set<Address>; //     i.e. = new Set(["0x0b2c639c533813f4aa9d7837caf62653d097ff85"])
}): RoutePath[] {
  if (pools.length === 0 || !fromToken || !toToken) {
    return [];
  }

  const matchTokens: Address[] = [
    toToken?.wrappedAddress || toToken.address,
    fromToken?.wrappedAddress || fromToken.address,
    ...getChainConfig(config, chainId).CONNECTOR_TOKENS,
  ];
  let [graph, poolsByAddress] = buildGraph(pools, matchTokens);
  if (graph?.size < 1) {
    console.warn("getPaths: rebuilding graph");
    [graph, poolsByAddress] = buildGraph(pools); //rebuild without constraints
    if (graph?.size < 1) return [];
  }

  let graphPaths: string[][][] = [];

  try {
    graphPaths = allSimpleEdgeGroupPaths(
      graph,
      fromToken?.wrappedAddress || fromToken.address,
      toToken?.wrappedAddress || toToken.address,
      { maxDepth: maxHops ?? config.MAX_HOPS }
    );
  } catch (e) {
    return [];
  }

  const paths: RouteElement[][] = [];

  graphPaths.map((pathSet) => {
    let mappedPathSets: RouteElement[][] = [];

    pathSet.map((pairAddresses, index) => {
      const currentMappedPathSets: RouteElement[][] = [];
      pairAddresses.map((pairAddressWithDirection) => {
        const [dir, pairAddress] = pairAddressWithDirection.split(":");
        const pool = poolsByAddress[pairAddress];
        const routeComponent: RouteElement = {
          from: pool.token0,
          to: pool.token1,
          type: pool.type,
          lp: pool.lp,
          factory: pool.factory,
          pool_fee: pool.pool_fee,
          chainId,
        };
        if (dir === "reversed") {
          routeComponent.from = pool.token1;
          routeComponent.to = pool.token0;
        }

        if (index == 0) {
          currentMappedPathSets.push([routeComponent]);
        } else {
          mappedPathSets.map((incompleteSet) => {
            currentMappedPathSets.push(incompleteSet.concat([routeComponent]));
          });
        }
      });

      mappedPathSets = [...currentMappedPathSets];
    });
    paths.push(...mappedPathSets);
  });

  return paths
    .filter((nodes) => {
      // further filter quotes in respect to mustIncludeTokens and mustExcludeTokens
      // this is super useful when we need to hit specific quotes for testing/bug fighting operations

      const tokens = Array.from(
        nodes
          .reduce((set, n) => {
            set.add(n.from.toLowerCase());
            set.add(n.to.toLowerCase());
            return set;
          }, new Set<Address>())
          .values()
      );

      const includesMet = mustIncludeTokens
        ? tokens.some((address) => mustIncludeTokens.has(address))
        : true;

      const excludesMet = mustExcludeTokens
        ? !tokens.some((address) => mustExcludeTokens.has(address))
        : true;

      return includesMet && excludesMet;
    })
    .map((p) => ({ nodes: p }));
}
