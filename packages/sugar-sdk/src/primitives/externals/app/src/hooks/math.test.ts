import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { expect, test } from "vitest";

import {
  applyPct,
  divUnsafe,
  
  mulUnsafe,
  pctOf,
  
} from "./math";

test("#divUnsafe", () => {
  //dividing by zero always returns zero
  expect(divUnsafe(5n, 0n)).toEqual(0n);
  expect(divUnsafe(0n, 2n)).toEqual(0n);

  //fractions are rounded down
  expect(divUnsafe(5n, 11n, 18, 18, 0).toString()).toEqual("0");
  expect(divUnsafe(5n, 10n, 18, 18, 0).toString()).toEqual("0");

  //defaults to 18 decimals
  expect(divUnsafe(6n, 3n)).toEqual(2000000000000000000n);
  expect(divUnsafe(10n, 2n)).toEqual(5000000000000000000n);

  expect(divUnsafe(6n, 3n, 0, 0, 0)).toEqual(2n);
  expect(divUnsafe(10n, 2n, 0, 0, 0)).toEqual(5n);
  expect(
    divUnsafe(
      384681768835012680000899740262072005112472362467596825n,
      3287878366111219487187177267197196624892926174936725n,
      0,
      0,
      0
    )
  ).toEqual(117n);
  expect(
    divUnsafe(
      2722601659614307766237800482268860619704000n,
      3558956417796480740180131349371059633600n,
      0,
      0,
      0
    )
  ).toEqual(765n);
  expect(
    divUnsafe(
      2722601659614307766237800482268860619704000n,
      3558956417796480740180131349371059633600n,
      17,
      18,
      0
    )
  ).toEqual(7650n);
});

test("#mulUnsafe", () => {
  expect(mulUnsafe(5n, 0n)).toEqual(0n);

  expect(mulUnsafe(60n, 30n, 1, 1)).toEqual(18000000000000000000n);

  expect(mulUnsafe(6n, 3n, 0, 0, 0)).toEqual(18n);
  expect(mulUnsafe(12n, 2n, 0, 0, 0)).toEqual(24n);
  expect(mulUnsafe(3846817467596825n, 4892926174936725n, 8, 9, 18)).toEqual(
    188221938774083120141321858981250n
  );
  expect(mulUnsafe(2004822688606197n, 9648074018013134n, 9, 9, 9)).toEqual(
    19342677692664685250681n
  );
  expect(
    mulUnsafe(6623780048226886061n, 1349371053339633600n, 17, 18, 0)
  ).toEqual(89n);
});

test("#applyPct", async () => {
  expect(applyPct(parseEther("1"), 18, 10)).toEqual(parseEther("0.9"));
  expect(applyPct(parseEther("1"), 18, 0, "10")).toEqual(parseEther("0.1"));

  expect(applyPct(parseEther("1"), 18, "10.00000000000001")).toEqual(
    parseEther("1") - parseEther("0.1000000000000001")
  );

  expect(applyPct(parseEther("1"), 18, 0, "10.00000000000001")).toEqual(
    parseEther("0.1000000000000001")
  );
});

test("#pctOf", async () => {
  expect(pctOf(parseEther("1"), parseEther("0.01"), 0)).toEqual(1n);
  expect(pctOf(parseEther("1"), parseEther("0.01"), 18)).toEqual(
    parseEther("1")
  );
  expect(pctOf(parseUnits("0.01", 8), parseUnits("1", 8), 8)).toEqual(
    parseUnits("10000", 8)
  );
  expect(pctOf(parseUnits("0.01", 8), parseUnits("1", 8), 12)).toEqual(
    parseUnits("10000", 12)
  );

  // get percentage in decimals
  expect(pctOf(parseEther("1"), parseEther("0.01"), 18, true)).toEqual(parseEther("0.01"));
});