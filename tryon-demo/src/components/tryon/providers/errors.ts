import type { TryOnError, TryOnErrorKind } from "../types.ts";

/** Providers throw this so the controller can show the right copy without knowing any vendor. */
export class TryOnProviderError extends Error {
  kind: TryOnErrorKind;
  constructor(kind: TryOnErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "TryOnProviderError";
    this.kind = kind;
    if (cause !== undefined) this.cause = cause;
  }
}

export function toTryOnError(err: unknown): TryOnError {
  if (err instanceof TryOnProviderError) return { kind: err.kind, message: err.message, cause: err.cause };
  const e = err as { kind?: unknown; message?: unknown } | null;
  if (e && typeof e.kind === "string" && typeof e.message === "string") {
    return { kind: e.kind as TryOnErrorKind, message: e.message };
  }
  return { kind: "unknown", message: err instanceof Error ? err.message : String(err), cause: err };
}
