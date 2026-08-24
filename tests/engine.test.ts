import { describe, expect, it } from "vitest"
import { createScrollEngine } from "../src/index.js"
import type { Point, Rect, ScrollMetrics, ScrollPlatform, ScrollStyle, ScrollSurface } from "../src/index.js"

const bounds = (top: number, right: number, bottom: number, left: number): Rect => ({
  top, right, bottom, left, width: right - left, height: bottom - top,
})

class FakePlatform implements ScrollPlatform {
  position: Point = { x: 0, y: 0 }
  writes: Point[] = []

  getRect(): Rect { return bounds(0, 0, 0, 0) }
  getViewportRect(): Rect { return bounds(0, 100, 100, 0) }
  getScrollMetrics(): ScrollMetrics {
    return {
      viewport: this.getViewportRect(), scroll: this.position,
      min: { x: 0, y: 0 }, max: { x: 1000, y: 1000 }, axes: { x: true, y: true },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    }
  }
  getComputedScrollStyle(): ScrollStyle {
    return {
      overflowX: "auto", overflowY: "auto",
      scrollPadding: { top: 0, right: 0, bottom: 0, left: 0 },
      scrollMargin: { top: 0, right: 0, bottom: 0, left: 0 },
    }
  }
  getParent(): Element | null { return null }
  readScroll(): Point { return this.position }
  writeScroll(_surface: ScrollSurface, position: Point): void {
    this.position = position
    this.writes.push(position)
  }
}

describe("motion execution", () => {
  it("supports deterministic external RAF tweening", async () => {
    const platform = new FakePlatform()
    let now = 0
    const engine = createScrollEngine({ platform, autoRaf: false, now: () => now })
    const surface = {} as Element
    const operation = engine.to(surface, { y: 100 }, {
      motion: { type: "tween", duration: 100 }, settle: false,
    })
    engine.raf(0)
    now = 50
    engine.raf(50)
    expect(platform.position.y).toBeCloseTo(50)
    now = 100
    engine.raf(100)
    const result = await operation
    expect(result.actualTo.y).toBe(100)
    expect(platform.writes).toHaveLength(3)
    engine.destroy()
  })

  it("clamps explicit destinations to surface bounds", async () => {
    const platform = new FakePlatform()
    const engine = createScrollEngine({ platform, autoRaf: false })
    const result = await engine.to({} as Element, { x: -10, y: 2000 }, { motion: "instant", settle: false })
    expect(result.actualTo).toEqual({ x: 0, y: 1000 })
    engine.destroy()
  })

  it("retargets an active programmatic command", async () => {
    const platform = new FakePlatform()
    const engine = createScrollEngine({ platform, autoRaf: false })
    const surface = {} as Element
    const first = engine.to(surface, { y: 100 }, { motion: { type: "tween", duration: 100 }, settle: false })
    engine.raf(0)
    engine.raf(50)
    const second = engine.to(surface, { y: 200 }, { motion: { type: "tween", duration: 100 }, settle: false })
    engine.raf(60)
    engine.raf(160)
    const [firstResult, secondResult] = await Promise.all([first, second])
    expect(firstResult.actualTo.y).toBe(200)
    expect(secondResult.actualTo.y).toBe(200)
    engine.destroy()
  })

  it("rejects an aborted operation and accepts the next command", async () => {
    const platform = new FakePlatform()
    const engine = createScrollEngine({ platform, autoRaf: false })
    const surface = {} as Element
    const controller = new AbortController()
    const operation = engine.to(surface, { y: 100 }, {
      motion: { type: "tween", duration: 100 }, settle: false, signal: controller.signal,
    })
    engine.raf(0)
    controller.abort()
    await expect(operation).rejects.toMatchObject({ name: "AbortError" })
    const next = await engine.to(surface, { y: 200 }, { motion: "instant", settle: false })
    expect(next.actualTo.y).toBe(200)
    engine.destroy()
  })
})
