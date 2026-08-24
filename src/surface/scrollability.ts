const scrollableOverflow = new Set(["auto", "scroll", "overlay"]);

export function isScrollableOverflow(value: string): boolean {
  return scrollableOverflow.has(value);
}
