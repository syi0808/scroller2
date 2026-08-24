import { describe, expect, it } from "vitest";
import {
  adaptiveDuration,
  effectiveViewport,
  measureVisibility,
  planSurfaceReveal,
} from "../src/index.js";
import type { Rect, ScrollMetrics } from "../src/index.js";

const bounds = (top: number, right: number, bottom: number, left: number): Rect => ({
  top,
  right,
  bottom,
  left,
  width: right - left,
  height: bottom - top,
});

const metrics: ScrollMetrics = {
  viewport: bounds(0, 100, 100, 0),
  scroll: { x: 0, y: 0 },
  min: { x: 0, y: 0 },
  max: { x: 500, y: 500 },
  axes: { x: true, y: true },
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
};

describe("pure reveal planning", () => {
  it("uses the minimum nearest-alignment movement", () => {
    const step = planSurfaceReveal({
      surface: {} as Element,
      target: bounds(120, 70, 150, 20),
      viewport: metrics.viewport,
      metrics,
      block: "nearest",
      inline: "nearest",
      visibility: "full",
    });
    expect(step.to).toEqual({ x: 0, y: 50 });
    expect(step.axes).toEqual(["y"]);
  });

  it("does not move a target satisfying its visibility policy", () => {
    const step = planSurfaceReveal({
      surface: {} as Element,
      target: bounds(80, 80, 130, 20),
      viewport: metrics.viewport,
      metrics,
      block: "nearest",
      inline: "nearest",
      visibility: "any",
    });
    expect(step.axes).toEqual([]);
  });

  it("combines viewport insets", () => {
    expect(
      effectiveViewport(
        bounds(0, 500, 400, 0),
        { top: 10, right: 10, bottom: 10, left: 10 },
        { top: 50, right: 100, bottom: 0, left: 0 },
        { top: 5, right: 5, bottom: 5, left: 5 },
      ),
    ).toEqual(bounds(65, 385, 385, 15));
  });

  it("reports best-effort visibility for oversized targets", () => {
    const visibility = measureVisibility(bounds(-50, 200, 150, -100), metrics.viewport);
    expect(visibility.fullyVisible).toBe(false);
    expect(visibility.visibilityRatio).toBeCloseTo(1 / 6);
  });
});

describe("adaptive duration", () => {
  it("is monotonic and saturates at its maximum", () => {
    const durations = [100, 400, 1000, 5000].map((distance) => adaptiveDuration(distance));
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
    expect(durations[0]).toBeGreaterThanOrEqual(160);
    expect(durations[3]).toBeLessThan(750);
  });
});
