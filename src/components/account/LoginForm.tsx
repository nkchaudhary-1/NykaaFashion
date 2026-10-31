"use client";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { mobileDigits } from "@/components/account/digits";
import { LinkButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { cn } from "@/lib/cn";
import { formatMobile, maskEmail, maskMobile } from "@/lib/format";
import { DEMO_MOBILE, PROTOTYPE_OTP, createAccount, logout, normaliseTarget, sendOtp, useAuth, verifyOtp } from "@/stores/account";
import { toast } from "@/stores/ui";

type Step = "identify" | "otp" | "profile";

/** "9876543210" → "987-654-3210" (the placeholder's grouping). */
const group = (d: string) => [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join("-");

/** The live field: a soft grey box, a small label over the value, and a 2px raspberry bottom border while it has focus. */
function GreyField({ id, label, error, children }: { id: string; label: string; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <div className={cn("rounded-t-[var(--radius-sm)] border-b-2 bg-sand transition-colors focus-within:border-pink", error ? "border-danger" : "border-transparent")}>
        <label htmlFor={id} className="block px-4 pt-2.5 text-[14px] text-ink-2">{label}</label>
        {children}
      </div>
      <p id={`${id}-err`} role={error ? "alert" : undefined} className={cn("text-[13px] font-medium text-danger", error ? "mt-2" : "hidden")}>{error}</p>
    </div>
  );
}

/**
 * Navy when it can be pressed, flat grey until then (the live "Get OTP"). `hint` is read after the visible label by screen readers
 * ("Get OTP (send code)"): the accessible name starts with the words on the button, as WCAG 2.5.3 asks.
 */
function PrimaryButton({ enabled, label, hint, type = "submit" }: { enabled: boolean; label: string; hint?: string; type?: "submit" | "button" }) {
  return (
    <button type={type} disabled={!enabled} className={cn("inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] text-[16px] font-semibold transition-colors", enabled ? "bg-navy text-bone hover:bg-pink hover:text-white" : "cursor-not-allowed bg-stone text-ink-3")}>
      {label}
      {hint && <span className="sr-only"> ({hint})</span>}
    </button>
  );
}

/**
 * Mobile/email OTP sign-in + first-time profile, shared by the sign-in modal and the /login page. Entirely simulated: no SMS or
 * email is sent. "Get OTP" stays grey until there are 10 digits; the code is always 123456 and the form says so.
 * `onSignedIn` runs once the user is signed in or their account is created (the modal closes, the page navigates).
 */
export function LoginForm({ onSignedIn, continueHref = "/account", headingAs: H = "h2", className }: { onSignedIn: () => void; continueHref?: string; headingAs?: "h1" | "h2"; className?: string }) {
  const uid = useId();
  const { user, ready } = useAuth();
  const [step, setStep] = useState<Step>("identify");
  const [mode, setMode] = useState<"mobile" | "email">("mobile");
  const [digits, setDigits] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [profile, setProfile] = useState({ name: "", email: "", mobile: "" });
  const [perr, setPerr] = useState<Record<string, string>>({});
  const codeRef = useRef<HTMLInputElement>(null);

  // What the OTP is "sent" to: +91 and ten digits (so a number that begins 91… is never mistaken for a country code), or the email.
  const target = mode === "mobile" ? `+91${digits}` : email.trim();
  const canSend = mode === "mobile" ? digits.length === 10 : email.trim().length > 4;

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    const r = sendOtp(target);
    if (!r.ok) return setError(r.error);
    setError(null);
    setCode("");
    setSeconds(30);
    setStep("otp");
    setTimeout(() => codeRef.current?.focus(), 60);
  };

  const verify = (value: string) => {
    const r = verifyOtp(value);
    if (!r.ok) return setError(r.error);
    setError(null);
    if (r.status === "login") {
      toast({ title: "Welcome back", description: "Signed in (simulated)." });
      onSignedIn();
    } else {
      const t = normaliseTarget(target);
      setProfile({ name: "", email: /^\d+$/.test(t) ? "" : t, mobile: /^\d+$/.test(t) ? t : "" });
      setStep("profile");
    }
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const r = createAccount(profile);
    if (!r.ok) {
      const key = /name/i.test(r.error) ? "name" : /email/i.test(r.error) ? "email" : "mobile";
      return setPerr({ [key]: r.error });
    }
    toast({ title: "Welcome to the Style Files", description: "Your (simulated) account is ready." });
    onSignedIn();
  };

  const title = "text-center text-[26px] font-medium leading-tight tracking-[-0.035em] sm:text-[30px]";
  const sub = "mt-2 text-center text-[16px] leading-snug text-ink-2";

  if (ready && user) {
    return (
      <div className={className}>
        <H className={title}>Hello, {user.name.split(" ")[0]}.</H>
        <p className={sub}>You’re signed in as {user.email}.</p>
        <div className="mt-8 flex flex-col gap-3">
          <LinkButton href={continueHref} size="lg" full onClick={onSignedIn}>Continue</LinkButton>
          <button type="button" onClick={() => (logout(), toast({ title: "Signed out" }))} className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] border border-ink text-[16px] font-semibold transition-colors hover:bg-ink hover:text-white">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {step === "identify" && (
        <form onSubmit={send} noValidate>
          <H className={title}>Log in or sign up</H>
          <p className={sub}>Get personalised suggestions, offers &amp; more</p>
          <div className="mt-8 space-y-5">
            {mode === "mobile" ? (
              <GreyField id={`${uid}-mobile`} label="Enter mobile no." error={error}>
                <div className="flex items-center gap-2 px-4 pb-2.5 text-[18px]">
                  <span aria-hidden className="text-ink">+91</span>
                  <input
                    id={`${uid}-mobile`}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="XXX-XXX-XXXX"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${uid}-mobile-err` : undefined}
                    data-autofocus
                    value={group(digits)}
                    onChange={(e) => (setDigits(mobileDigits(e.target.value)), setError(null))}
                    className="h-9 min-w-0 flex-1 bg-transparent text-[18px] tabular-nums text-ink placeholder:text-ink-3"
                  />
                </div>
              </GreyField>
            ) : (
              <GreyField id={`${uid}-email`} label="Enter email" error={error}>
                <input
                  id={`${uid}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${uid}-email-err` : undefined}
                  data-autofocus
                  value={email}
                  onChange={(e) => (setEmail(e.target.value), setError(null))}
                  className="h-11 w-full bg-transparent px-4 pb-1 text-[18px] text-ink placeholder:text-ink-3"
                />
              </GreyField>
            )}
            <PrimaryButton enabled={canSend} label="Get OTP" hint="send code" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <button type="button" onClick={() => (setMode(mode === "mobile" ? "email" : "mobile"), setError(null))} className="link-u tap text-[14px] font-semibold text-pink">
              {mode === "mobile" ? "Use email instead" : "Use mobile number instead"}
            </button>
            <button type="button" onClick={() => (setMode("mobile"), setDigits(DEMO_MOBILE), setError(null))} className="link-u tap text-[14px] font-semibold text-pink">
              Use the demo account ({formatMobile(DEMO_MOBILE)})
            </button>
          </div>
          <SimulatedNotice className="mt-6">Prototype sign-in. No SMS or email is sent and no password is stored — the code is always <strong className="tabular-nums">{PROTOTYPE_OTP}</strong>.</SimulatedNotice>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={(e) => (e.preventDefault(), verify(code))} noValidate>
          <button type="button" onClick={() => (setStep("identify"), setError(null))} className="tap -ml-1 mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-2 hover:text-ink">
            <ArrowLeft size={16} aria-hidden /> Change
          </button>
          <H className={title}>Enter the code.</H>
          <p className={sub}>We sent a 6-digit code to <strong className="font-semibold text-ink">{/^\d+$/.test(normaliseTarget(target)) ? maskMobile(normaliseTarget(target)) : maskEmail(normaliseTarget(target))}</strong>.</p>
          <div className="mt-8 space-y-5">
            <GreyField id={`${uid}-otp`} label="One-time code" error={error}>
              <input
                ref={codeRef}
                id={`${uid}-otp`}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${uid}-otp-err` : undefined}
                value={code}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(v);
                  setError(null);
                  if (v.length === 6) verify(v);
                }}
                className="h-11 w-full bg-transparent px-4 pb-1 text-[22px] tabular-nums tracking-[0.5em] text-ink placeholder:text-ink-3"
              />
            </GreyField>
            <PrimaryButton enabled={code.length === 6} label="Verify & continue" />
          </div>
          <p className="mt-4 text-center text-[14px] text-ink-2">
            {seconds > 0 ? `Resend code in ${seconds}s` : <button type="button" onClick={() => send()} className="link-u tap font-semibold text-pink">Resend code</button>}
          </p>
          <SimulatedNotice className="mt-6">Prototype code: <strong className="tabular-nums tracking-[0.2em]">{PROTOTYPE_OTP}</strong></SimulatedNotice>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={create} noValidate>
          <H className={title}>Nice to meet you.</H>
          <p className={sub}>A few details and your account is ready — stored on this device only.</p>
          <div className="mt-8 space-y-5">
            <Input label="Full name" autoComplete="name" value={profile.name} onChange={(e) => (setProfile({ ...profile, name: e.target.value }), setPerr({}))} error={perr.name} autoFocus />
            <Input label="Email" type="email" autoComplete="email" value={profile.email} onChange={(e) => (setProfile({ ...profile, email: e.target.value }), setPerr({}))} error={perr.email} />
            <Input label="Mobile number" inputMode="numeric" autoComplete="tel-national" prefix="+91" value={profile.mobile} onChange={(e) => (setProfile({ ...profile, mobile: mobileDigits(e.target.value) }), setPerr({}))} error={perr.mobile} />
            <PrimaryButton enabled label="Create account" />
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-[13px] text-ink-3"><ShieldCheck size={14} aria-hidden /> No password. No data leaves your browser.</p>
        </form>
      )}

      <p className="mt-8 text-center text-[13px] leading-snug text-ink-2">
        By continuing, I agree to Nykaa Fashion’s<br />
        <Link href="/info/terms" className="underline underline-offset-2">Terms &amp; Conditions</Link> and <Link href="/info/privacy" className="underline underline-offset-2">Privacy Policy</Link>
      </p>
    </div>
  );
}
