// The pop-up rules (src/lib/promo.ts), tested in Node with no browser: where a campaign may appear, what a launch campaign says before / on / after launch day,
// and the limits that keep a pop-up from feeling like an interruption (dismissal, cool-down, one visit's cap, urgent campaigns).
//   node scripts/qa/promo-unit.mjs
const P = await import("../../src/lib/promo.ts");
const { promos } = await import("../../src/data/promos.ts");
let failures = 0;
const check = async (name, fn) => {
  try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0]}`); }
};
const must = (c, m) => { if (!c) throw new Error(m); };
const H = 3_600_000, D = 24 * H;
const NOW = Date.parse("2026-10-31T12:00:00+05:30");
const pick = (o = {}) => P.pickPromo({ now: NOW, realNow: NOW, pathname: "/", memory: P.EMPTY_MEMORY, shown: [], ...o });
const id = (v) => v?.id ?? null;
console.log("Pop-up rules — src/lib/promo.ts");

await check("routes: '/' is the home page only; others match whole segments, ignoring slashes, query and hash", () => {
  const m = P.routeMatches;
  must(m("/", "/") && !m("/", "/c/women") && !m("/", "/discover"), "'/' must match the home page only");
  must(m("/c", "/c/women/dresses") && m("/c", "/c") && m("/c", "/c/") && m("/c", "/c?sort=new#x") && !m("/c", "/cart") && !m("/c", "/checkout"), "segment matching");
  must(m("/edits", "/edits/luxe") && !m("/edits", "/editsx"), "prefix must end on a segment");
});

await check("quiet pages never show one — not even when forced; product / help / info pages only when a campaign lists them", () => {
  for (const path of ["/checkout", "/checkout/confirmation/nf-1", "/bag", "/login", "/account", "/account/orders/nf-1", "/admin", "/prototype"]) {
    must(pick({ pathname: path }) === null, `${path} showed a pop-up`);
    must(pick({ pathname: path, force: "vrisa-teaser" }) === null, `${path} showed a forced pop-up`);
  }
  must(pick({ pathname: "/p/poppy-smocked-midi-dress" }) === null && pick({ pathname: "/help" }) === null && pick({ pathname: "/info/shipping" }) === null, "an unlisted page showed one");
  const listed = [{ ...promos.find((p) => p.id === "first-order"), routes: { include: ["/p"] } }];
  must(id(pick({ pathname: "/p/poppy-smocked-midi-dress", campaigns: listed })) === "first-order", "a campaign that lists /p was not shown there");
});

await check("campaign dates: nothing before it starts or after it ends", () => {
  const f = (iso) => P.resolveCampaign(promos.find((p) => p.id === "first-order"), Date.parse(iso));
  must(f("2026-11-30T12:00:00+05:30") && f("2026-12-01T00:00:00+05:30") === null, "first-order must end on 30 Nov");
  const d = (iso) => P.resolveCampaign(promos.find((p) => p.id === "delivery-notice"), Date.parse(iso));
  must(d("2026-10-29T12:00:00+05:30") === null && d("2026-11-01T12:00:00+05:30"), "delivery-notice must start on 30 Oct");
});

await check("a launch campaign writes itself: countdown before launch, 'Now live' after, gone after liveDays", () => {
  const c = promos.find((p) => p.id === "vrisa-teaser");
  const before = P.resolveCampaign(c, NOW);
  must(before.state === "countdown" && before.headline === "Vrisa arrives 14 November" && /^Launches in \d+d \d+h$/.test(before.meta) && before.cta.href === "/new-and-next/vrisa" && before.eyebrow === "New launch", JSON.stringify(before));
  const at = Date.parse("2026-11-14T11:00:00+05:30");
  const live = P.resolveCampaign(c, at + 1);
  must(live.state === "live" && live.eyebrow === "Now live" && live.cta.href === "/new-and-next/vrisa#shop" && live.cta.label === "Shop now", JSON.stringify(live));
  must(P.resolveCampaign(c, at - 1).state === "countdown", "one ms before launch is still a countdown");
  must(P.resolveCampaign(c, at + 7 * D + 1) === null && P.resolveCampaign(c, at + 6 * D), "a launch campaign must end 7 days after launch");
  must(P.timeLeft(13 * D + 22 * H + 5 * 60_000) === "13d 22h" && P.timeLeft(5 * H + 12 * 60_000) === "5h 12m" && P.timeLeft(42 * 60_000) === "42m" && P.timeLeft(-5) === "0m", "timeLeft formats");
  must(P.resolveCampaign({ ...c, launchId: "no-such-launch" }, NOW) === null, "a campaign for a missing launch must show nothing");
});

await check("priority picks the campaign for the page; the launch pages are never advertised on themselves", () => {
  must(id(pick({ pathname: "/" })) === "vrisa-teaser", "home should lead with the launch video");
  must(id(pick({ pathname: "/c/women/dresses" })) === "halden-preview", `women's listing: ${id(pick({ pathname: "/c/women/dresses" }))}`);
  must(id(pick({ pathname: "/search" })) === "first-order" || id(pick({ pathname: "/search" })) === "delivery-notice", "search");
  must(id(pick({ pathname: "/new-and-next" })) === "first-order", "the launch hub must not be advertised on itself, but the offer may show there");
  must(id(pick({ pathname: "/new-and-next/vrisa" })) !== "vrisa-teaser" && id(pick({ pathname: "/new-and-next/halden" })) !== "halden-preview", "a launch pop-up on its own launch pages");
  must(id(pick({ pathname: "/offers" })) === null || id(pick({ pathname: "/offers" })) !== "first-order", "the offer pointing at /offers showed on /offers");
});

