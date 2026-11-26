import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * "On its way" — a Nykaa Fashion courier climbing a hill through a pink city.
 *
 * Pure SVG (server-rendered, no JS). Looping motion is CSS (see "Illustration motion" in globals.css) and
 * collapses to the rest pose under prefers-reduced-motion. Pass `motion={false}` to freeze it.
 *
 * Colours: brand tokens where one exists (with the hex as fallback so the markup also works standalone);
 * the soft pinks are tints of --color-pink local to this illustration.
 *
 * Geometry: viewBox 1200×675. The hill is a straight line, y = HILL_Y0 − HILL_SLOPE·x, so the whole slope layer
 * (hill, trees, lamps) can slide along itself forever. One tile of that layer is TILE wide; the tile period and the
 * wheel's spin period are matched to the ground speed so the tyres don't slip (see globals.css).
 */

const C = {
  sky: "var(--color-bone, #f5f1ea)",
  white: "#fffdf9",
  ink: "var(--color-ink, #16120f)",
  pink: "var(--color-pink, #e80071)",
  pinkInk: "var(--color-pink-ink, #ac0057)",
  pinkTint: "var(--color-pink-tint, #fbe6ef)",
  marigold: "var(--color-marigold, #e3a31a)",
  hill: "#f293bd",
  body: "#f7b3cf",
  bodyShade: "#f09dc2",
  glass: "#f4c4d9",
  glassFin: "#fbe3ee",
  lowrise: "#f7d5e3",
  plum: "#3b0a25",
  rust: "#d4552b",
  skin: "#d38a5a",
  shirtShade: "#ecdde4",
} as const;

const HILL_Y0 = 677;
const HILL_SLOPE = 0.23;
const hillY = (x: number) => HILL_Y0 - HILL_SLOPE * x;

const TILE = 1200; // slope-layer period (px)
const FAR_TILE = 1500; // far-layer period (px)
const CLOUD_TILE = 1200;

/* ── scenery ─────────────────────────────────────────────────── */

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0,48 C0,38 8,32 18,32 C20,14 36,4 52,6 C64,8 72,16 76,24 C84,18 98,20 102,30 C116,28 130,36 130,48 Z"
      fill={C.white}
    />
  );
}

/** Window grid for a glass tower: hairline white mullions over a tinted face. */
function Glass({ x, y, w, h, dx, dy, fill = C.glass }: { x: number; y: number; w: number; h: number; dx: number; dy: number; fill?: string }) {
  let d = "";
  for (let i = dx; i < w; i += dx) d += `M${x + i},${y}V${y + h}`;
  for (let j = dy; j < h; j += dy) d += `M${x},${y + j}H${x + w}`;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      <path d={d} stroke={C.white} strokeWidth={2} fill="none" />
    </>
  );
}

/** A clothes hanger, drawn in a 24×16 box (origin top-left). */
function Hanger({ x, y, s = 1, color = C.white }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12,5.5 C12,2 15.5,1.6 15.5,4.4 C15.5,6.3 12,6.4 12,8.8" />
      <path d="M12,8.8 L22.5,14.6 C23.6,15.3 23.2,15.9 22,15.9 H2 C0.8,15.9 0.4,15.3 1.5,14.6 Z" />
    </g>
  );
}

