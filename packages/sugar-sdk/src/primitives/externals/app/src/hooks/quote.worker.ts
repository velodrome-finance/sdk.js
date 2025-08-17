// src commit efc754bec699419b901397e63d23efe996ff4ca0
import { formatUnits, parseEther } from "viem";
import { divUnsafe, mulUnsafe, pctOf } from "./math.js";
import { Quote } from "./types.js";

/**
 *   Calculates the price impact for a quote
 */
function calcPriceImpact(quote: Quote) {
  const { fromToken, toToken, amount, amountOut } = quote;

  // Estimated amount based on the on-chain oracle exchange rate
  const estAmount = mulUnsafe(
    amount,
    divUnsafe(fromToken.price, toToken.price),
    fromToken.decimals
  );
  // Bring quoted amount to the same decimals base aka 18, eg. for USDC
  const execAmount = parseEther(formatUnits(amountOut, toToken.decimals));

  return pctOf(estAmount, estAmount - execAmount, 18, true);
}

const oneHundredPercent = 100n * 10n ** 18n;
function impactTooHigh(q: Quote): boolean {
  if (!q.toToken.listed || !q.fromToken.listed) return false;
  const impact = calcPriceImpact(q);
  const abs = impact < 0n ? -impact : impact;
  return abs >= oneHundredPercent;
}

export function getBestQuote(quotes: Quote[][]): Quote | null {
  const bestQuote: Quote | null = quotes.flat().reduce(
    (best, quote) => {
      if (!best) {
        return quote;
      } else {
        return best.amountOut > quote.amountOut || impactTooHigh(quote)
          ? best
          : quote;
      }
    },
    null as Quote | null
  );

  if (!bestQuote) {
    return null;
  }

  return {
    ...bestQuote,
    priceImpact: calcPriceImpact(bestQuote),
  };
}