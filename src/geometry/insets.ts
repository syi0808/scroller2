import type { Insets } from "../core/types.js";

export function resolveInsets(value?: number | Partial<Insets>): Insets {
  if (typeof value === "number") return { top: value, right: value, bottom: value, left: value };
  return {
    top: value?.top ?? 0,
    right: value?.right ?? 0,
    bottom: value?.bottom ?? 0,
    left: value?.left ?? 0,
  };
}

export function addInsets(...values: readonly Insets[]): Insets {
  return values.reduce<Insets>(
    (sum, value) => ({
      top: sum.top + value.top,
      right: sum.right + value.right,
      bottom: sum.bottom + value.bottom,
      left: sum.left + value.left,
    }),
    { top: 0, right: 0, bottom: 0, left: 0 },
  );
}
