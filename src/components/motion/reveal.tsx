import { Children, cloneElement, Fragment, isValidElement, type CSSProperties, type ElementType, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * Scroll reveals, as attributes. These are plain server-renderable components: they only emit `data-reveal` markup, and the single
 * <RevealObserver /> mounted in the layout adds `data-in` when an element enters the viewport. globals.css does the animating.
 * Nothing is hidden unless JavaScript is running (`html.js`, set by an inline script and withdrawn if hydration never happens), and
 * `prefers-reduced-motion` shows everything at once.
 */

const delayStyle = (delay?: number, y?: number): CSSProperties | undefined =>
  delay || y ? ({ ...(delay ? { "--rt-delay": `${delay}ms` } : null), ...(y ? { "--rt-y": `${y}px` } : null) } as CSSProperties) : undefined;

/** Splits text into words (inside any inline elements, e.g. <em>) that rise out of a mask, one after another. */
function split(node: ReactNode, counter: { i: number }): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
      .split(/(\s+)/)
      .map((part, k) =>
        part === "" || /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={k} className="rt-w">
            <span className="rt-i" style={{ "--i": counter.i++ } as CSSProperties}>
              {part}
            </span>
          </span>
        ),
      );
  }
  if (Array.isArray(node)) return node.map((n, k) => <Fragment key={k}>{split(n, counter)}</Fragment>);
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return typeof el.type === "string" ? cloneElement(el, undefined, split(el.props.children, counter)) : el;
  }
  return node;
}

/** A heading / paragraph whose words rise out of a mask on entry. `delay` in ms. */
export function RevealText({ children, as: Tag = "span", className, delay, style, ...rest }: { children: ReactNode; as?: ElementType; className?: string; delay?: number; style?: CSSProperties } & Record<string, unknown>) {
  return (
    <Tag className={className} data-reveal="text" style={{ ...style, ...delayStyle(delay) }} suppressHydrationWarning {...rest}>
      {split(children, { i: 0 })}
    </Tag>
  );
}

/** A block that fades up on entry (`y` = how far it travels, px). */
export function Rise({ children, as: Tag = "div", className, delay, y, style, ...rest }: { children: ReactNode; as?: ElementType; className?: string; delay?: number; y?: number; style?: CSSProperties } & Record<string, unknown>) {
  return (
    <Tag className={className} data-reveal="rise" style={{ ...style, ...delayStyle(delay, y) }} suppressHydrationWarning {...rest}>
      {children}
    </Tag>
  );
}

/** A block that only fades in (for large imagery, where movement would fight the picture). */
export function Fade({ children, as: Tag = "div", className, delay, style, ...rest }: { children: ReactNode; as?: ElementType; className?: string; delay?: number; style?: CSSProperties } & Record<string, unknown>) {
  return (
    <Tag className={className} data-reveal="fade" style={{ ...style, ...delayStyle(delay) }} suppressHydrationWarning {...rest}>
      {children}
    </Tag>
  );
}

/**
 * A picture frame that is uncovered from its bottom edge (clip-path) while the picture settles from a slight over-scale. Layout is untouched: only the paint is clipped.
 * The observed element is the plain wrapper; the clipped, overflow-hidden frame (`.rm-frame`) sits inside it, so an IntersectionObserver never sees a zero-area target
 * and the over-scaled picture cannot widen the page. Wrap pictures only — the frame also clips anything positioned outside it. Not for the first screen's LCP image (use `.settle`).
 */
export function RevealMedia({ children, as: Tag = "div", className, delay, style, ...rest }: { children: ReactNode; as?: ElementType; className?: string; delay?: number; style?: CSSProperties } & Record<string, unknown>) {
  return (
    <Tag className={cn(className)} data-reveal="media" style={{ ...style, ...delayStyle(delay) }} suppressHydrationWarning {...rest}>
      <div className="rm-frame">{children}</div>
    </Tag>
  );
}

/** Reveal each child in turn. Children must be DOM elements (`<li>`, `<div>` …): the attributes are added to them directly, so layout is untouched. */
export function Stagger({ children, step = 80, from = 0, y }: { children: ReactNode; step?: number; from?: number; y?: number }) {
  return Children.map(children, (child, i) => {
    if (!isValidElement(child) || typeof child.type !== "string") return child;
    const el = child as ReactElement<{ style?: CSSProperties }>;
    return cloneElement(el, { "data-reveal": "rise", suppressHydrationWarning: true, style: { ...el.props.style, ...delayStyle(from + i * step, y) } } as Record<string, unknown>);
  });
}