await check("a dismissed campaign stays away for 7 days; nothing else appears for 24 h", () => {
  const dismissed = { dismissed: { "vrisa-teaser": NOW - 2 * H }, engaged: {}, lastDismissAt: NOW - 2 * H };
  must(pick({ memory: dismissed }) === null, "another pop-up appeared two hours after a dismissal");
  const later = { ...dismissed, dismissed: { "vrisa-teaser": NOW - 25 * H }, lastDismissAt: NOW - 25 * H };
  must(id(pick({ memory: later })) === "first-order", `after 25 h the next campaign should show; got ${id(pick({ memory: later }))}`);
  must(id(pick({ memory: { dismissed: { "vrisa-teaser": NOW - 8 * D }, engaged: {}, lastDismissAt: NOW - 8 * D } })) === "vrisa-teaser", "a dismissal must expire after 7 days");
  must(id(pick({ memory: { dismissed: { "vrisa-teaser": NOW - 6 * D }, engaged: {}, lastDismissAt: NOW - 6 * D } })) === "first-order", "…and not before");
  const edge = (h) => pick({ memory: { dismissed: { x: NOW - h * H }, engaged: {}, lastDismissAt: NOW - h * H } });
  must(edge(23) === null && edge(25) !== null, "the cool-down is 24 hours");
});

await check("an opened campaign is not shown again for 14 days", () => {
  must(id(pick({ memory: { dismissed: {}, engaged: { "vrisa-teaser": NOW - 10 * D }, lastDismissAt: null } })) === "first-order", "opened 10 days ago must still be hidden");
  must(id(pick({ memory: { dismissed: {}, engaged: { "vrisa-teaser": NOW - 15 * D }, lastDismissAt: null } })) === "vrisa-teaser", "opened 15 days ago may return");
});

await check("a visit shows at most two different campaigns; urgent ones ignore the limits", () => {
  must(pick({ shown: ["a", "b"] }) === null, "a third campaign appeared in one visit");
  must(id(pick({ shown: ["a", "vrisa-teaser"] })) === "vrisa-teaser", "a campaign already shown this visit must stay allowed");
  const urgent = [{ id: "u", kind: "announcement", headline: "Important", cta: { label: "Read", href: "/info/shipping" }, media: promos[0].media, priority: 100, routes: { include: ["/"] } }, ...promos];
  must(id(pick({ campaigns: urgent, shown: ["a", "b"], memory: { dismissed: { "vrisa-teaser": NOW - H }, engaged: {}, lastDismissAt: NOW - H } })) === "u", "an urgent campaign must ignore the cool-down and the visit cap");
  must(pick({ campaigns: urgent, memory: { dismissed: { u: NOW - H }, engaged: {}, lastDismissAt: NOW - H } }) === null, "…but not its own dismissal");
});

await check("the campaign on screen is kept while it is still allowed; forcing shows it whatever the rules say", () => {
  must(id(pick({ pathname: "/", keep: "first-order" })) === "first-order", "keep was ignored");
  must(id(pick({ pathname: "/checkout", keep: "first-order" })) === null, "keep must not outlive a quiet page");
  must(id(pick({ pathname: "/c/women", keep: "vrisa-teaser" })) === "halden-preview", "keep must not bring a campaign to a page it is not meant for");
  const heavy = { dismissed: Object.fromEntries(promos.map((p) => [p.id, NOW - H])), engaged: {}, lastDismissAt: NOW - H };
  must(id(pick({ memory: heavy, shown: ["a", "b"], force: "delivery-notice" })) === "delivery-notice", "forcing must ignore memory, cool-down, the visit cap and the route list");
  must(pick({ force: "no-such-promo" }) === null, "forcing a missing campaign must show nothing");
});

await check("every sample campaign is complete (copy, link, picture) and every video has both formats", () => {
  for (const c of promos) {
    const v = P.resolveCampaign(c, NOW) ?? P.resolveCampaign(c, Date.parse("2026-11-05T12:00:00+05:30"));
    must(v && v.headline && v.cta?.href?.startsWith("/") && v.cta.label && c.media.alt, `${c.id} is incomplete`);
    if (c.media.type === "video") must(c.media.video?.mp4 && c.media.video?.webm, `${c.id} needs an mp4 and a webm`);
  }
});

console.log(failures ? `\n${failures} check(s) failed` : "\nPop-up rules OK");
process.exit(failures ? 1 : 0);
