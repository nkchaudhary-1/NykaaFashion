import Link from "next/link";
import { EditTile } from "@/components/editorial/EditTile";
import { LinkButton } from "@/components/ui/Button";
import { primaryEdits } from "@/data/edits";

export default function NotFound() {
  return (
    <div className="container-x pb-16 pt-16 sm:pt-28">
      <p className="eyebrow text-ink-3">404</p>
      <h1 className="display-xl mt-4 max-w-[12ch] text-balance">We lost <em>the thread.</em></h1>
      <p className="lede mt-8">That page has moved, or never existed. Start again from something curated.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/" size="lg">Back home</LinkButton>
        <LinkButton href="/discover" variant="secondary" size="lg">Read the Style Files</LinkButton>
      </div>
      <h2 className="eyebrow mb-6 mt-20 text-ink-3">Or start with an edit</h2>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {primaryEdits.slice(0, 3).map((e) => (<li key={e.id}><EditTile edit={e} source="404" sizes="(min-width:600px) 33vw, 100vw" /></li>))}
      </ul>
      <p className="mt-12 text-[13px] text-ink-3">Looking for something specific? Press <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-sans">/</kbd> to search, or visit the <Link href="/help" className="underline underline-offset-4">help centre</Link>.</p>
    </div>
  );
}
