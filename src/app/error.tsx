"use client";
import { useEffect } from "react";
import { LostBento } from "@/components/editorial/LostBento";
import { Button, LinkButton } from "@/components/ui/Button";

/** Route error boundary. `retry` re-fetches and re-renders the segment (Next 16); `reset` would only clear the error state. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <LostBento
      copy={
        <div role="alert">
          <p className="eyebrow text-ink-3">Something slipped</p>
          <h1 className="display-lg mt-5 max-w-[14ch] text-balance">
            That didn’t <em>load.</em>
          </h1>
          <p className="lede mt-6">An unexpected error interrupted this page. Your bag and wishlist are safe — they live in this browser.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={retry}>
              Try again
            </Button>
            <LinkButton href="/" variant="secondary" size="lg">
              Back home
            </LinkButton>
          </div>
          {digest && <p className="mt-6 text-[12.5px] tabular-nums text-ink-3">Reference {digest}</p>}
        </div>
      }
    />
  );
}
