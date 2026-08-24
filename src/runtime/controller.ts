export type FrameCallback = (time: number) => boolean;

export class RafController {
  private readonly callbacks = new Set<FrameCallback>();
  private frame: number | undefined;
  private destroyed = false;

  constructor(private readonly auto: boolean) {}

  add(callback: FrameCallback): void {
    this.callbacks.add(callback);
    this.request();
  }

  delete(callback: FrameCallback): void {
    this.callbacks.delete(callback);
  }

  raf(time: number): void {
    if (this.destroyed) return;
    for (const callback of this.callbacks) {
      if (!callback(time)) this.callbacks.delete(callback);
    }
    if (this.callbacks.size > 0) this.request();
  }

  destroy(): void {
    this.destroyed = true;
    this.callbacks.clear();
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }

  private request(): void {
    if (
      !this.auto ||
      this.frame !== undefined ||
      this.destroyed ||
      typeof requestAnimationFrame === "undefined"
    )
      return;
    this.frame = requestAnimationFrame((time) => {
      this.frame = undefined;
      this.raf(time);
    });
  }
}
