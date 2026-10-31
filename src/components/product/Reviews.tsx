"use client";
import { BadgeCheck, ChevronRight, PenLine, Star, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
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
const FIT = { small: "Runs small", true: "True to size", large: "Runs large" } as const;
const date = (iso: string) => fmtDate(iso, { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * "Rating & Reviews" as on the live page — a grey summary strip (rating · ratings · reviews), the most helpful review and a
 * "Read all Reviews" row that opens every review (sort, star filter, fit, helpful votes, write a review) in a right-hand drawer.
 * Reviews are pattern-only mock content (PRD §5.5) and labelled as sample content.
 */
export function RatingReviews({ product }: { product: Product }) {
  const prefs = usePrefs();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [sort, setSort] = useState<Sort>("helpful");
  const [star, setStar] = useState(0);
  const [shown, setShown] = useState(5);

  const own = prefs.reviews.filter((r) => r.productId === product.id);
  const all = useMemo(() => [...own, ...reviewsFor(product.id)], [own, product.id]);
  const total = product.ratingCount + own.length;
  const top = useMemo(() => [...all].sort((a, b) => b.helpful - a.helpful)[0], [all]);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, pct: Math.round((all.filter((r) => r.rating === n).length / all.length) * 100) }));
  const fit = { small: all.filter((r) => r.fit === "small").length, large: all.filter((r) => r.fit === "large").length, true: all.filter((r) => r.fit === "true").length };
  const fitPos = (fit.true * 50 + fit.large * 100) / Math.max(1, all.length);

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

  const showFit = product.sizes.length > 1;
  return (
    <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-h" className="text-[19px] font-medium leading-tight tracking-[-0.02em]">
          Rating &amp; Reviews
        </h2>
        <SimulatedTag>Sample content</SimulatedTag>
      </div>

      <ul aria-label="Rating summary" className="mt-4 grid grid-cols-[1.5fr_1fr_1fr] items-center bg-sand py-4">
        <li className="flex items-center gap-2 px-4 text-[30px] font-semibold leading-none tabular-nums">
          {product.rating.toFixed(1)} <Star size={22} aria-hidden className="fill-ink text-ink" />
          <span className="sr-only">out of 5 average rating</span>
        </li>
        <li className="flex flex-col border-l border-line-strong px-4">
          <span className="text-[16px] font-semibold tabular-nums">{total.toLocaleString("en-IN")}</span>
          <span className="mt-0.5 text-[11.5px] text-ink-3">Ratings</span>
        </li>
        <li className="flex flex-col border-l border-line-strong px-4">
          <span className="text-[16px] font-semibold tabular-nums">{all.length}</span>
          <span className="mt-0.5 text-[11.5px] text-ink-3">Reviews</span>
        </li>
      </ul>

      {top && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-semibold">Most Helpful Review</h3>
            <button type="button" onClick={() => setWriting(true)} className="link-u tap inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-pink hover:text-pink-ink">
              <PenLine size={14} aria-hidden /> Write a review
            </button>
          </div>
          <ReviewCard r={top} voted={prefs.helpful.includes(top.id)} className="mt-3" />
        </div>
      )}

      <button type="button" onClick={() => setOpen(true)} className="mt-4 flex h-12 w-full items-center justify-between border border-line-strong px-4 text-[14px] font-semibold transition-colors hover:border-ink">
        Read all Reviews
        <ChevronRight size={18} aria-hidden />
      </button>

      <Overlay open={open} onClose={() => setOpen(false)} label="Ratings and reviews" side="right" panelClassName="sm:w-[min(100vw,560px)]">
        <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pr-16">
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">Rating &amp; Reviews</h2>
          <p className="mt-1 truncate text-[13.5px] text-ink-3">{product.name}</p>
        </div>
        <OverlayBody>
          <div className="flex items-center gap-5">
            <p className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.03em]">{product.rating.toFixed(1)}</p>
            <div>
              <Stars value={product.rating} size={18} />
              <p className="mt-1.5 text-[13px] text-ink-3">{total.toLocaleString("en-IN")} ratings · {all.length} reviews</p>
            </div>
          </div>
          <ul className="mt-5 space-y-1" aria-label="Rating breakdown">
            {dist.map((d) => (
              <li key={d.n}>
                <button type="button" onClick={() => setStar(star === d.n ? 0 : d.n)} aria-pressed={star === d.n} className={cn("flex w-full items-center gap-3 py-1.5 text-[13px] tabular-nums [@media(pointer:coarse)]:min-h-11", star === d.n ? "font-semibold text-pink-ink" : "text-ink-2 hover:text-ink")}>
                  <span className="w-6 text-left">{d.n}★</span>
                  <span className="h-1.5 flex-1 overflow-hidden bg-line">
                    <span className={cn("block h-full", star === d.n ? "bg-pink" : "bg-ink")} style={{ width: `${d.pct}%` }} />
                  </span>
                  <span className="w-9 text-right text-ink-3">{d.pct}%</span>
                </button>
              </li>
            ))}
          </ul>
          {showFit && (
            <div className="mt-6">
              <p className="mb-4 text-[13px] font-semibold">How it fits</p>
              <div className="relative h-1.5 bg-line" role="img" aria-label={`Customers say it runs ${fitPos < 38 ? "small" : fitPos > 62 ? "large" : "true to size"}`}>
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-ink" style={{ left: `${Math.min(92, Math.max(8, fitPos))}%` }} />
              </div>
              <div className="mt-2.5 flex justify-between text-[11.5px] text-ink-3">
                <span>Runs small</span>
                <span>True to size</span>
                <span>Runs large</span>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-[13px] text-ink-3" aria-live="polite">
              {star ? `${list.length} reviews with ${star}★` : `${all.length} reviews`}
              {star ? (
                <button type="button" className="link-u tap ml-3 font-semibold text-pink hover:text-pink-ink" onClick={() => setStar(0)}>
                  Clear
                </button>
              ) : null}
            </p>
            <Select aria-label="Sort reviews" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 w-auto min-w-[170px] text-[13px]">
              <option value="helpful">Most helpful</option>
              <option value="newest">Newest</option>
              <option value="high">Highest rated</option>
              <option value="low">Lowest rated</option>
            </Select>
          </div>
          <ul>
            {list.slice(0, shown).map((r) => (
              <li key={r.id} className="border-b border-line py-5">
                <ReviewCard r={r} voted={prefs.helpful.includes(r.id)} />
              </li>
            ))}
            {list.length === 0 && <li className="py-10 text-[14px] text-ink-3">No reviews with that rating yet.</li>}
          </ul>
          {shown < list.length && (
            <Button variant="secondary" className="mt-6" onClick={() => setShown((n) => n + 5)}>
              Show more reviews
            </Button>
          )}
          <Button className="mt-6" full icon={<PenLine size={15} />} onClick={() => setWriting(true)}>
            Write a review
          </Button>
        </OverlayBody>
      </Overlay>

      <Overlay open={writing} onClose={() => setWriting(false)} label="Write a review" side="center" z={75} panelClassName="sm:w-[min(94vw,600px)] sm:max-h-[92dvh]">
        <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 pr-14 sm:px-6">
          <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Write a review</h2>
          <p className="mt-1 truncate text-[13.5px] text-ink-3">{product.name}</p>
        </div>
        <OverlayBody>
          <ReviewForm product={product} name={user?.name} onDone={() => setWriting(false)} />
        </OverlayBody>
      </Overlay>
    </section>
  );
}

