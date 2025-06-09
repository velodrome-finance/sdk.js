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

/*
 * Sorts an array of objects by the order of another array.
 */
export function sortByIdx<T>(list: T[], a: T, b: T) {
  const aIndex = list.indexOf(a);
  const bIndex = list.indexOf(b);
  const aIn = aIndex !== -1;
  const bIn = bIndex !== -1;
  if (aIn && bIn) {
    if (aIndex !== bIndex) return aIndex - bIndex;
  } else if (aIn !== bIn) {
    return aIn ? -1 : 1;
  }
}