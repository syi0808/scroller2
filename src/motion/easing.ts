import type { Easing } from "../core/types.js"

export const linear: Easing = (progress) => progress
export const easeIn: Easing = (progress) => progress * progress * progress
export const easeOut: Easing = (progress) => 1 - (1 - progress) ** 3
export const easeInOut: Easing = (progress) => progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
