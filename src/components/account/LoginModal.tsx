"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LoginForm } from "@/components/account/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { useFocusTrap, useScrollLock } from "@/lib/a11y";
import { useHydrated } from "@/lib/store";
import { setUI, useUI } from "@/stores/ui";

/**
 * The sign-in modal of the live site, mounted once in the layout and opened with setUI({ loginOpen: true }): a centred card with a
 * flat maroon band and the white wordmark, a round white ✕ above its top-left corner, and the OTP form. Signing in closes it and leaves
 * the visitor where they were. (On /login the page itself carries the form, so the modal stays out of the way.)
 */
export function LoginModal() {
  const hydrated = useHydrated();
  const { loginOpen } = useUI();
  const pathname = usePathname();
  const onLoginPage = pathname.startsWith("/login");
  // following any link (the wordmark, a terms link) leaves the modal behind
  useEffect(() => {
    setUI({ loginOpen: false });
  }, [pathname]);
  if (!hydrated) return null;
  return createPortal(<AnimatePresence>{loginOpen && !onLoginPage && <Card key="login" />}</AnimatePresence>, document.body);
}

function Card() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const close = () => setUI({ loginOpen: false });
  useScrollLock(true);
  useFocusTrap(ref, true, close);
  // The header's account menu closes as it opens this, so the button that opened the modal can be gone by the time it closes:
  // hand focus to the visible account button instead of letting it fall to the page.
  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener && opener !== document.body && opener.isConnected) return;
      const accounts = Array.from(document.querySelectorAll<HTMLElement>('button[aria-label^="Account"]'));
      (accounts.find((el) => el.offsetParent !== null) ?? document.getElementById("main"))?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 pt-20">
      <motion.div className="fixed inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={close} aria-hidden />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Log in or sign up"
        tabIndex={-1}
        className="relative my-auto w-[min(100%,30rem)] outline-none"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: reduce ? 0.01 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* a round white ✕ above the card's top-left corner (inline radius: a circle by nature; the global control radius would otherwise win) */}
        <button type="button" onClick={close} aria-label="Close" style={{ borderRadius: "50%" }} className="absolute -top-14 left-0 inline-flex size-11 items-center justify-center bg-white text-ink transition-colors hover:bg-sand">
          <X size={22} strokeWidth={2} aria-hidden />
        </button>
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-white">
          <div className="flex h-36 items-center justify-center bg-maroon sm:h-44">
            <Logo onDark size="lg" />
          </div>
          <LoginForm onSignedIn={close} continueHref="/account" className="px-6 pb-8 pt-8 sm:px-10 sm:pb-10" />
        </div>
      </motion.div>
    </div>
  );
}
