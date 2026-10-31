"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { Section } from "@/components/layout/Section";
import { Rise } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONIC_BRANDS } from "@/data/home-content";
import { labelById } from "@/data/labels";
import { productsByLabel } from "@/data/queries";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { signal } from "@/stores/intent";
import { FINE_POINTER, heroImg, inStock, maxOff, REDUCED_MOTION, styles, useMedia } from "./kit";

/*
 * Iconic brands as a typographic list: the name at display size, the real discount at the right. With a mouse the brand's picture follows the pointer (a fixed,
 * aria-hidden frame moved by a requestAnimationFrame lerp); keyboard focus parks it beside the focused row. Touch screens, and visitors who asked for reduced
 * motion, get a small thumbnail in every row instead — so nothing is hover-only.
 */
const FW = 260; // follower width
const FH = 325; // 4:5

export function IconicBrands() {
  const rows = ICONIC_BRANDS.map((id) => {
    const label = labelById[id];
    const list = inStock(productsByLabel(id));
    return { id, name: label.name, hon: !!label.flags.houseOfNykaa, n: list.length, off: maxOff(list), img: heroImg([...list].sort((a, b) => a.rank - b.rank)[0]) };
  });
  const fine = useMedia(FINE_POINTER);
  const reduced = useMedia(REDUCED_MOTION);
  const follow = fine && !reduced;
  const [hot, setHot] = useState<number | null>(null);
  const [armed, setArmed] = useState(false); // the follower's pictures load once the list is near the screen
  const frame = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const p = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, placed: false });

  useEffect(() => {
    const el = list.current;
    if (!el || !follow) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setArmed(true), io.disconnect()), { rootMargin: "700px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [follow]);

  const tick = useCallback(function step() {
    const s = p.current;
    const el = frame.current;
    if (!el) {
      s.raf = 0;
      return;
    }
    s.x += (s.tx - s.x) * 0.15;
    s.y += (s.ty - s.y) * 0.15;
    el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
    s.raf = Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > 0.2 ? requestAnimationFrame(step) : 0;
  }, []);
  const aim = useCallback(
    (x: number, y: number, snap = false) => {
      const s = p.current;
      s.tx = x;
      s.ty = y;
      if (snap || !s.placed) {
        s.x = x;
        s.y = y;
        s.placed = true;
      }
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    },
    [tick],
  );
  useEffect(() => () => cancelAnimationFrame(p.current.raf), []);

  const onMove = (e: React.PointerEvent) => {
    if (!follow || e.pointerType !== "mouse") return;
    const right = e.clientX + 44 + FW > window.innerWidth - 16;
    aim(right ? e.clientX - 44 - FW : e.clientX + 44, Math.min(Math.max(e.clientY - FH / 2, 8), window.innerHeight - FH - 8));
  };
  const leave = () => {
    setHot(null);
    p.current.placed = false;
  };
  const focusRow = (i: number) => (e: FocusEvent<HTMLAnchorElement>) => {
    if (!follow || !e.currentTarget.matches(":focus-visible")) return;
    const r = e.currentTarget.getBoundingClientRect();
    setHot(i);
    aim(Math.max(16, Math.min(r.right - FW - 220, window.innerWidth - FW - 16)), Math.min(Math.max(r.top + r.height / 2 - FH / 2, 8), window.innerHeight - FH - 8), true);
  };

  return (
    <Section tone="paper">
      <SectionHeading eyebrow="Brands" title={<>Iconic brands, <em>unreal savings</em></>} href="/brands" hrefLabel="All brands" size="lg" />
      <ul ref={list} className="mt-12 border-t border-ink sm:mt-16" onPointerMove={onMove} onPointerLeave={leave}>
        {rows.map((r, i) => (
          <Rise as="li" key={r.id} className="border-b border-line" onPointerEnter={(e: React.PointerEvent) => follow && e.pointerType === "mouse" && setHot(i)}>
            <Link
              href={`/brands/${r.id}`}
              onClick={() => (signal("discount_interaction"), track("home_module_click", { moduleType: "brands", via: r.id }))}
              onFocus={focusRow(i)}
              onBlur={() => follow && setHot(null)}
              className={cn("group grid items-center gap-x-4 py-5 transition-colors duration-500 ease-editorial sm:py-7 lg:grid-cols-12 lg:gap-x-[var(--gap)]", follow ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[3rem_minmax(0,1fr)_auto]", follow && hot !== null && hot !== i ? "text-ink-3" : "text-ink")}
            >
              {!follow && (
                <span aria-hidden className="block w-12 overflow-hidden bg-sand lg:col-span-1">
                  <Img imgKey={r.img} alt="" sizes="48px" ratio="4/5" />
                </span>
              )}
              <span className={cn("block min-w-0", follow ? "lg:col-span-8" : "lg:col-span-7")}>
                <span className="display-lg block">{r.name}</span>
                {r.hon && <span className="mt-2 inline-block bg-pink px-2 py-1 text-[9.5px] font-bold uppercase leading-none tracking-[0.1em] text-white">House of Nykaa</span>}{" "}
                <span className="mt-2 block text-[13px] text-ink-3 lg:hidden">
                  {styles(r.n)}
                  {r.off > 0 && <span className="font-semibold text-emerald sm:hidden"> · Up to {r.off}% off</span>}
                </span>
              </span>{" "}
              <span className="hidden flex-col items-end gap-1 text-right sm:flex lg:col-span-4">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-emerald lg:text-[clamp(1.25rem,2vw,1.875rem)] lg:font-medium lg:normal-case lg:tracking-[-0.034em]">{r.off > 0 ? `Up to ${r.off}% off` : "New arrivals"}</span>
                <span className="hidden items-center gap-2 text-[13px] text-ink-3 lg:flex">
                  {styles(r.n)}
                  <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden className="transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </Rise>
        ))}
      </ul>
      {follow &&
        armed &&
        createPortal(
          <div
            ref={(node) => {
              frame.current = node;
              // a row focused before the pictures were mounted still gets its position
              if (node) node.style.transform = `translate3d(${p.current.x.toFixed(1)}px, ${p.current.y.toFixed(1)}px, 0)`;
            }}
            aria-hidden
            data-nogrid
            className={cn("pointer-events-none fixed left-0 top-0 z-30 overflow-hidden bg-sand transition-opacity duration-500 ease-expo", hot === null ? "opacity-0" : "opacity-100")}
            style={{ width: FW, height: FH }}
          >
            {rows.map((r, i) => (
              <span key={r.id} className={cn("absolute inset-0 block transition-opacity duration-500 ease-expo", i === hot ? "opacity-100" : "opacity-0")}>
                <Img imgKey={r.img} alt="" sizes={`${FW}px`} ratio="fill" className="absolute inset-0 h-full w-full" />
              </span>
            ))}
          </div>,
          document.body,
        )}
    </Section>
  );
}
