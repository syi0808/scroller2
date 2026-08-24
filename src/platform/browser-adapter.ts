import type { Insets, Point, Rect, ScrollMetrics, ScrollPlatform, ScrollStyle, ScrollSurface } from "../core/types.js"
import { rect } from "../geometry/rect.js"

function pixels(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function styleInsets(style: CSSStyleDeclaration, prefix: "scrollPadding" | "scrollMargin"): Insets {
  return {
    top: pixels(style[`${prefix}Top`]),
    right: pixels(style[`${prefix}Right`]),
    bottom: pixels(style[`${prefix}Bottom`]),
    left: pixels(style[`${prefix}Left`]),
  }
}

function isWindow(surface: ScrollSurface): surface is Window {
  return "window" in surface && surface.window === surface
}

export class BrowserScrollPlatform implements ScrollPlatform {
  getRect(element: Element): Rect {
    const value = element.getBoundingClientRect()
    return rect(value.top, value.right, value.bottom, value.left)
  }

  getViewportRect(): Rect {
    return rect(0, globalThis.innerWidth, globalThis.innerHeight, 0)
  }

  getScrollMetrics(surface: ScrollSurface): ScrollMetrics {
    if (isWindow(surface)) {
      const documentElement = surface.document.documentElement
      const viewport = rect(0, surface.innerWidth, surface.innerHeight, 0)
      return {
        viewport,
        scroll: { x: surface.scrollX, y: surface.scrollY },
        min: { x: 0, y: 0 },
        max: {
          x: Math.max(0, documentElement.scrollWidth - surface.innerWidth),
          y: Math.max(0, documentElement.scrollHeight - surface.innerHeight),
        },
        axes: {
          x: documentElement.scrollWidth > surface.innerWidth,
          y: documentElement.scrollHeight > surface.innerHeight,
        },
        padding: styleInsets(surface.getComputedStyle(documentElement), "scrollPadding"),
      }
    }

    const bounds = surface.getBoundingClientRect()
    const viewport = rect(
      bounds.top + surface.clientTop,
      bounds.left + surface.clientLeft + surface.clientWidth,
      bounds.top + surface.clientTop + surface.clientHeight,
      bounds.left + surface.clientLeft,
    )
    const style = surface.ownerDocument.defaultView?.getComputedStyle(surface)
    const horizontalRange = Math.max(0, surface.scrollWidth - surface.clientWidth)
    const rightToLeft = style?.direction === "rtl"
    return {
      viewport,
      scroll: { x: surface.scrollLeft, y: surface.scrollTop },
      min: { x: rightToLeft ? -horizontalRange : 0, y: 0 },
      max: { x: rightToLeft ? 0 : horizontalRange, y: Math.max(0, surface.scrollHeight - surface.clientHeight) },
      axes: { x: surface.scrollWidth > surface.clientWidth, y: surface.scrollHeight > surface.clientHeight },
      padding: style ? styleInsets(style, "scrollPadding") : { top: 0, right: 0, bottom: 0, left: 0 },
    }
  }

  getComputedScrollStyle(element: Element): ScrollStyle {
    const view = element.ownerDocument.defaultView
    if (!view) throw new Error("Element is not connected to a browsing context")
    const style = view.getComputedStyle(element)
    return {
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      scrollPadding: styleInsets(style, "scrollPadding"),
      scrollMargin: styleInsets(style, "scrollMargin"),
    }
  }

  getParent(element: Element): Element | null {
    return element.parentElement
  }

  getShadowHost(element: Element): Element | null {
    const root = element.getRootNode()
    return root instanceof ShadowRoot ? root.host : null
  }

  readScroll(surface: ScrollSurface): Point {
    return isWindow(surface) ? { x: surface.scrollX, y: surface.scrollY } : { x: surface.scrollLeft, y: surface.scrollTop }
  }

  writeScroll(surface: ScrollSurface, position: Point): void {
    if (isWindow(surface)) surface.scrollTo(position.x, position.y)
    else {
      surface.scrollLeft = position.x
      surface.scrollTop = position.y
    }
  }
}
