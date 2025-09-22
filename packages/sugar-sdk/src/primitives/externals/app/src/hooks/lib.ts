// src commit 7033ad288c0bf70324bf7fd93e2af244d213cf79
import { Address, encodePacked } from "viem";
import { RouteElement } from "./types.js";
import { Config } from "../../../../../config.js";

export const poolTypes = {
  basic: (type: number) => type === 0 || type === -1,
  concentrated: (type: number) => type > 50 || (type > 0 && type <= 50),
  volatile: (type: number) => type === -1 || type > 50,
  stable: (type: number) => type === 0 || (type > 0 && type <= 50),
} as const;

export function prepareRoute(
  config: Config,
  nodes: RouteElement[],
  type: "swap" | "quote"
): {
  types: string[];
  values: (Address | number | boolean)[];
} {
  // in each swap command, nodes are always grouped by pool type
  const isV2Swap =
    type === "swap" && nodes.some((n) => poolTypes.basic(n.type));
  const types = [
    ...[...Array(nodes.length)]
      .map(() => ["address", "int24"])
      .reduce((s, pool) => [...s, ...pool], []),
    "address",
  ];
  const values = nodes.reduce(
    (s, pool) => {
      // For basic pools use specific filler values
      let filler =
        Number(pool.type) === 0
          ? config.QUOTER_STABLE_POOL_FILLER
          : config.QUOTER_VOLATILE_POOL_FILLER;

      // CL pools filler is the same as their type aka tick space...
      if (Number(pool.type) > 0) {
        filler = Number(pool.type);
      }

      return s.length === 0
        ? [pool.from, filler, pool.to]
        : [...s, filler, pool.to];
    },
    [] as (Address | number)[]
  );

  if (isV2Swap) {
    // replace all `int24`s with `bool`s
    return {
      types: types.map((t) => (t === "int24" ? "bool" : t)),
      // replace all static filter vals with booleans
      values: values.map((v) => {
        if (v === config.QUOTER_STABLE_POOL_FILLER) return true;
        if (v === config.QUOTER_VOLATILE_POOL_FILLER) return false;
        return v;
      }),
    };
  }

  return {
    types,
    values,
  };
}

export function packRoute(
  config: Config,
  nodes: RouteElement[],
  type: "swap" | "quote" = "swap"
) {
  const { types, values } = prepareRoute(config, nodes, type);
  return encodePacked(types, values);
}
