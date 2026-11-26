import { cn } from "@/lib/cn";

/**
 * "On its way" — a Nykaa Fashion courier on a straight, flat road.
 *
 * Pure SVG (server-rendered, no JS). Looping motion is CSS (see "Illustration motion" in globals.css) and
 * collapses to the rest pose under prefers-reduced-motion. Pass `motion={false}` to freeze it.
 *
 * Minimal on purpose: flat colour, a single shade per shape (highlight top-left, shade bottom-right), few details.
 * Colours: brand tokens where one exists (hex fallback so the markup also works standalone); the soft pinks
 * are tints of --color-pink local to this illustration.
 *
 * Geometry: viewBox 1200×675. The road is a straight horizontal band whose surface sits at ROAD_Y. The scooter
 * and rider are drawn once in one frame (x forward, y down, ground at y = 0) and scaled onto the road; wheel spin,
 * road speed and tyre size are tied together (see globals.css) so the tyres don't slip.
 */

const C = {
  sky: "var(--color-bone, #f5f1ea)",
  white: "#fffdf9",
  ink: "var(--color-ink, #16120f)",
  dark: "#2a242c",
  pink: "var(--color-pink, #e80071)",
  pinkInk: "var(--color-pink-ink, #ac0057)",
  pinkTint: "var(--color-pink-tint, #fbe6ef)",
  stone: "var(--color-stone, #d8cfc1)",
  road: "#f29bc1",
  roadLip: "#f8bdd7",
  glass: "#f4c4d9",
  lowrise: "#f7d5e3",
  plum: "#3b0a25",
  jeans: "#5d1b40",
  jeansShade: "#47122f",
  skin: "#d38a5a",
  skinShade: "#bb7449",
  hair: "#2b1d19",
} as const;

const ROAD_Y = 545; // road surface
const SCALE = 1.15; // courier scale on the road
const TILE = 1200; // props period (px) — one lamp/tree group per tile
const FAR_TILE = 1500; // skyline period (px)
const CLOUD_TILE = 1200;
const DASH_PERIOD = TILE / 12; // 12 road dashes per tile, so the loop is seamless

const REAR_X = 330; // rear-wheel contact point (screen)
const WHEELBASE = 250; // local units
const R = 47; // tyre radius, local units

/* ── sky ─────────────────────────────────────────────────────── */

const CLOUD = "M0,48C0,38 8,32 18,32C20,14 36,4 52,6C64,8 72,16 76,24C84,18 98,20 102,30C116,28 130,36 130,48Z";

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path d={CLOUD} transform={`translate(${x} ${y}) scale(${s})`} fill={C.white} />;
}

/* ── skyline ─────────────────────────────────────────────────── */

/** A clothes hanger, drawn in a 24×16 box (origin top-left). */
function Hanger({ x, y, s = 1, color = C.white }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12,5.5C12,2 15.5,1.6 15.5,4.4C15.5,6.3 12,6.4 12,8.8" />
      <path d="M12,8.8L22.5,14.6C23.6,15.3 23.2,15.9 22,15.9H2C0.8,15.9 0.4,15.3 1.5,14.6Z" />
    </g>
  );
}

/** Glass tower: one tint, hairline mullions, a white fin on the right. */
function Tower({ x, top, w, dx, dy, fin = true }: { x: number; top: number; w: number; dx: number; dy: number; fin?: boolean }) {
  const h = ROAD_Y + 40 - top;
  let d = "";
  for (let i = dx; i < w - 1; i += dx) d += `M${x + i},${top}V${top + h}`;
  for (let j = dy; j < h - 1; j += dy) d += `M${x},${top + j}H${x + w}`;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill={C.glass} />
      <path d={d} stroke={C.white} strokeWidth={2} fill="none" />
      {fin && <path d={`M${x + w},${top}L${x + w + 28},${top + 38}V${top + h}H${x + w}Z`} fill={C.white} />}
    </g>
  );
}

