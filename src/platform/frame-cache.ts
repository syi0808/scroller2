import type {
  Point,
  Rect,
  ScrollMetrics,
  ScrollPlatform,
  ScrollStyle,
  ScrollSurface,
} from "../core/types.js";

export class FrameCachedScrollPlatform implements ScrollPlatform {
  private readonly rects = new Map<Element, Rect>();
  private readonly metrics = new Map<ScrollSurface, ScrollMetrics>();
  private readonly styles = new Map<Element, ScrollStyle>();
  private viewport?: Rect;

  constructor(private readonly source: ScrollPlatform) {}

  invalidate(): void {
    this.rects.clear();
    this.metrics.clear();
    this.styles.clear();
    this.viewport = undefined;
  }

  getRect(element: Element): Rect {
    const cached = this.rects.get(element);
    if (cached) return cached;
    const value = this.source.getRect(element);
    this.rects.set(element, value);
    return value;
  }

  getViewportRect(): Rect {
    return (this.viewport ??= this.source.getViewportRect());
  }

  getScrollMetrics(surface: ScrollSurface): ScrollMetrics {
    const cached = this.metrics.get(surface);
    if (cached) return cached;
    const value = this.source.getScrollMetrics(surface);
    this.metrics.set(surface, value);
    return value;
  }

  getComputedScrollStyle(element: Element): ScrollStyle {
    const cached = this.styles.get(element);
    if (cached) return cached;
    const value = this.source.getComputedScrollStyle(element);
    this.styles.set(element, value);
    return value;
  }

  getParent(element: Element): Element | null {
    return this.source.getParent(element);
  }

  getShadowHost(element: Element): Element | null {
    return this.source.getShadowHost?.(element) ?? null;
  }

  readScroll(surface: ScrollSurface): Point {
    return this.source.readScroll(surface);
  }

  writeScroll(surface: ScrollSurface, position: Point): void {
    this.source.writeScroll(surface, position);
    this.invalidate();
  }
}
