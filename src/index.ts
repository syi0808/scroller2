export { createScrollEngine } from "./engine.js"
export { BrowserScrollPlatform } from "./platform/browser-adapter.js"
export { FrameCachedScrollPlatform } from "./platform/frame-cache.js"
export { discoverScrollChain } from "./surface/discover-scroll-chain.js"
export { planSurfaceReveal } from "./reveal/planner.js"
export { effectiveViewport } from "./reveal/effective-viewport.js"
export { measureVisibility, satisfiesVisibility } from "./geometry/visibility.js"
export { adaptiveDuration, resolveDuration } from "./motion/duration.js"
export { easeIn, easeInOut, easeOut, linear } from "./motion/easing.js"
export { lerpPoint, lerpProgress } from "./motion/lerp.js"
export { tweenPoint } from "./motion/tween.js"
export { ScrollAbortError } from "./core/errors.js"
export type * from "./core/types.js"

import { createScrollEngine } from "./engine.js"

export function reveal(target: Element, options?: import("./core/types.js").RevealOptions) {
  const engine = createScrollEngine()
  return engine.reveal(target, options).finally(() => engine.destroy())
}
