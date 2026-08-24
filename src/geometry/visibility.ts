import type { Rect, VisibilityPolicy, VisibilitySnapshot } from "../core/types.js";
import { intersectRect } from "./rect.js";

export function measureVisibility(target: Rect, viewport: Rect): VisibilitySnapshot {
  const intersection = intersectRect(target, viewport);
  const visibleArea = intersection.width * intersection.height;
  const targetArea = target.width * target.height;
  const visibilityRatio = targetArea === 0 ? 1 : visibleArea / targetArea;
  return Object.freeze({
    visibleArea,
    targetArea,
    visibilityRatio,
    fullyVisible:
      target.top >= viewport.top &&
      target.right <= viewport.right &&
      target.bottom <= viewport.bottom &&
      target.left >= viewport.left,
  });
}

export function satisfiesVisibility(
  snapshot: VisibilitySnapshot,
  policy: VisibilityPolicy,
): boolean {
  if (policy === "any") return snapshot.visibleArea > 0;
  if (policy === "full") return snapshot.fullyVisible;
  return snapshot.visibilityRatio >= Math.max(0, Math.min(1, policy.ratio));
}
