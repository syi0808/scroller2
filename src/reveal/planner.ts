import type {
  Alignment,
  Point,
  Rect,
  ScrollMetrics,
  ScrollPlanStep,
  ScrollSurface,
  VisibilityPolicy,
} from "../core/types.js";
import { clamp } from "../geometry/rect.js";
import { measureVisibility, satisfiesVisibility } from "../geometry/visibility.js";
import { alignmentDelta } from "./alignment.js";

export interface SurfacePlanInput {
  readonly surface: ScrollSurface;
  readonly target: Rect;
  readonly viewport: Rect;
  readonly metrics: ScrollMetrics;
  readonly block: Alignment;
  readonly inline: Alignment;
  readonly visibility: VisibilityPolicy;
}

export function planSurfaceReveal(input: SurfacePlanInput): ScrollPlanStep {
  const before = measureVisibility(input.target, input.viewport);
  const satisfied = satisfiesVisibility(before, input.visibility);
  const deltaX =
    satisfied || !input.metrics.axes.x
      ? 0
      : alignmentDelta(
          input.target.left,
          input.target.right,
          input.viewport.left,
          input.viewport.right,
          input.inline,
        );
  const deltaY =
    satisfied || !input.metrics.axes.y
      ? 0
      : alignmentDelta(
          input.target.top,
          input.target.bottom,
          input.viewport.top,
          input.viewport.bottom,
          input.block,
        );
  const to: Point = Object.freeze({
    x: clamp(input.metrics.scroll.x + deltaX, input.metrics.min.x, input.metrics.max.x),
    y: clamp(input.metrics.scroll.y + deltaY, input.metrics.min.y, input.metrics.max.y),
  });
  const axes = [] as ("x" | "y")[];
  if (to.x !== input.metrics.scroll.x) axes.push("x");
  if (to.y !== input.metrics.scroll.y) axes.push("y");
  const from = Object.freeze({ ...input.metrics.scroll });
  return Object.freeze({ surface: input.surface, from, to, axes: Object.freeze(axes) });
}