function Boutique({ x }: { x: number }) {
  const w = 170;
  const top = ROAD_Y - 270;
  const stripes = 6;
  const sw = w / stripes;
  const winH = ROAD_Y - top - 120;
  return (
    <g>
      <rect x={x} y={top} width={w} height={ROAD_Y + 40 - top} fill={C.white} />
      <circle cx={x + w / 2} cy={top + 38} r={20} fill={C.pink} />
      <Hanger x={x + w / 2 - 12} y={top + 30} />
      {Array.from({ length: stripes }, (_, i) => (
        <path key={i} d={`M${x + i * sw},${top + 78}h${sw}v24a${sw / 2},${sw / 2} 0 0 1 ${-sw},0Z`} fill={i % 2 ? "#f9c6dc" : C.pink} />
      ))}
      <rect x={x + 14} y={top + 120} width={w - 28} height={winH} rx={3} fill={C.pinkTint} />
      {/* mannequin */}
      <circle cx={x + w / 2} cy={top + 148} r={7} fill={C.plum} />
      <path d={`M${x + w / 2 - 11},${top + 164}h22l9,62h-40Z`} fill={C.pink} />
      <rect x={x + w / 2 - 1.5} y={top + 226} width={3} height={winH - 108} fill={C.plum} />
      <rect x={x + w / 2 - 12} y={top + 118 + winH - 6} width={24} height={4} rx={2} fill={C.plum} />
    </g>
  );
}

function LowRise({ x, top, w }: { x: number; top: number; w: number }) {
  return <rect x={x} y={top} width={w} height={ROAD_Y + 40 - top} fill={C.lowrise} />;
}

function FarTile({ ox }: { ox: number }) {
  return (
    <g transform={`translate(${ox} 0)`}>
      <Boutique x={800} />
      <Tower x={1000} top={ROAD_Y - 395} w={120} dx={40} dy={44} />
      <Tower x={1160} top={ROAD_Y - 310} w={120} dx={40} dy={44} fin={false} />
      {/* off-screen at rest: travels through the frame as the scene moves */}
      <LowRise x={1330} top={ROAD_Y - 190} w={120} />
    </g>
  );
}

/* ── props on the road side ──────────────────────────────────── */

function Tree({ x, r, trunk }: { x: number; r: number; trunk: number }) {
  return (
    <g fill={C.plum}>
      <rect x={x - 2} y={ROAD_Y - trunk} width={4} height={trunk + 6} rx={1.5} />
      <circle cx={x} cy={ROAD_Y - trunk - r + 8} r={r} />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  const y = ROAD_Y;
  return (
    <g fill={C.plum}>
      <rect x={x - 8} y={y - 34} width={16} height={40} rx={3} />
      <rect x={x - 3} y={y - 208} width={6} height={176} rx={3} />
      <path d={`M${x - 3},${y - 200}C${x - 3},${y - 220} ${x + 12},${y - 228} ${x + 36},${y - 230}V${y - 224}C${x + 14},${y - 222} ${x + 3},${y - 214} ${x + 3},${y - 200}Z`} />
      <path d={`M${x + 30},${y - 236}H${x + 62}Q${x + 68},${y - 236} ${x + 66},${y - 230}L${x + 63},${y - 224}H${x + 33}Q${x + 29},${y - 224} ${x + 29},${y - 230}Z`} />
    </g>
  );
}

function PropsTile({ ox }: { ox: number }) {
  return (
    <g transform={`translate(${ox} 0)`}>
      <Lamp x={982} />
      <Tree x={1070} r={42} trunk={56} />
      <Tree x={1150} r={32} trunk={62} />
    </g>
  );
}

/* ── courier (x forward along the road, y down, ground at y = 0) ── */

function Wheel({ cx }: { cx: number }) {
  const cy = -R;
  return (
    <g className="nfs-wheel">
      <circle cx={cx} cy={cy} r={R} fill={C.ink} />
      <circle cx={cx} cy={cy} r={31} fill={C.stone} />
      <circle cx={cx} cy={cy} r={25} fill="#ebe4d9" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 72 * Math.PI) / 180;
        return <circle key={i} cx={cx + 17 * Math.sin(a)} cy={cy - 17 * Math.cos(a)} r={3.6} fill={C.dark} opacity={0.85} />;
      })}
      <circle cx={cx} cy={cy} r={9} fill={C.dark} />
      <circle cx={cx} cy={cy} r={3} fill={C.stone} />
    </g>
  );
}

