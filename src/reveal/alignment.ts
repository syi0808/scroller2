import type { Alignment } from "../core/types.js"

export function alignmentDelta(targetStart: number, targetEnd: number, viewportStart: number, viewportEnd: number, alignment: Alignment): number {
  if (alignment === "start") return targetStart - viewportStart
  if (alignment === "end") return targetEnd - viewportEnd
  if (alignment === "center") return (targetStart + targetEnd - viewportStart - viewportEnd) / 2

  const startDelta = targetStart - viewportStart
  const endDelta = targetEnd - viewportEnd
  if (targetStart >= viewportStart && targetEnd <= viewportEnd) return 0
  if (targetEnd - targetStart > viewportEnd - viewportStart) {
    return Math.abs(startDelta) <= Math.abs(endDelta) ? startDelta : endDelta
  }
  return targetStart < viewportStart ? startDelta : endDelta
}
