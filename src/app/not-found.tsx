import { LostBento } from "@/components/editorial/LostBento";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <LostBento
      copy={
        <>
          <p className="eyebrow text-ink-3">404</p>
          <h1 className="display-lg mt-4 max-w-[12ch] text-balance">
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
