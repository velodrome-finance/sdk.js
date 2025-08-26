// src commit efc754bec699419b901397e63d23efe996ff4ca0
import { formatNumber } from "../lib/helpers.js";

/**
 * Returns a new amount with applied slippage percentage
 *
 * Base `pct` default to 0.
 * If you set `slippage` to 0 and use an arbitrary `pct` you can apply directly
 * a percentage to the `amount`.
 */
export function applyPct(
  amount: bigint,
  wad: number,
  slippage: string | number,
  percentage = "100"
): bigint {
  if (slippage === 0 && percentage === "100") return amount;

  // TODO: there might be a number only way to do this
  const [integerPart, fractionalPart = ""] = formatNumber(
    Number(percentage)
  ).split(".");
  const fracPadded = fractionalPart.padEnd(wad, "0").slice(0, wad);

  const pct = BigInt(integerPart + fracPadded);

  const hundredScale = 100n * 10n ** BigInt(wad);
  const result = (amount * pct) / hundredScale;

  if (slippage === 0 || slippage === "0") {
    return result;
  } else {
    return (
      mulUnsafe(amount, 1n, wad, 0, wad) -
      applyPct(result, wad, 0, slippage.toString())
    );
  }
}

/**
 * Returns the percentage of two numbers
 */
export function pctOf(base: bigint, amount: bigint, wad: number, decimals: Boolean = false): bigint {
  if (base === 0n) return 0n;
  const numerator = amount * (decimals? 1n : 100n) * 10n ** BigInt(wad);
  return numerator / base;
}

/**
 * Returns the division of two big numbers
 */
export function divUnsafe(
  x: bigint,
  y: bigint,
  wadX = 18,
  wadY = 18,
  wad = 18
): bigint {
  if (x === 0n || y === 0n) return 0n;
  const denominator = y * 10n ** BigInt(wadX);
  const numerator = x * 10n ** (BigInt(wadY) + BigInt(wad));
  return numerator / denominator;
}

/**
 * Returns the multiplication of two big numbers
 */
export function mulUnsafe(
  x: bigint,
  y: bigint,
  wadX = 18,
  wadY = 18,
  wad = 18
): bigint {
  if (x === 0n || y === 0n) return 0n;
  const numerator = x * y * 10n ** BigInt(wad);
  const denominator = 10n ** (BigInt(wadX) + BigInt(wadY));
  return numerator / denominator;
}
