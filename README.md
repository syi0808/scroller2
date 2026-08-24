# Scroller2

A small deterministic engine for programmatic scrolling and target reveal.

```ts
import { createScrollEngine } from "scroller2";

const scroll = createScrollEngine();

await scroll.reveal(target, {
  block: "nearest",
  visibility: "full",
  safeArea: { top: 64, right: 320, bottom: 32, left: 32 },
  motion: "smooth",
});
```

Install with `pnpm add scroller2`.

Try the [motion playground](https://syi0808.github.io/scroller2/).

The engine discovers axis-aware scroll ancestors, plans each reveal as immutable data, then executes inner-to-outer with a geometry refresh between surfaces. It supports instant, tween, and lerp motion, external RAF, cancellation, retargeting, and scroll settlement.

## API

```ts
scroll.planReveal(target, options);
scroll.reveal(target, options);
scroll.to(surface, { x, y }, options);
scroll.by(surface, { x, y }, options);
scroll.getState(surface);
scroll.raf(time);
scroll.destroy();
```

Set `autoRaf: false` when another runtime owns the frame clock. Call `scroll.raf(time)` from that clock until the returned operation settles.

## Development

Run `pnpm test` for the pure planner and runtime tests, and `pnpm build` for the ESM package. The playground is deployed to GitHub Pages from `main`.
