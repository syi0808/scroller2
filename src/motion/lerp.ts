import type { Point } from "../core/types.js";

export function lerpProgress(factor: number, elapsed: number): number {
  const normalized = Math.max(0.001, Math.min(1, factor));
  return 1 - (1 - normalized) ** Math.max(1, elapsed / (1000 / 60));
}

export function lerpPoint(from: Point, to: Point, factor: number, elapsed: number): Point {
  const progress = lerpProgress(factor, elapsed);
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}
