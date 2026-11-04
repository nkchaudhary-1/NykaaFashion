import { connection } from "next/server";
import { disclosure } from "@/components/tryon/copy.ts";
import { TryOnDemo } from "@/components/shop/TryOnDemo";
import { resolveConfig } from "@/lib/config";

export default async function Page() {
  // The mode comes from server env at request time: a static prerender would bake in whatever the build saw.
  await connection();
  const config = resolveConfig();
  const note = disclosure(config.mode, { maxSessionSeconds: config.maxSessionSeconds });

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6 lg:px-10">
      <header className="flex items-baseline justify-between gap-4 py-6 sm:py-8">
        <p className="font-serif text-[26px] italic leading-none tracking-[-0.01em]">Looking Glass</p>
        <p className="text-[13px] text-ink-3">Sample store · sample products</p>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h1 className="max-w-[16ch] text-balance font-serif text-[clamp(2.5rem,6.2vw,4.25rem)] leading-[0.98] tracking-[-0.02em]">
            Try it on yourself, on this page.
          </h1>
          <p className="max-w-[36ch] pb-1 text-[17px] leading-relaxed text-ink-2 sm:text-lg">
            Click Try on any piece and see it on you, live. Switch between looks instantly.
          </p>
        </div>

        <TryOnDemo config={config} />
      </main>

      <footer className="mt-16 grid gap-6 border-t border-line pt-8 text-[14px] leading-relaxed text-ink-2 sm:mt-24 lg:grid-cols-2 lg:gap-12">
        <div>
          <h2 className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">{note.title}</h2>
          <p className="max-w-[62ch]" data-testid="disclosure">
            {note.body}
          </p>
        </div>
        <div>
          <h2 className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">About this demo</h2>
          <p className="max-w-[62ch]">
            A standalone interface study for live, camera-based AI. Sample garments only. There is no cart, checkout or
            account, and this site stores no video or photos. Local and private review only.
          </p>
        </div>
      </footer>
    </div>
  );
}
