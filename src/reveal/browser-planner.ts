import type { Insets, Rect, RevealOptions, ScrollMetrics, ScrollPlan, ScrollPlatform, ScrollSurface, VisibilitySnapshot } from "../core/types.js"
import { resolveInsets } from "../geometry/insets.js"
import { expandRect, intersectRect, translateRect } from "../geometry/rect.js"
import { measureVisibility } from "../geometry/visibility.js"
import { discoverScrollChain } from "../surface/discover-scroll-chain.js"
import { effectiveViewport } from "./effective-viewport.js"
import { planSurfaceReveal } from "./planner.js"

function isWindow(surface: ScrollSurface): surface is Window {
  return "window" in surface && surface.window === surface
}

export interface RevealContext {
  readonly chain: readonly ScrollSurface[]
  readonly targetRect: Rect
  readonly targetMargin: Insets
  readonly metrics: readonly ScrollMetrics[]
  readonly viewports: readonly Rect[]
  readonly combinedViewport: Rect
  readonly visibility: VisibilitySnapshot
}

export function readRevealContext(target: Element, options: RevealOptions, platform: ScrollPlatform): RevealContext {
  const chain = discoverScrollChain(target, platform)
  const safeArea = resolveInsets(options.safeArea)
  const padding = resolveInsets(options.padding)
  const metrics = chain.map((surface) => platform.getScrollMetrics(surface))
  const viewports = chain.map((surface, index) => {
    const surfaceMetrics = metrics[index]!
    return effectiveViewport(surfaceMetrics.viewport, surfaceMetrics.padding, isWindow(surface) ? safeArea : resolveInsets(), padding)
  })
  const fallback = platform.getViewportRect()
  const combinedViewport = viewports.reduce(intersectRect, fallback)
  const targetRect = platform.getRect(target)
  const targetMargin = platform.getComputedScrollStyle(target).scrollMargin
  return { chain, targetRect, targetMargin, metrics, viewports, combinedViewport, visibility: measureVisibility(targetRect, combinedViewport) }
}

export function createRevealPlan(target: Element, options: RevealOptions, platform: ScrollPlatform): ScrollPlan {
  const context = readRevealContext(target, options, platform)
  let simulated = context.targetRect
  const steps = context.chain.map((surface, index) => {
    const metrics = context.metrics[index]!
    const step = planSurfaceReveal({
      surface,
      target: expandRect(simulated, context.targetMargin),
      viewport: context.viewports[index]!,
      metrics,
      block: options.block ?? "nearest",
      inline: options.inline ?? "nearest",
      visibility: options.visibility ?? "full",
    })
    simulated = translateRect(simulated, -(step.to.x - step.from.x), -(step.to.y - step.from.y))
    return step
  }).filter((step) => step.axes.length > 0)
  const expected = measureVisibility(simulated, context.combinedViewport)
  return Object.freeze({ target, steps: Object.freeze(steps), before: context.visibility, expected })
}
