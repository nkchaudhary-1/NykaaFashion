"use client";
import { PenLine, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { Stars } from "@/components/ui/Rating";
import { SimulatedTag } from "@/components/ui/Simulated";
import { reviewsFor } from "@/data/reviews";
import type { Product, Review } from "@/data/types";
import { cn } from "@/lib/cn";
import { nowMs } from "@/lib/clock";
import { fmtDate } from "@/lib/format";
import { useAuth } from "@/stores/account";
import { prefsStore, toast, usePrefs } from "@/stores/ui";

type Sort = "helpful" | "newest" | "high" | "low";

/** Reviews are pattern-only mock content (PRD §5.5): summary, fit signal, sort/filter, helpful votes, and a working "write a review". */
export function Reviews({ product }: { product: Product }) {
  const prefs = usePrefs();
  const { user } = useAuth();
  const [sort, setSort] = useState<Sort>("helpful");
  const [star, setStar] = useState(0);
  const [shown, setShown] = useState(4);
  const [writing, setWriting] = useState(false);

  const own = prefs.reviews.filter((r) => r.productId === product.id);
  const all = useMemo(() => [...own, ...reviewsFor(product.id)], [own, product.id]);
  const total = product.ratingCount + own.length;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, pct: Math.round((all.filter((r) => r.rating === n).length / all.length) * 100) }));
  const fit = { small: all.filter((r) => r.fit === "small").length, true: all.filter((r) => r.fit === "true").length, large: all.filter((r) => r.fit === "large").length };
  const fitPos = ((fit.small * 0 + fit.true * 50 + fit.large * 100) / Math.max(1, all.length));

  const list = useMemo(() => {
    const f = star ? all.filter((r) => r.rating === star) : all;
    const by: Record<Sort, (a: Review, b: Review) => number> = {
      helpful: (a, b) => b.helpful - a.helpful,
      newest: (a, b) => b.date.localeCompare(a.date),
      high: (a, b) => b.rating - a.rating,
      low: (a, b) => a.rating - b.rating,
    };
    return [...f].sort(by[sort]);
  }, [all, sort, star]);

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="container-x scroll-mt-24 py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 flex items-center gap-3 text-ink-3">Reviews <SimulatedTag>Sample content</SimulatedTag></p>
          <h2 id="reviews-h" className="display-md">What people say.</h2>
        </div>
        <Button variant="secondary" icon={<PenLine size={15} />} onClick={() => setWriting(true)}>
          Write a review
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20">
        <div>
          <p className="flex items-end gap-3">
            <span className="display-lg leading-none">{product.rating.toFixed(1)}</span>
            <span className="pb-1.5 text-[13px] text-ink-3">out of 5 · {total.toLocaleString("en-IN")} ratings</span>
          </p>
          <Stars value={product.rating} size={18} className="mt-3" />
          <ul className="mt-6 space-y-2" aria-label="Rating breakdown">
            {dist.map((d) => (
              <li key={d.n}>
                <button type="button" onClick={() => setStar(star === d.n ? 0 : d.n)} aria-pressed={star === d.n} className={cn("flex w-full items-center gap-3 py-1 text-[13px] tabular-nums [@media(pointer:coarse)]:min-h-11", star === d.n ? "font-medium text-ink" : "text-ink-2 hover:text-ink")}>
                  <span className="w-6 text-left">{d.n}★</span>
                  <span className="h-1.5 flex-1 overflow-hidden bg-line"><span className="block h-full bg-ink" style={{ width: `${d.pct}%` }} /></span>
                  <span className="w-9 text-right text-ink-3">{d.pct}%</span>
                </button>
              </li>
            ))}
          </ul>
          {product.sizes.length > 1 && (
            <div className="mt-8">
              <p className="mb-3 text-[13px] font-medium">How it fits</p>
              <div className="relative h-1.5 bg-line" role="img" aria-label={`Customers say it runs ${fitPos < 38 ? "small" : fitPos > 62 ? "large" : "true to size"}`}>
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bone bg-ink" style={{ left: `${Math.min(92, Math.max(8, fitPos))}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11.5px] text-ink-3"><span>Runs small</span><span>True to size</span><span>Runs large</span></div>
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-[13px] text-ink-3" aria-live="polite">{star ? `${list.length} reviews with ${star}★` : `${all.length} reviews`}{star ? <button type="button" className="link-u ml-3 text-ink" onClick={() => setStar(0)}>Clear</button> : null}</p>
            <Select aria-label="Sort reviews" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 w-auto min-w-[170px] text-[13px]">
              <option value="helpful">Most helpful</option>
              <option value="newest">Newest</option>
              <option value="high">Highest rated</option>
              <option value="low">Lowest rated</option>
            </Select>
          </div>
          <ul>
            {list.slice(0, shown).map((r) => (
              <ReviewItem key={r.id} r={r} voted={prefs.helpful.includes(r.id)} />
            ))}
            {list.length === 0 && <li className="py-10 text-[14px] text-ink-3">No reviews with that rating yet.</li>}
          </ul>
          {shown < list.length && (
            <Button variant="secondary" className="mt-6" onClick={() => setShown((n) => n + 4)}>
              Show more reviews
            </Button>
          )}
        </div>
      </div>

      <Overlay open={writing} onClose={() => setWriting(false)} label="Write a review" side="center" panelClassName="sm:w-[min(94vw,600px)] sm:max-h-[92dvh]">
        <OverlayHeader title="Write a review" sub={product.name} />
        <OverlayBody>
          <ReviewForm product={product} name={user?.name} onDone={() => setWriting(false)} />
        </OverlayBody>
      </Overlay>
    </section>
  );
}

