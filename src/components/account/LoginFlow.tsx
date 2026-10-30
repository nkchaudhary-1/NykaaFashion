"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/account/LoginForm";
import { Col, Grid } from "@/components/layout/Grid";
import { Logo } from "@/components/layout/Logo";
import { Img } from "@/components/ui/Img";
import { validateTarget } from "@/stores/account";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

/**
 * The /login page (deep links, and where protected pages send you): the same card as the sign-in modal — flat maroon band, white
 * wordmark, the OTP form — beside a flat image panel. 6 / 6 split: the image fills columns 1–6 and bleeds off the left edge
 * (an edge-to-edge band on phones), the card sits in columns 8–12 on desktop (7–12 on tablets).
 */
export function LoginFlow() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  return (
    <div className="container-x pb-[var(--section-y)] pt-4 sm:pt-6 lg:pt-8">
      <Grid className="gap-y-8 sm:gap-y-0">
        <Col span={{ base: 4, sm: 6, lg: 6 }} start={{ sm: 1, lg: 1 }} rowStart={{ sm: 1, lg: 1 }} className="relative aspect-[16/10] max-sm:-mx-[var(--gutter)] sm:-ml-[var(--edge)] sm:aspect-auto sm:min-h-[560px] lg:min-h-[680px]">
          <Img imgKey="scenes/auth-side" alt="" sizes="(min-width:600px) 56vw, 100vw" ratio="fill" load="eager" position="50% 40%" className="absolute inset-0 h-full" />
          <div className="edge-l absolute inset-x-0 bottom-0 bg-pink-tint py-4 pr-5 sm:py-5 sm:pr-8">
            <p className="display-xs max-w-[24ch] sm:text-[22px]">Discover by taste, not discount.</p>
          </div>
        </Col>

        <Col span={{ base: 4, sm: 6, lg: 5 }} start={{ sm: 7, lg: 8 }} rowStart={{ sm: 1, lg: 1 }} className="flex flex-col justify-center sm:pb-6 sm:pl-6 sm:pt-6 lg:pl-0 lg:pt-0">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-white">
            <div className="flex h-32 items-center justify-center bg-maroon">
              <Logo onDark size="lg" />
            </div>
            <LoginForm headingAs="h1" onSignedIn={() => router.replace(next)} continueHref={next} className="px-6 pb-8 pt-8 sm:px-8" />
          </div>
        </Col>
      </Grid>
    </div>
  );
}

export { validateTarget };
