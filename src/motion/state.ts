import type { MotionOptions, MotionPreset } from "../core/types.js";
import { easeOut } from "./easing.js";

export function resolveMotion(motion: MotionOptions | MotionPreset | undefined): MotionOptions {
  if (!motion || motion === "smooth") return { type: "tween", duration: "auto", easing: easeOut };
  if (motion === "instant") return { type: "instant" };
  if (motion === "snappy")
    return {
      type: "tween",
      duration: { type: "adaptive", min: 120, max: 420, velocity: 1200 },
      easing: easeOut,
    };
  if (motion === "gentle")
    return {
      type: "tween",
      duration: { type: "adaptive", min: 240, max: 900, velocity: 2200 },
      easing: easeOut,
    };
  return motion;
}
