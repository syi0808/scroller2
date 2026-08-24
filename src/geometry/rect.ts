import type { Insets, Rect } from "../core/types.js"

export const zeroInsets: Insets = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 })

export function rect(top: number, right: number, bottom: number, left: number): Rect {
  return { top, right, bottom, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

export function insetRect(value: Rect, insets: Insets): Rect {
  let top = value.top + insets.top
  let right = value.right - insets.right
  let bottom = value.bottom - insets.bottom
  let left = value.left + insets.left
  if (top > bottom) top = bottom = (top + bottom) / 2
  if (left > right) left = right = (left + right) / 2
  return rect(top, right, bottom, left)
}

export function expandRect(value: Rect, insets: Insets): Rect {
  return rect(value.top - insets.top, value.right + insets.right, value.bottom + insets.bottom, value.left - insets.left)
}

export function translateRect(value: Rect, x: number, y: number): Rect {
  return rect(value.top + y, value.right + x, value.bottom + y, value.left + x)
}

export function intersectRect(a: Rect, b: Rect): Rect {
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.right, b.right)
  const bottom = Math.max(top, Math.min(a.bottom, b.bottom))
  const left = Math.min(right, Math.max(a.left, b.left))
  return rect(top, right, bottom, left)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
