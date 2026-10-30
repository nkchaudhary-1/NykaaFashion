"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Img, SIZES } from "@/components/ui/Img";
import { Input } from "@/components/ui/Form";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { formatMobile, maskEmail, maskMobile } from "@/lib/format";
import { DEMO_MOBILE, PROTOTYPE_OTP, createAccount, logout, normaliseTarget, sendOtp, useAuth, validateTarget, verifyOtp } from "@/stores/account";
import { toast } from "@/stores/ui";

type Step = "identify" | "otp" | "profile";
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

/** Mobile/email OTP sign-in + first-time profile. Entirely simulated: no SMS or email is sent. */
export function LoginFlow() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { user, ready } = useAuth();
  const [step, setStep] = useState<Step>("identify");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [profile, setProfile] = useState({ name: "", email: "", mobile: "" });
  const [perr, setPerr] = useState<Record<string, string>>({});
  const codeRef = useRef<HTMLInputElement>(null);

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
      router.replace(next);
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
    router.replace(next);
  };

  return (
    <div className="container-x grid grid-cols-1 gap-0 pb-20 pt-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:pt-8">
      <div className="relative hidden lg:block">
        <div className="arch sticky top-[calc(var(--header-h)+24px)] overflow-hidden">
          <Img imgKey="scenes/auth-side" alt="" sizes={SIZES.half} ratio="4/5" priority />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent p-8 pt-24 text-bone">
            <p className="display-sm max-w-[16ch]">Discover by taste, not discount.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md py-6 lg:py-16">
        {ready && user ? (
          <div>
            <p className="eyebrow text-ink-3">Signed in</p>
            <h1 className="display-md mt-3">Hello, {user.name.split(" ")[0]}.</h1>
            <p className="mt-3 text-ink-2">You’re signed in as {user.email}.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={next} size="lg">Continue</LinkButton>
              <Button variant="secondary" size="lg" onClick={() => (logout(), toast({ title: "Signed out" }))}>Sign out</Button>
            </div>
          </div>
        ) : step === "identify" ? (
          <form onSubmit={send} noValidate>
            <p className="eyebrow text-ink-3">Sign in or create an account</p>
            <h1 className="display-md mt-3">Welcome.</h1>
            <p className="mt-4 text-[15px] text-ink-2">Enter your mobile number or email. New here? We’ll set you up in a moment.</p>
            <div className="mt-8 space-y-5">
              <Input label="Mobile number or email" autoComplete="username" inputMode="email" value={target} onChange={(e) => (setTarget(e.target.value), setError(null))} error={error} data-autofocus autoFocus hint="We’ll send a one-time code (simulated)." />
              <Button type="submit" size="lg" full>Send code</Button>
            </div>
            <button type="button" onClick={() => (setTarget(DEMO_MOBILE), setError(null))} className="link-u mt-6 inline-block text-[13px] text-ink">
              Use the demo account ({formatMobile(DEMO_MOBILE)})
            </button>
            <SimulatedNotice className="mt-8">Prototype sign-in. No SMS or email is sent and no password is stored — the code is always <strong>{PROTOTYPE_OTP}</strong>.</SimulatedNotice>
          </form>
        ) : step === "otp" ? (
          <form onSubmit={(e) => (e.preventDefault(), verify(code))} noValidate>
            <button type="button" onClick={() => (setStep("identify"), setError(null))} className="mb-6 inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink">
              <ArrowLeft size={15} aria-hidden /> Change
            </button>
            <h1 className="display-md">Enter the code.</h1>
            <p className="mt-4 text-[15px] text-ink-2">We sent a 6-digit code to <strong className="font-medium text-ink">{/^\d+$/.test(normaliseTarget(target)) ? maskMobile(normaliseTarget(target)) : maskEmail(normaliseTarget(target))}</strong>.</p>
            <div className="mt-8 space-y-5">
              <Input ref={codeRef} label="One-time code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setCode(v); setError(null); if (v.length === 6) verify(v); }} error={error} className="text-center text-[22px] tracking-[0.5em]" />
              <Button type="submit" size="lg" full disabled={code.length !== 6}>Verify &amp; continue</Button>
            </div>
            <p className="mt-5 text-[13px] text-ink-3">
              {seconds > 0 ? `Resend code in ${seconds}s` : <button type="button" onClick={() => send()} className="link-u text-ink">Resend code</button>}
            </p>
            <SimulatedNotice className="mt-8">Prototype code: <strong className="font-mono tracking-widest">{PROTOTYPE_OTP}</strong></SimulatedNotice>
          </form>
        ) : (
          <form onSubmit={create} noValidate>
            <h1 className="display-md">Nice to meet you.</h1>
            <p className="mt-4 text-[15px] text-ink-2">A few details and your account is ready — stored on this device only.</p>
            <div className="mt-8 space-y-5">
              <Input label="Full name" autoComplete="name" value={profile.name} onChange={(e) => (setProfile({ ...profile, name: e.target.value }), setPerr({}))} error={perr.name} autoFocus />
              <Input label="Email" type="email" autoComplete="email" value={profile.email} onChange={(e) => (setProfile({ ...profile, email: e.target.value }), setPerr({}))} error={perr.email} />
              <Input label="Mobile number" inputMode="numeric" autoComplete="tel-national" maxLength={10} prefix="+91" value={profile.mobile} onChange={(e) => (setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, "") }), setPerr({}))} error={perr.mobile} />
              <Button type="submit" size="lg" full>Create account</Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[12.5px] text-ink-3"><ShieldCheck size={14} aria-hidden /> No password. No data leaves your browser.</p>
          </form>
        )}
        <p className="mt-10 text-[12.5px] text-ink-3">By continuing you agree this is a <Link href="/info/terms" className="underline underline-offset-4">design prototype</Link>.</p>
      </div>
    </div>
  );
}

export { validateTarget };
