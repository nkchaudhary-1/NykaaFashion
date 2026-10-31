import { LostBento } from "@/components/editorial/LostBento";
import { LinkButton } from "@/components/ui/Button";

/** A giant, decorative 404 (the page's one h1 carries the message for assistive tech), then the way back. */
const FIGURE = (
  <p aria-hidden className="select-none text-[clamp(8rem,34vw,30rem)] font-medium leading-[0.8] tracking-[-0.055em] text-ink">
    4<span className="text-pink">0</span>4
  </p>
);

export default function NotFound() {
  return (
    <LostBento
      figure={FIGURE}
      copy={
        <>
          <p className="eyebrow text-ink-3">Page not found</p>
          <h1 className="display-lg mt-5 max-w-[12ch] text-balance">
            We lost <em>the thread.</em>
          </h1>
          <p className="lede mt-6">That page has moved, or never existed. Start again from something curated.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/" size="lg">
              Back home
            </LinkButton>
            <LinkButton href="/discover" variant="secondary" size="lg">
              Read the Style Files
            </LinkButton>
          </div>
        </>
      }
    />
  );
}
