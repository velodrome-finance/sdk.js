import { expect, test } from "vitest";
import { getDromeConfig } from "@/lib/test-helpers";
import { RouteElement } from "./types.js";
import { prepareRoute } from "./lib";

test("Prepare route", async () => {
  const v2Nodes: RouteElement[] = [
    {
      from: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
      to: "0x920Cf626a271321C151D027030D5d08aF699456b",
      type: -1,
      factory: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
      lp: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF6b",
      pool_fee: 0n,
      chainId: 10,
    },
    {
      from: "0x920Cf626a271321C151D027030D5d08aF699456b",
      to: "0x4200000000000000000000000000000000000042",
      type: -1,
      factory: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
      lp: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF6b",
      pool_fee: 0n,
      chainId: 10,
    },
  ];
  //for a quote
  expect(prepareRoute(await getDromeConfig(), v2Nodes, "quote")).toEqual({
    types: ["address", "int24", "address", "int24", "address"],
    values: [
      "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
      4194304,
      "0x920Cf626a271321C151D027030D5d08aF699456b",
      4194304,
      "0x4200000000000000000000000000000000000042",
    ],
  });
  //for a quote
  expect(
    prepareRoute(
      await getDromeConfig(),
      [
        {
          from: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
          to: "0x323665443CEf804A3b5206103304BD4872EA4253",
          type: -1,
          factory: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
          lp: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF6b",
          pool_fee: 0n,
          chainId: 10,
        },
        {
          from: "0x323665443CEf804A3b5206103304BD4872EA4253",
          to: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
          type: 20,
          factory: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
          lp: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF6b",
          pool_fee: 0n,
          chainId: 10,
        },
        {
          from: "0x7f5c764cbc14f9669B88837ca1490cca17c31607",
          to: "0x4200000000000000000000000000000000000042",
          type: 0,
          factory: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
          lp: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF6b",
          pool_fee: 0n,
          chainId: 10,
        },
      ],
      "quote"
    )
  ).toEqual({
    values: [
      "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
      4194304,
      "0x323665443CEf804A3b5206103304BD4872EA4253",
      20,
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      2097152,
      "0x4200000000000000000000000000000000000042",
    ],
    types: [
      "address",
      "int24",
      "address",
      "int24",
      "address",
      "int24",
      "address",
    ],
  });

  //for a v2 swap command
  expect(prepareRoute(await getDromeConfig(), v2Nodes, "swap")).toEqual({
    types: ["address", "bool", "address", "bool", "address"],
    values: [
      "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
      false,
      "0x920Cf626a271321C151D027030D5d08aF699456b",
      false,
      "0x4200000000000000000000000000000000000042",
    ],
  });
});
