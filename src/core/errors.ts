export class ScrollAbortError extends Error {
  constructor(message = "Scroll operation was aborted") {
    super(message)
    this.name = "AbortError"
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ScrollAbortError()
}
