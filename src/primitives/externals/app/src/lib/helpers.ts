// src commit efc754bec699419b901397e63d23efe996ff4ca0
/**
 * Formats a number without scientific notation
 */
export function formatNumber(
  value: number,
  {
    maxDecimals,
    minDecimals,
  }: { maxDecimals?: number; minDecimals?: number } = {}
): string {
  return value.toLocaleString("en-US", {
    useGrouping: false,
    ...({ roundingMode: "trunc" } as any),
    minimumFractionDigits: minDecimals ?? 0,
    maximumFractionDigits: maxDecimals ?? 16,
  });
}