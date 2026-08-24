import type { ScrollPlatform, ScrollSurface } from "../core/types.js";
import { isScrollableOverflow } from "./scrollability.js";

export function discoverScrollChain(target: Element, platform: ScrollPlatform): ScrollSurface[] {
  const chain: ScrollSurface[] = [];
  let current: Element | null = target;

  while (current) {
    const parent: Element | null =
      platform.getParent(current) ?? platform.getShadowHost?.(current) ?? null;
    if (!parent) break;
    const style = platform.getComputedScrollStyle(parent);
    const metrics = platform.getScrollMetrics(parent);
    const scrollsX = metrics.axes.x && isScrollableOverflow(style.overflowX);
    const scrollsY = metrics.axes.y && isScrollableOverflow(style.overflowY);
    const ownsDocumentScroll = parent.ownerDocument?.scrollingElement === parent;
    if (!ownsDocumentScroll && (scrollsX || scrollsY)) chain.push(parent);
    current = parent;
  }

  const view = target.ownerDocument?.defaultView;
  if (view) chain.push(view);
  return chain;
}