function ReviewItem({ r, voted }: { r: Review; voted: boolean }) {
  return (
    <li className="border-b border-line py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={r.rating} size={14} />
        <p className="text-[14.5px] font-medium">{r.title}</p>
        {r.own && <span className="inline-flex h-5 items-center bg-ink px-2 text-[10px] font-medium uppercase tracking-wider text-bone">Your review</span>}
      </div>
      <p className="mt-3 max-w-[64ch] text-[14.5px] leading-relaxed text-ink-2">{r.body}</p>
      <p className="mt-3 text-[12.5px] text-ink-3">
        {r.author}{r.verified ? " · Verified buyer (sample)" : ""} · {fmtDate(r.date, { day: "numeric", month: "short", year: "numeric" })} · Bought size {r.size} · {r.fit === "true" ? "True to size" : r.fit === "small" ? "Runs small" : "Runs large"}
      </p>
      <button type="button" aria-pressed={voted} onClick={() => prefsStore.set((p) => ({ ...p, helpful: voted ? p.helpful.filter((x) => x !== r.id) : [...p.helpful, r.id] }))} className={cn("mt-3 inline-flex h-9 items-center gap-2 border px-3 text-[12.5px] [@media(pointer:coarse)]:h-11 transition-colors", voted ? "border-ink bg-ink text-bone" : "border-line-strong text-ink-2 hover:border-ink")}>
        <ThumbsUp size={14} aria-hidden /> Helpful · {r.helpful + (voted ? 1 : 0)}
      </button>
    </li>
  );
}

function ReviewForm({ product, name, onDone }: { product: Product; name?: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [size, setSize] = useState(product.sizes[0]);
  const [fit, setFit] = useState<Review["fit"]>("true");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!rating) err.rating = "Choose a star rating.";
    if (title.trim().length < 3) err.title = "Add a short title.";
    if (body.trim().length < 20) err.body = "Tell us a little more — at least 20 characters.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const review: Review = { id: `own-${product.id}-${nowMs()}`, productId: product.id, author: name ?? "You", rating, title: title.trim(), body: body.trim(), size, fit, verified: false, helpful: 0, date: new Date(nowMs()).toISOString().slice(0, 10), own: true };
    prefsStore.set((p) => ({ ...p, reviews: [review, ...p.reviews] }));
    toast({ title: "Thanks for your review", description: "Saved on this device — reviews are simulated in this prototype." });
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-[12.5px] font-medium">Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" className="peer sr-only" checked={rating === n} onChange={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} />
              <span className={cn("inline-flex size-11 items-center justify-center text-[26px] leading-none transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink", n <= rating ? "text-ink" : "text-line-strong hover:text-ink-3")}>★</span>
            </label>
          ))}
        </div>
        {errors.rating && <p role="alert" className="mt-1 text-[12.5px] font-medium text-danger">{errors.rating}</p>}
      </fieldset>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={80} />
      <Textarea label="Your review" value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} hint="How does it fit? How does the fabric feel?" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {product.sizes.length > 1 && (
          <Select label="Size you bought" value={size} onChange={(e) => setSize(e.target.value)}>
            {product.sizes.map((s) => (<option key={s}>{s}</option>))}
          </Select>
        )}
        <Select label="How did it fit?" value={fit} onChange={(e) => setFit(e.target.value as Review["fit"])}>
          <option value="small">Runs small</option>
          <option value="true">True to size</option>
          <option value="large">Runs large</option>
        </Select>
      </div>
      <Button type="submit" full size="lg">Submit review</Button>
    </form>
  );
}
