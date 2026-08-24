import type { DurationOption } from "../core/types.js";

export function adaptiveDuration(distance: number, min = 160, max = 750, velocity = 1800): number {
  if (distance <= 0) return 0;
  const range = max - min;
  return min + range * (1 - Math.exp(-distance / Math.max(1, velocity)));
}

export function resolveDuration(option: DurationOption | undefined, distance: number): number {
  if (typeof option === "number") return Math.max(0, option);
  if (!option || option === "auto") return adaptiveDuration(distance);
  return adaptiveDuration(distance, option.min, option.max, option.velocity);
}