/** Everything that rides on the frame: cowl, floor, front column, seat, box and rider. */
function Scooter() {
  return (
    <g>
      {/* rear cowl, with a darker side panel */}
      <path d="M-24,-136C-48,-130 -62,-110 -56,-90C-50,-70 -34,-62 -12,-62L66,-62C94,-62 112,-78 118,-102C120,-114 118,-126 114,-136Z" fill={C.pink} />
      <rect x={-32} y={-120} width={124} height={50} rx={25} fill={C.pinkInk} opacity={0.5} />

      {/* floor with a dark mat */}
      <rect x={104} y={-62} width={100} height={12} rx={6} fill={C.pink} />
      <rect x={116} y={-64} width={80} height={3.5} rx={1.75} fill={C.dark} />

      {/* leg shield: dark column, pink front cover */}
      <path d="M170,-62C170,-108 178,-164 190,-216L214,-222C206,-176 204,-116 208,-62Z" fill={C.dark} />
      <path d="M214,-222C238,-214 254,-188 255,-152C256,-130 254,-112 250,-100L212,-100C214,-140 216,-186 214,-222Z" fill={C.pink} />

      {/* headset with round lamp, and the grip */}
      <path d="M186,-232C186,-240 192,-244 200,-244L226,-244C236,-244 242,-238 242,-230C242,-216 236,-208 226,-208L196,-208C190,-208 186,-214 186,-222Z" fill={C.pink} />
      <circle cx={241} cy={-226} r={12} fill={C.pinkTint} />
      <circle cx={241} cy={-226} r={9} fill={C.white} />
      <rect x={156} y={-206} width={36} height={12} rx={6} fill={C.ink} />

      {/* seat + rack */}
      <path d="M-10,-161L100,-161C110,-161 116,-154 116,-148C116,-141 110,-136 100,-136L-10,-136C-20,-136 -26,-142 -26,-148C-26,-155 -20,-161 -10,-161Z" fill={C.plum} />
      <path d="M-100,-160H-30" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d="M-70,-157L-46,-137" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function DeliveryBox() {
  const x = -92;
  const y = -264;
  return (
    <g>
      <rect x={x} y={y} width={118} height={104} rx={2} fill={C.ink} />
      {/* lid */}
      <rect x={x - 4} y={y} width={126} height={16} rx={2} fill={C.pink} />
      <rect x={x - 4} y={y + 16} width={126} height={2.5} fill={C.pinkInk} />
      {/* wordmark — mirrors layout/Logo.tsx: Instrument Serif "Nykaa" + pink full stop + tracked "FASHION" */}
      <text x={x + 17} y={y + 62} fill={C.sky} fontFamily="var(--font-display, 'Instrument Serif', Georgia, serif)" fontSize={38} letterSpacing={-0.8}>
        Nykaa<tspan fill={C.pink}>.</tspan>
      </text>
      <text x={x + 19} y={y + 82} fill={C.sky} fontFamily="var(--font-sans, 'Geist', system-ui, sans-serif)" fontWeight={500} fontSize={9.4} letterSpacing={3.4}>
        FASHION
      </text>
    </g>
  );
}

function Fender() {
  // crescent around the front wheel centre (250, -47): outer r 66, inner r 52, spanning 190° → 368° (clockwise)
  return <path d="M185,-58.46A66,66 0 0 1 315.36,-37.81L301.5,-39.76A52,52 0 0 0 198.8,-56.03Z" fill={C.pink} stroke={C.pink} strokeWidth={3} strokeLinejoin="round" />;
}

const SHOE = "M-18,0L-18,-12C-18,-18 -13,-22 -7,-22H12C22,-22 30,-17 37,-11C42,-7 42,0 37,0Z";

/** Rider, seated and leaning slightly forward: tee, jeans, cap — after the classic delivery-rider pose. */
function Rider() {
  const soft = { strokeLinejoin: "round", strokeLinecap: "round" } as const;
  return (
    <g>
      {/* jeans: thigh + shin as one soft polyline, shaded lower-right */}
      <path d="M48,-178L152,-170L142,-92" fill="none" stroke={C.jeansShade} strokeWidth={38} {...soft} transform="translate(3 4)" />
      <path d="M48,-178L152,-170L142,-92" fill="none" stroke={C.jeans} strokeWidth={38} {...soft} />
      {/* shoe on the floor mat */}
      <g transform="translate(140 -64)">
        <path d={SHOE} fill={C.ink} />
        <path d="M-18,-3.5H38" stroke={C.white} strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* forearm, then the short sleeve over it, then the fist on the grip */}
      <path d="M112,-232L172,-203" fill="none" stroke={C.skin} strokeWidth={14} {...soft} />
      {/* tee */}
      <path d="M28,-176C30,-206 38,-244 50,-270C56,-282 68,-290 84,-290C100,-290 112,-278 113,-262C113,-240 100,-210 92,-176Z" fill={C.pink} stroke={C.pink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M92,-176C100,-210 110,-236 113,-262C106,-246 98,-226 88,-176Z" fill={C.pinkInk} opacity={0.45} />
      <path d="M74,-276L116,-229" fill="none" stroke={C.pink} strokeWidth={25} {...soft} />
      <path d="M96,-247L118,-224" fill="none" stroke={C.pinkInk} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <circle cx={174} cy={-203} r={9} fill={C.skin} />

      {/* neck */}
      <path d="M92,-284L98,-298" fill="none" stroke={C.skin} strokeWidth={17} {...soft} />

      {/* head (profile) with cap, drawn upright then placed on the neck */}
      <g transform="translate(-344 -524)">
        <path d="M411,208C408,218 412,226 420,226L432,220L432,208Z" fill={C.hair} />
        <ellipse cx={436} cy={214} rx={4.6} ry={6.6} fill={C.skinShade} />
        <path d="M440,196H457C458,200 460,204 462,207C464,209 467,211 466,213C465,214.5 463,214.5 462,215C463,216.5 463,218 461.5,219C462.5,220.5 462.5,222 461,223C461.5,226 460,229.5 456.5,231.5C453,233.5 448,234 444,233H440Z" fill={C.skin} />
        <circle cx={455.5} cy={203.5} r={1.5} fill={C.ink} />
        <path d="M452,196L494,199C496,200 496,204 493,205.5L458,208Z" fill={C.pinkInk} />
        <path d="M409,210C406,186 422,170 442,169C458,168 470,179 470,196L468,204L432,208Z" fill={C.pink} />
        <path d="M443,170C447,181 448,192 447,203" fill="none" stroke={C.pinkInk} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      </g>
    </g>
  );
}

function Courier() {
  const wheelX = REAR_X + WHEELBASE * SCALE;
  return (
    <g>
      {/* one soft shadow grounds the scooter */}
      <ellipse cx={(REAR_X + wheelX) / 2 + 10} cy={ROAD_Y + 2} rx={210} ry={5} fill={C.plum} opacity={0.12} />
      <g transform={`translate(${REAR_X} ${ROAD_Y}) scale(${SCALE})`}>
        <rect x={14} y={-64} width={62} height={26} rx={10} fill={C.dark} />
        <Wheel cx={0} />
        <g className="nfs-bob">
          <Scooter />
          <DeliveryBox />
          <Rider />
        </g>
        <Wheel cx={WHEELBASE} />
        <g className="nfs-bob">
          <Fender />
        </g>
      </g>
    </g>
  );
}

/* ── scene ───────────────────────────────────────────────────── */

export function DeliveryScene({
  className,
  motion = true,
  label = "A Nykaa Fashion courier rides a pink scooter along a straight city road, a Nykaa Fashion delivery box on the back",
}: {
  className?: string;
  /** Loop the scene (wheels, road, skyline, clouds). Defaults to on; reduced-motion users always get the rest pose. */
  motion?: boolean;
  label?: string;
}) {
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
            <Cloud x={100} y={84} s={1} />
            <Cloud x={640} y={54} s={0.7} />
            <Cloud x={930} y={104} s={0.8} />
          </g>
        ))}
      </g>

      {/* skyline drifts slowly (parallax) */}
      <g className="nfs-far">
        {[0, FAR_TILE].map((ox) => (
          <FarTile key={ox} ox={ox} />
        ))}
      </g>

      {/* the road: a straight band, so it looks identical while sliding — only the props and dashes move */}
      <rect x={0} y={ROAD_Y} width={1200} height={675 - ROAD_Y} fill={C.road} />
      <rect x={0} y={ROAD_Y} width={1200} height={6} fill={C.roadLip} />
      <g className="nfs-slope">
        <line x1={-1000} y1={ROAD_Y + 56} x2={3200} y2={ROAD_Y + 56} stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${DASH_PERIOD * 0.44} ${DASH_PERIOD * 0.56}`} opacity={0.5} />
        {[0, TILE].map((ox) => (
          <PropsTile key={ox} ox={ox} />
        ))}
      </g>

      <Courier />
    </svg>
  );
}
