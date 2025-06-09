// src commit 7033ad288c0bf70324bf7fd93e2af244d213cf79
import { Address, encodePacked } from "viem";
import { RouteElement } from "./types.js";
import { DromeConfig } from "../../../../../config.js";

export function prepareRoute(config: DromeConfig, nodes: RouteElement[]): {
  types: string[];
  values: (Address | number)[];
} {
  return {
    types: [
      ...[...Array(nodes.length)]
        .map(() => ["address", "int24"])
        .reduce((s, pool) => [...s, ...pool], []),
      "address",
    ],
    values: nodes.reduce(
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
    ),
  };
}

export function packRoute(config: DromeConfig, nodes: RouteElement[]) {
  const { types, values } = prepareRoute(config, nodes);
  return encodePacked(types, values);
}