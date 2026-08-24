import type {
  ExecutedScrollStep,
  MotionOptions,
  ScrollPlanStep,
  ScrollPlatform,
  SettlementOptions,
} from "../core/types.js";
import { Animator } from "../motion/animator.js";
import { waitForSettlement } from "../settlement/observer.js";
import { RafController } from "../runtime/controller.js";

export class ScrollExecutor {
  constructor(
    private readonly platform: ScrollPlatform,
    private readonly animator: Animator,
    private readonly frames: RafController,
    private readonly now: () => number,
  ) {}

  async execute(
    step: ScrollPlanStep,
    motion: MotionOptions,
    settle: SettlementOptions | false,
    signal?: AbortSignal,
  ): Promise<ExecutedScrollStep> {
    const started = this.now();
    const actual = await this.animator.animate(step.surface, step.to, motion, signal);
    const actualTo =
      settle === false
        ? actual
        : await waitForSettlement(step.surface, this.platform, this.frames, settle, signal);
    return {
      ...step,
      plannedTo: step.to,
      actualTo,
      elapsed: this.now() - started,
    };
  }
}