function Boutique({ x }: { x: number }) {
  const w = 170;
  const top = 262;
  const stripes = 6;
  const sw = w / stripes;
  return (
    <g>
      {/* body */}
      <rect x={x} y={top} width={w} height={460} fill={C.white} />
      <rect x={x - 6} y={top - 10} width={w + 12} height={14} fill={C.white} />
      <rect x={x + 8} y={top - 10} width={w - 16} height={4} fill={C.pinkTint} />
      {/* round hanger sign */}
      <circle cx={x + w / 2} cy={top + 36} r={21} fill={C.pink} />
      <Hanger x={x + w / 2 - 12} y={top + 28} />
      {/* striped scalloped awning */}
      {Array.from({ length: stripes }, (_, i) => (
        <path key={i} d={`M${x + i * sw},${top + 76}h${sw}v26a${sw / 2},${sw / 2} 0 0 1 ${-sw},0Z`} fill={i % 2 ? "#f9c6dc" : C.pink} />
      ))}
      <rect x={x} y={top + 70} width={w} height={8} fill={C.pinkInk} />
      {/* shop window with mannequin */}
      <rect x={x + 14} y={top + 118} width={w - 28} height={112} rx={3} fill={C.pinkTint} />
      <g>
        <circle cx={x + 56} cy={top + 148} r={7} fill={C.plum} />
        <rect x={x + 54.5} y={top + 154} width={3} height={7} fill={C.plum} />
        <path d={`M${x + 45},${top + 161}h22l9,56h-40Z`} fill={C.pink} />
        <rect x={x + 54.5} y={top + 217} width={3} height={13} fill={C.plum} />
        <rect x={x + 44} y={top + 228} width={24} height={3} rx={1.5} fill={C.plum} />
      </g>
      {/* rail of hung garments */}
      <rect x={x + 92} y={top + 138} width={56} height={2.5} fill={C.plum} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${x + 98 + i * 14},${top + 140}l-5,46h10Z`} fill={[C.pink, C.glass, C.marigold, C.white][i]} />
      ))}
      {/* door */}
      <rect x={x + 14} y={top + 244} width={30} height={216} fill={C.glassFin} />
    </g>
  );
}

function TowerA({ x }: { x: number }) {
  return (
    <g>
      <Glass x={x} y={130} w={116} h={560} dx={29} dy={30} />
      {/* white fin */}
      <path d={`M${x + 116},130L${x + 146},170V690H${x + 116}Z`} fill={C.white} />
      {/* rooftop hanger billboard */}
      <rect x={x + 30} y={106} width={3} height={26} fill={C.plum} />
      <rect x={x + 84} y={106} width={3} height={26} fill={C.plum} />
      <rect x={x + 18} y={72} width={82} height={38} rx={3} fill={C.pink} />
      <Hanger x={x + 47} y={83} s={1.2} />
    </g>
  );
}

function TowerB({ x }: { x: number }) {
  return (
    <g>
      <Glass x={x} y={196} w={122} h={500} dx={30.5} dy={30} fill={C.glass} />
      <path d={`M${x},196H${x + 122}L${x + 122},180Z`} fill={C.glassFin} />
    </g>
  );
}

function LowRise({ x, top, w }: { x: number; top: number; w: number }) {
  return (
    <g>
      <rect x={x} y={top} width={w} height={400} fill={C.lowrise} />
      <path d={`M${x},${top}h${w}`} stroke={C.white} strokeWidth={5} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={x + 16 + c * ((w - 32) / 3)} y={top + 22 + r * 36} width={(w - 32) / 3 - 12} height={20} fill={C.white} opacity={0.9} />
        )),
      )}
    </g>
  );
}

function FarTile({ ox }: { ox: number }) {
  return (
    <g transform={`translate(${ox} 0)`}>
      <Boutique x={752} />
      <TowerA x={950} />
      <TowerB x={1090} />
      {/* off-screen at rest: travels through the frame as the scene moves */}
      <LowRise x={1250} top={360} w={130} />
      <LowRise x={1400} top={440} w={90} />
    </g>
  );
}

/** Soft white mound behind the hill, left side. Repeats with the far layer. */
function MoundTile({ ox }: { ox: number }) {
  return <path transform={`translate(${ox} 0)`} d="M-10,700V562C40,508 150,474 252,512C334,543 408,590 480,622V700Z" fill={C.white} />;
}

function Tree({ x, r, trunk }: { x: number; r: number; trunk: number }) {
  const y = hillY(x);
  return (
    <g>
      <rect x={x - 2} y={y - trunk} width={4} height={trunk + 6} fill={C.plum} />
      <circle cx={x} cy={y - trunk - r + 8} r={r} fill={C.plum} />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  const y = hillY(x);
  return (
    <g fill={C.plum}>
      <rect x={x - 6} y={y - 46} width={12} height={52} />
      <rect x={x - 2.5} y={y - 210} width={5} height={170} />
      <path d={`M${x - 2.5},${y - 206}C${x - 2.5},${y - 224} ${x + 14},${y - 230} ${x + 34},${y - 234}l1,6C${x + 18},${y - 226} ${x + 4},${y - 214} ${x + 2.5},${y - 206}Z`} />
      <path d={`M${x + 30},${y - 236}l22,-5l3,9l-24,4Z`} />
    </g>
  );
}

function SlopeTile({ ox }: { ox: number }) {
  return (
    <g transform={`translate(${ox} ${-HILL_SLOPE * ox})`}>
      <Lamp x={900} />
      <Tree x={992} r={44} trunk={56} />
      <Tree x={1092} r={34} trunk={64} />
      <Lamp x={1184} />
    </g>
  );
}

/* ── courier ─────────────────────────────────────────────────── */

function ShoppingBag() {
  return (
    <g className="nfs-bag">
      {/* handles hooked over the bar */}
      <path d="M562,318C566,336 580,338 588,346" fill="none" stroke={C.plum} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M560,318C556,340 572,346 580,348" fill="none" stroke={C.plum} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M572,346h40l5,52h-50Z" fill={C.pink} />
      <path d="M572,346h40l1,10h-42Z" fill={C.pinkInk} />
      <Hanger x={582} y={366} s={0.75} />
    </g>
  );
}

function DeliveryBox() {
  return (
    <g>
      {/* side + underside in brand pink */}
      <path d="M209,327L226,322L258,450L241,455Z" fill={C.pink} />
      <path d="M241,455L258,450L406,411L404,418L246,462Z" fill={C.pinkInk} />
      <g transform="translate(226 322) rotate(-15.6)">
        <rect width={155} height={132} fill={C.ink} />
        {/* wordmark — mirrors layout/Logo.tsx: Instrument Serif "Nykaa" + pink full stop + tracked "FASHION" */}
        <text x={20} y={74} fill={C.sky} fontFamily="var(--font-display, 'Instrument Serif', Georgia, serif)" fontSize={50} letterSpacing={-1}>
          Nykaa<tspan fill={C.pink}>.</tspan>
        </text>
        <text x={23} y={100} fill={C.sky} fontFamily="var(--font-sans, 'Geist', system-ui, sans-serif)" fontWeight={500} fontSize={11.5} letterSpacing={4.2}>
          FASHION
        </text>
      </g>
    </g>
  );
}

function Wheel({ cx, cy, className }: { cx: number; cy: number; className?: string }) {
  return (
    <g className={className}>
      <circle cx={cx} cy={cy} r={47} fill={C.ink} />
      <circle cx={cx} cy={cy} r={23} fill={C.white} />
      {/* spokes so the spin is readable */}
      <path d={`M${cx},${cy - 23}V${cy + 23}M${cx - 23},${cy}H${cx + 23}`} stroke={C.pinkTint} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={6} fill={C.ink} />
    </g>
  );
}

function Courier(): ReactNode {
  return (
    <g>
      {/* rear wheel sits behind the body */}
      <Wheel cx={424} cy={534} className="nfs-wheel" />

      {/* scooter body */}
      <g className="nfs-bob">
        <path
          d="M346,562C334,528 336,490 354,458L482,420C500,415 512,424 516,438L526,474L632,488C648,478 668,460 672,436C676,408 656,380 632,352C612,330 598,312 592,284C578,272 560,280 553,296C560,318 566,350 572,392L584,440L556,478L470,520C440,540 410,570 346,562Z"
          fill={C.body}
        />
        {/* lower shade where the cowl meets the floor */}
        <path d="M346,562C410,572 440,542 470,520L556,480L632,488L640,500L560,520L466,562C430,578 380,576 346,562Z" fill={C.bodyShade} />
        {/* rear cowl: brand-pink disc */}
        <path d="M358,560C350,520 372,486 412,486C452,486 482,516 478,550C476,562 470,566 462,568C430,572 380,572 358,560Z" fill={C.pink} />
        {/* seat */}
        <path d="M352,458C348,444 354,434 368,430L478,402C496,398 506,408 502,420C498,430 488,434 478,438L376,468C364,472 356,468 352,458Z" fill={C.plum} />
      </g>

      <g className="nfs-bob">
        <DeliveryBox />

        {/* far leg */}
        <rect x={503} y={384} width={24} height={92} fill={C.rust} />

        {/* torso + arm */}
        <path d="M418,240C428,228 450,228 458,240L474,288L500,298L544,292L558,300L552,314L494,334L474,334L450,326L430,396L392,398L398,300Z" fill={C.white} />
        <path d="M456,246L480,292L498,300L470,328L452,318Z" fill={C.shirtShade} opacity={0.9} />
        {/* hand */}
        <path d="M540,298C548,292 558,292 562,298L558,308C554,312 546,312 542,308Z" fill={C.skin} />
        {/* handlebar grips */}
        <rect x={550} y={296} width={10} height={36} rx={5} fill={C.ink} transform="rotate(14 555 314)" />

        {/* pants: thigh + shin */}
        <path d="M392,360L440,352L546,334C562,332 572,338 574,350L576,458L568,478L528,478L526,420L442,420L398,404Z" fill={C.marigold} />
        {/* shoe */}
        <path d="M526,472L580,470C590,472 594,480 590,488L526,492Z" fill={C.ink} />

        {/* scarf trailing behind */}
        <g className="nfs-scarf">
          <path d="M434,238C418,238 404,244 388,252C376,258 368,268 360,262C372,278 392,268 410,262L436,252Z" fill={C.pink} />
          <path d="M432,244C420,252 408,262 398,276C392,286 384,292 378,290C392,300 410,290 420,278C428,268 436,258 440,248Z" fill={C.pinkInk} />
        </g>

        {/* head: profile with nose and chin, helmet over the forehead */}
        <rect x={440} y={226} width={12} height={14} fill={C.skin} />
        <path d="M440,196H458C459,200 461,204 464,210C465,212.5 463,213.5 460.5,213.5C461,216 461.5,217.5 460,219.5C461,222.5 460,226.5 456,229C453,231.5 449,232 445,232H440Z" fill={C.skin} />
        {/* helmet */}
        <path d="M409,213C405,186 421,169 440,169C457,169 467,183 465,199C464,204 460,207 456,207H433L431,215Z" fill={C.pink} />
        <path d="M431,215L433,207H456" fill="none" stroke={C.pinkInk} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={420} cy={202} r={3.4} fill={C.white} />
      </g>

      {/* front: shield, fender, handlebar, bag, wheel */}
      <g className="nfs-bob">
        <path d="M584,278C592,272 600,276 604,284" fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" />
        <ellipse cx={640} cy={364} rx={6.5} ry={3.4} fill={C.white} transform="rotate(48 640 364)" />
      </g>
      <Wheel cx={683} cy={465} className="nfs-wheel" />
      <g className="nfs-bob">
        {/* front fender */}
        <path d="M626,470C626,428 654,402 688,406C716,410 734,426 740,448L720,456C714,438 700,430 684,430C662,432 648,448 646,470Z" fill={C.pink} />
        <ShoppingBag />
      </g>
    </g>
  );
}

/* ── scene ───────────────────────────────────────────────────── */

export function DeliveryScene({
  className,
  motion = true,
  label = "A Nykaa Fashion courier rides a pink scooter up a hill through the city, a Nykaa Fashion delivery box on the back",
}: {
  className?: string;
  /** Loop the scene (wheels, hill, skyline, clouds). Defaults to on; reduced-motion users always get the rest pose. */
  motion?: boolean;
  label?: string;
}) {
  const hillTop = (x: number) => `${x},${hillY(x)}`;
  return (
    <svg
      className={cn("nfs block h-full w-full", className)}
      data-motion={motion ? "on" : "off"}
      viewBox="0 0 1200 675"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
    >
      <rect width={1200} height={675} fill={C.sky} />

      {/* sky */}
      <g className="nfs-cloud">
        {[0, CLOUD_TILE].map((ox) => (
          <g key={ox} transform={`translate(${ox} 0)`}>
            <Cloud x={115} y={72} s={1} />
            <Cloud x={696} y={168} s={0.68} />
            <Cloud x={470} y={40} s={0.8} />
            <Cloud x={930} y={30} s={0.6} />
          </g>
        ))}
      </g>

      {/* skyline + mound drift slowly (parallax) */}
      <g className="nfs-far">
        {[0, FAR_TILE].map((ox) => (
          <FarTile key={ox} ox={ox} />
        ))}
        {[0, FAR_TILE].map((ox) => (
          <MoundTile key={`m${ox}`} ox={ox} />
        ))}
      </g>

      {/* the hill is a straight line, so it looks identical while sliding along itself — only the props need to move */}
      <polygon points={`${hillTop(-1000)} ${hillTop(3200)} 3200,1500 -1000,1500`} fill={C.hill} />
      <g className="nfs-slope">
        {[0, TILE].map((ox) => (
          <SlopeTile key={ox} ox={ox} />
        ))}
      </g>

      <Courier />
    </svg>
  );
}
