export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export type ScrollSurface = Window | Element;
export type Axis = "x" | "y";
export type Alignment = "nearest" | "start" | "center" | "end";
export type VisibilityPolicy = "any" | "full" | { readonly ratio: number };

export interface ScrollMetrics {
  readonly viewport: Rect;
  readonly scroll: Point;
  readonly min: Point;
  readonly max: Point;
  readonly axes: Readonly<{ x: boolean; y: boolean }>;
  readonly padding: Insets;
}

export interface ScrollStyle {
  readonly overflowX: string;
  readonly overflowY: string;
  readonly scrollPadding: Insets;
  readonly scrollMargin: Insets;
}

export interface ScrollPlatform {
  getRect(element: Element): Rect;
  getViewportRect(): Rect;
  getScrollMetrics(surface: ScrollSurface): ScrollMetrics;
  getComputedScrollStyle(element: Element): ScrollStyle;
  getParent(element: Element): Element | null;
  getShadowHost?(element: Element): Element | null;
  readScroll(surface: ScrollSurface): Point;
  writeScroll(surface: ScrollSurface, position: Point): void;
}

export interface VisibilitySnapshot {
  readonly visibleArea: number;
  readonly targetArea: number;
  readonly visibilityRatio: number;
  readonly fullyVisible: boolean;
}

export interface ScrollPlanStep {
  readonly surface: ScrollSurface;
  readonly from: Point;
  readonly to: Point;
  readonly axes: readonly Axis[];
}

export interface ScrollPlan {
  readonly target?: Element;
  readonly steps: readonly ScrollPlanStep[];
  readonly before: VisibilitySnapshot;
  readonly expected: VisibilitySnapshot;
}

export type Easing = (progress: number) => number;

export interface AdaptiveDuration {
  readonly type: "adaptive";
  readonly min?: number;
  readonly max?: number;
  readonly velocity?: number;
}

export type DurationOption = number | "auto" | AdaptiveDuration;

export type MotionOptions =
  | { readonly type: "instant" }
  | { readonly type: "tween"; readonly duration?: DurationOption; readonly easing?: Easing }
  | { readonly type: "lerp"; readonly factor?: number };

export type MotionPreset = "instant" | "smooth" | "snappy" | "gentle";

export interface SettlementOptions {
  readonly stableFrames?: number;
  readonly threshold?: number;
  readonly quietMs?: number;
  readonly timeout?: number;
}

export interface RevealOptions {
  readonly visibility?: VisibilityPolicy;
  readonly block?: Alignment;
  readonly inline?: Alignment;
  readonly safeArea?: number | Partial<Insets>;
  readonly padding?: number | Partial<Insets>;
  readonly motion?: MotionOptions | MotionPreset;
  readonly settle?: SettlementOptions | false;
  readonly signal?: AbortSignal;
}

export interface ScrollOptions {
  readonly motion?: MotionOptions | MotionPreset;
  readonly settle?: SettlementOptions | false;
  readonly signal?: AbortSignal;
}

export interface ExecutedScrollStep extends ScrollPlanStep {
  readonly plannedTo: Point;
  readonly actualTo: Point;
  readonly elapsed: number;
}

export interface RevealResult {
  readonly changed: boolean;
  readonly before: VisibilitySnapshot;
  readonly after: VisibilitySnapshot;
  readonly fullyVisible: boolean;
  readonly visibilityRatio: number;
  readonly steps: readonly ExecutedScrollStep[];
  readonly elapsed: number;
}

export interface MotionState {
  readonly actual: Point;
  readonly target: Point;
  readonly animated: Point;
  readonly velocity: Point;
  readonly direction: Readonly<{ x: -1 | 0 | 1; y: -1 | 0 | 1 }>;
}

export interface ScrollEngineOptions {
  readonly autoRaf?: boolean;
  readonly platform?: ScrollPlatform;
  readonly now?: () => number;
}

export interface ScrollEngine {
  reveal(target: Element, options?: RevealOptions): Promise<RevealResult>;
  to(
    surface: ScrollSurface,
    destination: Partial<Point>,
    options?: ScrollOptions,
  ): Promise<ExecutedScrollStep>;
  by(
    surface: ScrollSurface,
    delta: Partial<Point>,
    options?: ScrollOptions,
  ): Promise<ExecutedScrollStep>;
  planReveal(target: Element, options?: RevealOptions): ScrollPlan;
  raf(time: number): void;
  getState(surface: ScrollSurface): MotionState | undefined;
  destroy(): void;
}
