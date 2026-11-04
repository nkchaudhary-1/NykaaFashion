"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { copy, deniedCopy, errorCopy } from "../copy.ts";
import type { Garment, PermissionReason, TryOnErrorKind, TryOnMode } from "../types.ts";
import { Button } from "./Button";
import { Silhouette, Spinner } from "./icons";

// The panel's light, text-led states: idle, consent, requesting-permission, permission-denied, error.
// (connecting / live / switching live on the dark stage.) Headings carry data-autofocus so keyboard and
// screen-reader users land on the new state's title when it changes.

// Announcements are made once, by TryOn's live regions (so a screen reader never reads a state twice).
function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "anim-fade absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto px-6 pb-8 pt-16 text-center sm:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

const Heading = ({ children }: { children: ReactNode }) => (
  <h2
    tabIndex={-1}
    data-autofocus
    className="max-w-[22ch] font-serif text-[28px] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[34px]"
  >
    {children}
  </h2>
);

const Body = ({ children }: { children: ReactNode }) => (
  <p className="max-w-[40ch] text-[15px] leading-relaxed text-ink-2">{children}</p>
);

export function IdleCard({ dropActive }: { dropActive: boolean }) {
  return (
    <div className="anim-fade absolute inset-0 overflow-hidden">
      <Silhouette className="absolute -bottom-6 left-1/2 w-[78%] max-w-[420px] -translate-x-1/2 text-tint" />
      <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-3 px-6 pt-16 text-center sm:pt-[72px]">
        <h2 tabIndex={-1} data-autofocus className="font-serif text-[28px] leading-[1.08] text-ink sm:text-[34px]">
          {copy.idle.title}
        </h2>
        <p className="max-w-[34ch] text-[15px] leading-relaxed text-ink-2">
          {copy.idle.body}
          {/* Dragging needs a mouse: say so only where it exists. */}
          <span className="hidden [@media(hover:hover)_and_(pointer:fine)]:inline"> {copy.idle.dragHint}</span>
        </p>
      </div>
      {dropActive && (
        <div
          aria-hidden="true"
          className="anim-fade pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[22px] border-2 border-dashed border-focus bg-card/90 font-serif text-3xl text-ink"
        >
          {copy.idle.drop}
        </div>
      )}
    </div>
  );
}

export function ConsentCard({
  mode,
  garment,
  onAgree,
  onDecline,
}: {
  mode: TryOnMode;
  garment: Garment | undefined;
  onAgree: () => void;
  onDecline: () => void;
}) {
  const text = mode === "live" ? copy.consent.live : copy.consent.sim;
  return (
    <Shell>
      {garment && (
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 text-[13px] text-ink-2">
          <Image src={garment.image} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover object-[50%_58%]" />
          {copy.consent.trying(garment.name)}
        </p>
      )}
      <Heading>{copy.consent.title}</Heading>
      <Body>{text.body}</Body>
      <p className="max-w-[40ch] text-[13px] leading-snug text-ink-3">{text.note}</p>
      <div className="flex w-full max-w-sm flex-col gap-2.5 sm:w-auto sm:max-w-none sm:flex-row">
        <Button variant="primary" onClick={onAgree}>
          {copy.consent.agree}
        </Button>
        <Button variant="secondary" onClick={onDecline}>
          {copy.consent.decline}
        </Button>
      </div>
    </Shell>
  );
}

export function RequestingCard({ onCancel }: { onCancel: () => void }) {
  return (
    <Shell>
      <div className="text-ink-3">
        <Spinner />
      </div>
      <Heading>{copy.requesting.title}</Heading>
      <Body>{copy.requesting.body}</Body>
      <Button variant="secondary" onClick={onCancel}>
        {copy.requesting.cancel}
      </Button>
    </Shell>
  );
}

export function DeniedCard({
  reason,
  onRetry,
  onClose,
}: {
  reason: PermissionReason | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const c = deniedCopy(reason);
  return (
    <Shell>
      <Heading>{c.title}</Heading>
      <Body>{c.body}</Body>
      <div className="flex w-full max-w-sm flex-col gap-2.5 sm:w-auto sm:max-w-none sm:flex-row">
        <Button variant="primary" onClick={onRetry}>
          {c.action ?? copy.retry}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          {copy.close}
        </Button>
      </div>
    </Shell>
  );
}

export function ErrorCard({
  kind,
  maxSessionSeconds,
  onRetry,
  onClose,
}: {
  kind: TryOnErrorKind | undefined;
  maxSessionSeconds: number;
  onRetry: () => void;
  onClose: () => void;
}) {
  const c = errorCopy(kind, { maxSessionSeconds });
  return (
    <Shell>
      <Heading>{c.title}</Heading>
      <Body>{c.body}</Body>
      {c.detail && <p className="max-w-[40ch] text-[13px] text-ink-3">{c.detail}</p>}
      <div className="flex w-full max-w-sm flex-col gap-2.5 sm:w-auto sm:max-w-none sm:flex-row">
        <Button variant="primary" onClick={onRetry}>
          {c.action ?? copy.retry}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          {copy.close}
        </Button>
      </div>
    </Shell>
  );
}
