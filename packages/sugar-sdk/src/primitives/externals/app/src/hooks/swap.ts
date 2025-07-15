// src commit efc754bec699419b901397e63d23efe996ff4ca0
import { Address, hexToBigInt } from "viem";
import { CommandType, RoutePlanner } from "../lib/router.js";
import { packRoute } from "./lib";
import { applyPct } from "./math";
import { Quote, RouteElement } from "./types";
import { DromeConfig } from "../../../../../config.js";
import { getChainConfig } from "../../../../utils.js";

// this is used to indicate "all available funds" for in-between trades with v3 pools
export const CONTRACT_BALANCE_FOR_V3_SWAPS = hexToBigInt(
  "0x8000000000000000000000000000000000000000000000000000000000000000"
);

export const setupPlanner = ({
  config,
  chainId,
  account,
  quote,
  slippagePct,
  routePlanner = new RoutePlanner(),
}: {
  config: DromeConfig
  chainId: number;
  account?: Address;
  quote: Quote;
  slippagePct: string;
  routePlanner?: RoutePlanner;
}): RoutePlanner => {
  const routerAddress = getChainConfig(config, chainId).UNIVERSAL_ROUTER_ADDRESS;
  const minAmountOut = applyPct(
    quote.amountOut,
    quote.toToken.decimals,
    slippagePct
  );
  // be default money comes from contract
  let tokensComeFromContract = false;

  if (quote.fromToken.wrappedAddress) {
    // when trading from native token
    // - wrap token first
    // - make sure we let next commands know that the money comes from
    //   contract (since it's wrapped first and kept inside contract)
    routePlanner.addCommand(CommandType.WRAP_ETH, [
      routerAddress,
      quote.amount,
    ]);
    tokensComeFromContract = true;
  }

  // let's store grouped nodes here
  // we want nodes belonging to the same type of pool grouped together
  // e.g. v2s -> v3s -> v2s -> v3s
  const groupedNodes: RouteElement[][] = [];

  for (let i = 0; i < quote.path.nodes.length; i++) {
    const node = quote.path.nodes[i];

    const last = groupedNodes.at(-1);
    if (!last) {
      // no batches added yet, let's go
      groupedNodes.push([node]);
    } else if (Number(node.type) < 1) {
      // current node is a v2 pool
      if (Number(last[0].type) < 1) {
        // current batch is a v2 as well
        last.push(node);
      } else {
        groupedNodes.push([node]);
      }
    } else {
      // current node is a v3 pool
      if (Number(last[0].type) >= 1) {
        // current batch is a v3 as well
        last.push(node);
      } else {
        groupedNodes.push([node]);
      }
    }
  }

  if (groupedNodes.length === 1) {
    // this is the easy way out - all nodes belong to the same type of pool
    // let's apply good ol' V2/V3_SWAP_EXACT_IN and be done with it

    const nodes = groupedNodes[0];
    const isV2Pool = Number(nodes[0].type) < 1;

    routePlanner.addCommand(
      isV2Pool ? CommandType.V2_SWAP_EXACT_IN : CommandType.V3_SWAP_EXACT_IN,
      [
        // where should money go?
        // normally to the customer's wallet, unless we need to do some ETH unwrapping at the end
        quote.toToken.wrappedAddress ? routerAddress : account,
        quote.amount,
        minAmountOut,
        isV2Pool
          ? nodes.map((n) => ({
              from: n.from,
              to: n.to,
              stable: Number(n.type) === 0,
            }))
          : packRoute(config, nodes),
        !tokensComeFromContract,
      ]
    );
  } else {
    // ok, things are about to get ugly
    // got ourselves a mix of v2s and v3s
    // let's sort through this shitcoin festival

    const [firstBatch, ...lastBatchAndMaybeSmthElse] = groupedNodes;
    const [lastBatch, ...rest] = lastBatchAndMaybeSmthElse.reverse();
    // re-reverse in-between batches
    rest.reverse();

    // let's take care of our first batch

    const isFirstBatchV2 = Number(firstBatch[0].type) < 1;
    const nextBatch = rest.length !== 0 ? rest[0] : lastBatch;

    routePlanner.addCommand(
      isFirstBatchV2
        ? CommandType.V2_SWAP_EXACT_IN
        : CommandType.V3_SWAP_EXACT_IN,
      [
        // we definitely need to send the first batch to the router
        // since it will be dealing with the money for the any batches after the first one
        // off to the router it goes 🚂
        isFirstBatchV2 ? routerAddress : nextBatch[0].lp,
        quote.amount,
        // no expectations on the min amount out
        0n,
        isFirstBatchV2
          ? firstBatch.map((n) => ({
              from: n.from,
              to: n.to,
              stable: Number(n.type) === 0,
            }))
          : packRoute(config, firstBatch),
        !tokensComeFromContract,
      ]
    );

    if (rest.length !== 0) {
      // take care of in-between batches
      //              |
      //              V
      // first_batch, ... last_batch
      rest.forEach((batch, idx) => {
        const isBatchV2 = Number(batch[0].type) < 1;
        const nextBatch =
          idx + 1 <= rest.length - 1 ? rest[idx + 1] : lastBatch;

        routePlanner.addCommand(
          isBatchV2
            ? CommandType.V2_SWAP_EXACT_IN
            : CommandType.V3_SWAP_EXACT_IN,
          [
            isBatchV2 ? routerAddress : nextBatch[0].lp,
            // we have no idea how much money is coming in
            isBatchV2 ? 0n : CONTRACT_BALANCE_FOR_V3_SWAPS,
            // no idea how much money is coming out, so no expectations
            0n,
            isBatchV2
              ? batch.map((n) => ({
                  from: n.from,
                  to: n.to,
                  stable: Number(n.type) === 0,
                }))
              : packRoute(config, batch),
            // money comes from the contract
            false,
          ]
        );
      });
    }

    // lets take care of our last batch

    const isLastBatchV2 = Number(lastBatch[0].type) < 1;

    routePlanner.addCommand(
      isLastBatchV2
        ? CommandType.V2_SWAP_EXACT_IN
        : CommandType.V3_SWAP_EXACT_IN,
      [
        // destination depends on the toToken - if unwrap needed, then keep money in the router
        // else send all this sweet sweet moolah directly to the customer
        quote.toToken.wrappedAddress ? routerAddress : account,
        // we have no idea how much money is coming in
        isLastBatchV2 ? 0n : CONTRACT_BALANCE_FOR_V3_SWAPS,
        // we want at least minAmount out back
        minAmountOut,
        isLastBatchV2
          ? lastBatch.map((n) => ({
              from: n.from,
              to: n.to,
              stable: Number(n.type) === 0,
            }))
          : packRoute(config, lastBatch),
        false,
      ]
    );
  }

  if (quote.toToken.wrappedAddress) {
    routePlanner.addCommand(CommandType.UNWRAP_WETH, [account, minAmountOut]);
  }

  return routePlanner;
};
