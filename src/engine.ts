import type { ExecutedScrollStep, Point, RevealOptions, RevealResult, ScrollEngine, ScrollEngineOptions, ScrollOptions, ScrollPlanStep, ScrollSurface } from "./core/types.js"
import { throwIfAborted } from "./core/errors.js"
import { resolveInsets } from "./geometry/insets.js"
import { expandRect } from "./geometry/rect.js"
import { Animator } from "./motion/animator.js"
import { resolveMotion } from "./motion/state.js"
import { BrowserScrollPlatform } from "./platform/browser-adapter.js"
import { FrameCachedScrollPlatform } from "./platform/frame-cache.js"
import { createRevealPlan, readRevealContext } from "./reveal/browser-planner.js"
import { effectiveViewport } from "./reveal/effective-viewport.js"
import { planSurfaceReveal } from "./reveal/planner.js"
import { RafController } from "./runtime/controller.js"
import { ScrollExecutor } from "./execution/executor.js"

function isWindow(surface: ScrollSurface): surface is Window {
  return "window" in surface && surface.window === surface
}

export function createScrollEngine(options: ScrollEngineOptions = {}): ScrollEngine {
  const platform = new FrameCachedScrollPlatform(options.platform ?? new BrowserScrollPlatform())
  const now = options.now ?? (() => typeof performance === "undefined" ? Date.now() : performance.now())
  const frames = new RafController(options.autoRaf ?? true)
  const animator = new Animator(platform, frames)
  const executor = new ScrollExecutor(platform, animator, frames, now)
  const inputView = typeof window === "undefined" ? undefined : window
  const operations = new Set<AbortController>()
  const interrupt = () => {
    for (const controller of operations) controller.abort()
    animator.cancel()
  }
  inputView?.addEventListener("wheel", interrupt, { capture: true, passive: true })
  inputView?.addEventListener("touchstart", interrupt, { capture: true, passive: true })

  const operationSignal = (external?: AbortSignal) => {
    const controller = new AbortController()
    const abort = () => controller.abort()
    external?.addEventListener("abort", abort, { once: true })
    if (external?.aborted) controller.abort()
    operations.add(controller)
    return {
      signal: controller.signal,
      cleanup: () => {
        operations.delete(controller)
        external?.removeEventListener("abort", abort)
      },
    }
  }

  const executeTo = async (surface: ScrollSurface, destination: Partial<Point>, scrollOptions: ScrollOptions = {}): Promise<ExecutedScrollStep> => {
    const operation = operationSignal(scrollOptions.signal)
    try {
      throwIfAborted(operation.signal)
      platform.invalidate()
      const metrics = platform.getScrollMetrics(surface)
      const to = {
        x: Math.min(metrics.max.x, Math.max(metrics.min.x, destination.x ?? metrics.scroll.x)),
        y: Math.min(metrics.max.y, Math.max(metrics.min.y, destination.y ?? metrics.scroll.y)),
      }
      const axes = [] as ("x" | "y")[]
      if (to.x !== metrics.scroll.x) axes.push("x")
      if (to.y !== metrics.scroll.y) axes.push("y")
      const step: ScrollPlanStep = { surface, from: metrics.scroll, to, axes }
      return await executor.execute(step, resolveMotion(scrollOptions.motion), scrollOptions.settle ?? {}, operation.signal)
    } finally {
      operation.cleanup()
    }
  }

  return {
    planReveal: (target, revealOptions = {}) => {
      platform.invalidate()
      return createRevealPlan(target, revealOptions, platform)
    },

    async reveal(target, revealOptions: RevealOptions = {}): Promise<RevealResult> {
      const operation = operationSignal(revealOptions.signal)
      try {
        throwIfAborted(operation.signal)
        platform.invalidate()
        const started = now()
        const initial = readRevealContext(target, revealOptions, platform)
        const executed: ExecutedScrollStep[] = []
        const safeArea = resolveInsets(revealOptions.safeArea)
        const padding = resolveInsets(revealOptions.padding)
        const motion = resolveMotion(revealOptions.motion)

        for (const surface of initial.chain) {
          throwIfAborted(operation.signal)
          platform.invalidate()
          const metrics = platform.getScrollMetrics(surface)
          const viewport = effectiveViewport(metrics.viewport, metrics.padding, isWindow(surface) ? safeArea : resolveInsets(), padding)
          const targetRect = platform.getRect(target)
          const targetMargin = platform.getComputedScrollStyle(target).scrollMargin
          const step = planSurfaceReveal({
            surface,
            target: expandRect(targetRect, targetMargin),
            viewport,
            metrics,
            block: revealOptions.block ?? "nearest",
            inline: revealOptions.inline ?? "nearest",
            visibility: revealOptions.visibility ?? "full",
          })
          if (step.axes.length > 0) {
            executed.push(await executor.execute(step, motion, false, operation.signal))
          }
        }

        if (revealOptions.settle !== false) {
          for (const step of executed) {
            await executor.execute({ ...step, from: step.actualTo, to: step.actualTo, axes: [] }, { type: "instant" }, revealOptions.settle ?? {}, operation.signal)
          }
        }
        platform.invalidate()
        const after = readRevealContext(target, revealOptions, platform).visibility
        return {
          changed: executed.length > 0,
          before: initial.visibility,
          after,
          fullyVisible: after.fullyVisible,
          visibilityRatio: after.visibilityRatio,
          steps: Object.freeze(executed),
          elapsed: now() - started,
        }
      } finally {
        operation.cleanup()
      }
    },

    to: executeTo,
    by: (surface, delta, scrollOptions = {}) => {
      const current = platform.readScroll(surface)
      return executeTo(surface, { x: current.x + (delta.x ?? 0), y: current.y + (delta.y ?? 0) }, scrollOptions)
    },
    raf: (time) => frames.raf(time),
    getState: (surface) => animator.getState(surface),
    destroy: () => {
      animator.cancel()
      frames.destroy()
      inputView?.removeEventListener("wheel", interrupt, { capture: true })
      inputView?.removeEventListener("touchstart", interrupt, { capture: true })
    },
  }
}
