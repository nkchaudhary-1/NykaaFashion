import { productById, rng } from "./catalog.ts";
import type { Review } from "./types.ts";

// Reviews are deterministic mock content seeded from the product id (PRD §5.5 — pattern-only).
const FIRST = ["Aarohi", "Kabir", "Mira", "Zoya", "Ananya", "Rohan", "Ishita", "Tanvi", "Aditya", "Sneha", "Nikhil", "Riya", "Karan", "Pooja", "Vikram", "Divya", "Aisha", "Siddharth", "Naina", "Arjun", "Kavya", "Rahul", "Simran", "Meera", "Dev", "Neha", "Yash", "Tara", "Imran", "Leela"];
const LAST = ["M.", "S.", "K.", "R.", "P.", "D.", "N.", "T.", "G.", "B.", "J.", "V."];

const POS: Array<[string, string]> = [
  ["Exactly as pictured", "The colour and finish are even better in person. {fit} Would happily buy from this label again."],
  ["Worth every rupee", "Beautifully made — you can feel the quality the moment you open the pack. {fit}"],
  ["My new favourite", "I have worn this three times in two weeks. {fit} Compliments every time."],
  ["Lovely fabric", "The fabric is soft, breathable and doesn't feel cheap at all. {fit}"],
  ["Great for the season", "Wore it to a family event and got asked where it was from. {fit}"],
  ["Quietly well made", "Seams are clean, finishing is neat and nothing feels rushed. {fit}"],
  ["Gift that landed", "Bought this as a gift and it was a hit. Packaging was lovely too. {fit}"],
  ["Looks expensive", "Looks and feels much pricier than it is. {fit}"],
];
const MID: Array<[string, string]> = [
  ["Good, not perfect", "Nice piece overall; the fabric is lovely but the colour is slightly different from the photos. {fit}"],
  ["Nice, runs a little off", "I like it, though I had to think about the size. {fit}"],
];
const NEG: Array<[string, string]> = [["Expected a bit more", "The idea is great but finishing on mine wasn't perfect. {fit} Customer care was quick to respond."]];

const FIT_TEXT = {
  small: "It runs a little small — I'd size up.",
  true: "True to size for me.",
  large: "It runs slightly large; consider sizing down.",
};

const BASE_EPOCH = Date.UTC(2026, 9, 30);

export function reviewsFor(productId: string): Review[] {
  const p = productById[productId];
  if (!p) return [];
  const r = rng(`reviews:${productId}`);
  const n = 6 + Math.floor(r() * 6);
  const out: Review[] = [];
  for (let i = 0; i < n; i++) {
    const roll = r();
    const rating = roll < 0.62 ? 5 : roll < 0.86 ? 4 : roll < 0.95 ? 3 : 2;
    const pool = rating >= 4 ? POS : rating === 3 ? MID : NEG;
    const [title, body] = pool[Math.floor(r() * pool.length)];
    const fitRoll = r();
    const fit: Review["fit"] = fitRoll < 0.18 ? "small" : fitRoll < 0.86 ? "true" : "large";
    const size = p.sizes[Math.floor(r() * p.sizes.length)];
    out.push({
      id: `${productId}-r${i}`,
      productId,
      author: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`,
      rating,
      title,
      body: body.replace("{fit}", p.sizes.length > 1 ? FIT_TEXT[fit] : "Looks exactly like the photos."),
      size,
      fit,
      verified: r() > 0.18,
      helpful: Math.floor(r() * r() * 40),
      date: new Date(BASE_EPOCH - Math.floor(r() * 220) * 86400000).toISOString().slice(0, 10),
    });
  }
  return out;
}
