import type { Easing, Point } from "../core/types.js"

export function tweenPoint(from: Point, to: Point, progress: number, easing: Easing): Point {
  const eased = easing(Math.max(0, Math.min(1, progress)))
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
  }
}