/** One review: name, verified line and date, a rating chip, the text, what the buyer chose, and a helpful vote. */
function ReviewCard({ r, voted, className }: { r: Review; voted: boolean; className?: string }) {
  return (
    <article className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-medium">
            {r.author}
            {r.own && <span className="inline-flex h-5 items-center bg-ink px-2 text-[10px] font-semibold uppercase tracking-wider text-white">Your review</span>}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-ink-3">
            {r.verified && <BadgeCheck size={14} aria-hidden className="mr-1.5 inline align-[-3px]" />}
            {r.verified ? "Verified buyer (sample)" : "Customer"} • Reviewed on: {date(r.date)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-line-strong px-2 py-1 text-[13px] font-semibold tabular-nums">
          <span className="sr-only">Rated </span>
          {r.rating} <Star size={13} aria-hidden className="fill-ink text-ink" />
          <span className="sr-only"> out of 5</span>
        </span>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-ink">
        <span className="font-semibold">{r.title}.</span> {r.body}
      </p>
      <p className="mt-2 text-[12.5px] text-ink-2">
        Bought size {r.size} • {FIT[r.fit]}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={voted}
          onClick={() => prefsStore.set((p) => ({ ...p, helpful: voted ? p.helpful.filter((x) => x !== r.id) : [...p.helpful, r.id] }))}
          className={cn("inline-flex h-9 items-center gap-2 border px-3 text-[12.5px] font-semibold transition-colors [@media(pointer:coarse)]:h-11", voted ? "border-ink bg-sand text-ink" : "border-line-strong text-ink hover:border-ink")}
        >
          <ThumbsUp size={14} aria-hidden /> Helpful
        </button>
        <span className="text-[12px] text-ink-3">
          {r.helpful + (voted ? 1 : 0)} {r.helpful + (voted ? 1 : 0) === 1 ? "person" : "people"} found this helpful
        </span>
      </div>
    </article>
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
