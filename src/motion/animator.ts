import type { MotionOptions, MotionState, Point, ScrollPlatform, ScrollSurface } from "../core/types.js"
import { ScrollAbortError, throwIfAborted } from "../core/errors.js"
import { linear } from "./easing.js"
import { resolveDuration } from "./duration.js"
import { lerpPoint } from "./lerp.js"
import { tweenPoint } from "./tween.js"
import type { FrameCallback } from "../runtime/controller.js"
import { RafController } from "../runtime/controller.js"

interface ActiveMotion {
  surface: ScrollSurface
  from: Point
  target: Point
  animated: Point
  previous: Point
  started?: number
  duration: number
  motion: MotionOptions
  resolve: (position: Point) => void
  reject: (error: unknown) => void
  callback: FrameCallback
  cleanup: () => void
}

export class Animator {
  private readonly active = new Map<ScrollSurface, ActiveMotion>()
  private readonly states = new Map<ScrollSurface, MotionState>()

  constructor(private readonly platform: ScrollPlatform, private readonly frames: RafController) {}

  animate(surface: ScrollSurface, target: Point, motion: MotionOptions, signal?: AbortSignal): Promise<Point> {
    throwIfAborted(signal)
    const existing = this.active.get(surface)
    if (existing) {
      existing.from = existing.animated
      existing.target = target
      existing.started = undefined
      existing.motion = motion
      existing.duration = this.duration(existing.from, target, motion)
      return new Promise((resolve, reject) => {
        const oldResolve = existing.resolve
        const oldReject = existing.reject
        existing.resolve = (position) => { oldResolve(position); resolve(position) }
        existing.reject = (error) => { oldReject(error); reject(error) }
        this.bindSignal(existing, signal)
      })
    }

    if (motion.type === "instant") {
      this.platform.writeScroll(surface, target)
      const actual = this.platform.readScroll(surface)
      this.updateState(surface, actual, target, actual, { x: 0, y: 0 })
      return Promise.resolve(actual)
    }

    const from = this.platform.readScroll(surface)
    return new Promise<Point>((resolve, reject) => {
      const active: ActiveMotion = {
        surface, from, target, animated: from, previous: from,
        duration: this.duration(from, target, motion), motion, resolve, reject,
        callback: () => false,
        cleanup: () => {},
      }
      active.callback = (time) => this.tick(active, time)
      this.active.set(surface, active)
      this.bindSignal(active, signal)
      this.frames.add(active.callback)
    })
  }

  getState(surface: ScrollSurface): MotionState | undefined {
    return this.states.get(surface)
  }

  cancel(surface?: ScrollSurface): void {
    const motions = surface ? [this.active.get(surface)] : [...this.active.values()]
    for (const active of motions) if (active) this.finish(active, new ScrollAbortError())
  }

  private tick(active: ActiveMotion, time: number): boolean {
    if (this.active.get(active.surface) !== active) return false
    active.started ??= time
    const elapsed = time - active.started
    let done = false
    let animated: Point
    if (active.motion.type === "lerp") {
      const factor = Math.max(0.001, Math.min(1, active.motion.factor ?? 0.12))
      animated = lerpPoint(active.from, active.target, factor, elapsed)
      done = Math.hypot(active.target.x - animated.x, active.target.y - animated.y) <= 0.1
    } else if (active.motion.type === "tween") {
      const progress = active.duration === 0 ? 1 : Math.min(1, elapsed / active.duration)
      animated = tweenPoint(active.from, active.target, progress, active.motion.easing ?? linear)
      done = elapsed >= active.duration
    } else {
      animated = active.target
      done = true
    }
    if (done) animated = active.target
    this.platform.writeScroll(active.surface, animated)
    const actual = this.platform.readScroll(active.surface)
    const velocity = { x: actual.x - active.previous.x, y: actual.y - active.previous.y }
    active.previous = actual
    active.animated = animated
    this.updateState(active.surface, actual, active.target, animated, velocity)
    if (done) {
      this.finish(active)
      return false
    }
    return true
  }

  private finish(active: ActiveMotion, error?: unknown): void {
    if (this.active.get(active.surface) !== active) return
    this.active.delete(active.surface)
    this.frames.delete(active.callback)
    active.cleanup()
    if (error) active.reject(error)
    else active.resolve(this.platform.readScroll(active.surface))
  }

  private bindSignal(active: ActiveMotion, signal?: AbortSignal): void {
    if (!signal) return
    const abort = () => this.finish(active, new ScrollAbortError())
    signal.addEventListener("abort", abort, { once: true })
    const oldCleanup = active.cleanup
    active.cleanup = () => { oldCleanup(); signal.removeEventListener("abort", abort) }
  }

  private duration(from: Point, to: Point, motion: MotionOptions): number {
    return motion.type === "tween" ? resolveDuration(motion.duration, Math.hypot(to.x - from.x, to.y - from.y)) : Number.POSITIVE_INFINITY
  }

  private updateState(surface: ScrollSurface, actual: Point, target: Point, animated: Point, velocity: Point): void {
    const direction = {
      x: Math.sign(velocity.x) as -1 | 0 | 1,
      y: Math.sign(velocity.y) as -1 | 0 | 1,
    }
    this.states.set(surface, { actual, target, animated, velocity, direction })
  }
}
