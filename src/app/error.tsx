"use client";
import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="container-x py-24 sm:py-32">
      <p className="eyebrow text-ink-3">Something slipped</p>
      <h1 className="display-lg mt-4 max-w-[14ch] text-balance">That didn’t <em>load.</em></h1>
      <p className="lede mt-6">An unexpected error interrupted this page. Your bag and wishlist are safe — they live in this browser.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary" size="lg">Back home</LinkButton>
      </div>
    </div>
  );
}
