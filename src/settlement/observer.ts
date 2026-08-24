import type { Point, ScrollPlatform, ScrollSurface, SettlementOptions } from "../core/types.js";
import { ScrollAbortError, throwIfAborted } from "../core/errors.js";
import { RafController } from "../runtime/controller.js";

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function waitForSettlement(
  surface: ScrollSurface,
  platform: ScrollPlatform,
  frames: RafController,
  options: SettlementOptions = {},
  signal?: AbortSignal,
): Promise<Point> {
  throwIfAborted(signal);
  const stableFrames = options.stableFrames ?? 2;
  const threshold = options.threshold ?? 0.5;
  const quietMs = options.quietMs ?? 80;
  const timeout = options.timeout ?? 3000;
  let previous = platform.readScroll(surface);
  let stable = 0;
  let stableSince: number | undefined;
  let started: number | undefined;

  return new Promise<Point>((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener("abort", abort);
    const abort = () => {
      frames.delete(tick);
      cleanup();
      reject(new ScrollAbortError());
    };
    const tick = (time: number): boolean => {
      started ??= time;
      const current = platform.readScroll(surface);
      if (distance(previous, current) <= threshold) {
        stable += 1;
        stableSince ??= time;
      } else {
        stable = 0;
        stableSince = undefined;
      }
      previous = current;
      if (stable >= stableFrames && stableSince !== undefined && time - stableSince >= quietMs) {
        cleanup();
        resolve(current);
        return false;
      }
      if (time - started >= timeout) {
        cleanup();
        resolve(current);
        return false;
      }
      return true;
    };
    signal?.addEventListener("abort", abort, { once: true });
    frames.add(tick);
  });
}
