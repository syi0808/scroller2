import type { Insets, Rect } from "../core/types.js"
import { addInsets } from "../geometry/insets.js"
import { insetRect } from "../geometry/rect.js"

export function effectiveViewport(viewport: Rect, scrollPadding: Insets, safeArea: Insets, padding: Insets): Rect {
  return insetRect(viewport, addInsets(scrollPadding, safeArea, padding))
}
