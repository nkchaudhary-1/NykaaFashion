import { cn } from "@/lib/cn";

/**
 * "On its way" — a Nykaa Fashion courier climbing a hill through a pink city.
 *
 * Pure SVG (server-rendered, no JS). Looping motion is CSS (see "Illustration motion" in globals.css) and
 * collapses to the rest pose under prefers-reduced-motion. Pass `motion={false}` to freeze it.
 *
 * Colours: brand tokens where one exists (hex fallback so the markup also works standalone); the soft pinks
 * are tints of --color-pink local to this illustration. Light comes from the upper left everywhere: highlights
 * sit on left/top edges, shade on right/bottom edges.
 *
 * Geometry: viewBox 1200×675. The hill is a straight line, y = HILL_Y0 − HILL_SLOPE·x, so the slope layer
 * (lamps, trees, road dashes) can slide along it forever. The scooter is drawn once in its own frame
 * (x forward along the road, y down, ground at y = 0) and rotated onto the hill, so every part stays aligned.
 */

const C = {
  sky: "var(--color-bone, #f5f1ea)",
  skyDeep: "#ece5da",
  white: "#fffdf9",
  ink: "var(--color-ink, #16120f)",
  pink: "var(--color-pink, #e80071)",
  pinkInk: "var(--color-pink-ink, #ac0057)",
  pinkTint: "var(--color-pink-tint, #fbe6ef)",
  marigold: "var(--color-marigold, #e3a31a)",
  marigoldShade: "#c98b12",
  hill: "#f29bc1",
  hillDeep: "#ee86b3",
  hillLip: "#f8bdd7",
  body: "#f8bcd5",
  bodyLight: "#fbd2e3",
  bodyShade: "#f09dc3",
  glass: "#f4c4d9",
  glassDeep: "#efb1cc",
  glassFin: "#fbe3ee",
  lowrise: "#f7d5e3",
  plum: "#3b0a25",
  plumLight: "#5d1b40",
  rust: "#d4552b",
  rustShade: "#b8431f",
  skin: "#d38a5a",
  skinShade: "#bb7449",
  shirtShade: "#ebdde5",
} as const;

const HILL_Y0 = 677;
const HILL_SLOPE = 0.23;
const hillY = (x: number) => HILL_Y0 - HILL_SLOPE * x;
const HILL_DEG = (Math.atan(HILL_SLOPE) * 180) / Math.PI; // 12.95°

const TILE = 1200; // slope-layer period (px)
const FAR_TILE = 1500; // skyline period (px)
const CLOUD_TILE = 1200;
const DASH_PERIOD = Math.hypot(TILE, TILE * HILL_SLOPE) / 12; // 12 road dashes per tile, so the loop is seamless

const REAR_X = 424; // rear-wheel contact point on the hill
const WHEELBASE = 267;
const R = 47; // tyre radius

/* ── sky ─────────────────────────────────────────────────────── */

const CLOUD = "M0,48C0,38 8,32 18,32C20,14 36,4 52,6C64,8 72,16 76,24C84,18 98,20 102,30C116,28 130,36 130,48Z";

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={CLOUD} transform="translate(0 3)" fill={C.skyDeep} />
      <path d={CLOUD} fill={C.white} />
    </g>
  );
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

/** Glass tower face: tinted panes, hairline mullions, a few lit panes and a soft diagonal reflection. */
function Glass({ id, x, y, w, h, dx, dy, lit, fill = C.glass }: { id: string; x: number; y: number; w: number; h: number; dx: number; dy: number; lit: Array<[number, number]>; fill?: string }) {
  let d = "";
  for (let i = dx; i < w - 1; i += dx) d += `M${x + i},${y}V${y + h}`;
  for (let j = dy; j < h - 1; j += dy) d += `M${x},${y + j}H${x + w}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {lit.map(([c, r]) => (
        <rect key={`${c}-${r}`} x={x + c * dx} y={y + r * dy} width={dx} height={dy} fill={C.white} opacity={0.5} />
      ))}
      <g clipPath={`url(#${id})`}>
        <path d={`M${x + w * 0.1},${y + h}L${x + w * 0.1 + 150},${y}H${x + w * 0.1 + 205}L${x + w * 0.1 + 55},${y + h}Z`} fill={C.white} opacity={0.16} />
        <path d={`M${x + w * 0.1 + 80},${y + h}L${x + w * 0.1 + 230},${y}H${x + w * 0.1 + 250}L${x + w * 0.1 + 100},${y + h}Z`} fill={C.white} opacity={0.12} />
      </g>
      <path d={d} stroke={C.white} strokeWidth={2} fill="none" />
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
      <rect x={x} y={top} width={w} height={460} fill={C.white} />
      <rect x={x - 6} y={top - 10} width={w + 12} height={14} rx={2} fill={C.white} />
      <rect x={x + 8} y={top - 10} width={w - 16} height={4} rx={2} fill={C.pinkTint} />
      <path d={`M${x + w},${top + 4}h6v456h-6Z`} fill={C.skyDeep} opacity={0.45} />
      {/* round hanger sign */}
      <circle cx={x + w / 2} cy={top + 36} r={22} fill={C.pinkTint} />
      <circle cx={x + w / 2} cy={top + 36} r={19} fill={C.pink} />
      <Hanger x={x + w / 2 - 12} y={top + 28} />
      {/* striped scalloped awning + the shade it throws */}
      <rect x={x} y={top + 102} width={w} height={8} fill={C.ink} opacity={0.07} />
      {Array.from({ length: stripes }, (_, i) => (
        <path key={i} d={`M${x + i * sw},${top + 76}h${sw}v26a${sw / 2},${sw / 2} 0 0 1 ${-sw},0Z`} fill={i % 2 ? "#f9c6dc" : C.pink} />
      ))}
      <rect x={x} y={top + 70} width={w} height={8} rx={1} fill={C.pinkInk} />
      {/* window */}
      <rect x={x + 12} y={top + 118} width={w - 24} height={116} rx={3} fill={C.pinkTint} />
      <rect x={x + 12} y={top + 118} width={w - 24} height={116} rx={3} fill="none" stroke={C.plum} strokeWidth={2} />
      <path d={`M${x + 12},${top + 226}H${x + w - 12}`} stroke={C.plum} strokeWidth={2} />
      {/* mannequin */}
      <circle cx={x + 56} cy={top + 146} r={6.5} fill={C.plum} />
      <rect x={x + 54.5} y={top + 152} width={3} height={8} fill={C.plum} />
      <path d={`M${x + 46},${top + 161}C${x + 50},${top + 158} ${x + 62},${top + 158} ${x + 66},${top + 161}L${x + 76},${top + 218}H${x + 36}Z`} fill={C.pink} />
      <path d={`M${x + 46},${top + 161}C${x + 50},${top + 158} ${x + 62},${top + 158} ${x + 66},${top + 161}L${x + 63},${top + 176}H${x + 49}Z`} fill={C.pinkInk} opacity={0.35} />
      <rect x={x + 54.5} y={top + 218} width={3} height={8} fill={C.plum} />
      <rect x={x + 45} y={top + 224} width={22} height={3.5} rx={1.75} fill={C.plum} />
      {/* garment rail */}
      <rect x={x + 90} y={top + 134} width={56} height={2.5} rx={1.25} fill={C.plum} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${x + 98 + i * 14},${top + 137}l-6,46q6,3 12,0Z`} fill={[C.pink, C.glass, C.marigold, C.white][i]} />
      ))}
      {/* door + topiary */}
      <rect x={x + 14} y={top + 246} width={32} height={214} rx={2} fill={C.glassFin} />
      <path d={`M${x + 41},${top + 330}v14`} stroke={C.plum} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={x + 119} y={top + 432} width={3} height={28} fill={C.plum} />
      <circle cx={x + 120.5} cy={top + 418} r={14} fill={C.plum} />
      <path d={`M${x + 108},${top + 416}a13,13 0 0 1 9,-11`} stroke={C.plumLight} strokeWidth={3} strokeLinecap="round" fill="none" />
    </g>
  );
}

function TowerA({ x }: { x: number }) {
  return (
    <g>
      <Glass id="nfs-ta" x={x} y={130} w={116} h={560} dx={29} dy={30} lit={[[0, 2], [2, 5], [1, 8], [3, 3], [2, 11], [0, 9]]} />
      <path d={`M${x + 116},130L${x + 146},170V690H${x + 116}Z`} fill={C.white} />
      <path d={`M${x + 116},130L${x + 146},170V176L${x + 116},136Z`} fill={C.glassFin} />
      {/* plant room + hanger billboard */}
      <rect x={x + 22} y={118} width={72} height={14} rx={2} fill={C.glassDeep} />
      <path d={`M${x + 30},122h56M${x + 30},127h56`} stroke={C.white} strokeWidth={1.5} opacity={0.8} />
      <rect x={x + 30} y={104} width={3} height={16} fill={C.plum} />
      <rect x={x + 84} y={104} width={3} height={16} fill={C.plum} />
      <rect x={x + 16} y={68} width={86} height={40} rx={4} fill={C.pink} />
      <rect x={x + 16} y={68} width={86} height={40} rx={4} fill="none" stroke={C.pinkInk} strokeWidth={2} />
      <Hanger x={x + 46} y={80} s={1.2} />
    </g>
  );
}

function TowerB({ x }: { x: number }) {
  return (
    <g>
      <Glass id="nfs-tb" x={x} y={196} w={122} h={500} dx={30.5} dy={30} lit={[[1, 1], [3, 4], [0, 6], [2, 9]]} />
      <path d={`M${x},196H${x + 122}L${x + 122},180Z`} fill={C.glassFin} />
      <rect x={x + 18} y={182} width={26} height={14} rx={2} fill={C.glassDeep} />
      <rect x={x + 70} y={186} width={20} height={10} rx={2} fill={C.glassDeep} />
    </g>
  );
}

function LowRise({ x, top, w }: { x: number; top: number; w: number }) {
  return (
    <g>
      <rect x={x} y={top} width={w} height={400} fill={C.lowrise} />
      <rect x={x - 3} y={top - 4} width={w + 6} height={7} rx={2} fill={C.white} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={x + 14 + c * ((w - 28) / 3)} y={top + 22 + r * 36} width={(w - 28) / 3 - 10} height={20} rx={2} fill={C.white} opacity={0.92} />
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

/** Two soft mounds behind the hill on the left. Repeat with the far layer. */
function MoundTile({ ox }: { ox: number }) {
  return (
    <g transform={`translate(${ox} 0)`}>
      <path d="M-10,700V540C60,478 190,452 300,498C380,532 440,580 500,612V700Z" fill={C.skyDeep} />
      <path d="M-10,700V562C40,508 150,474 252,512C334,543 408,590 480,622V700Z" fill={C.white} />
    </g>
  );
}

/* ── slope layer ─────────────────────────────────────────────── */

function Tree({ x, r, trunk }: { x: number; r: number; trunk: number }) {
  const y = hillY(x);
  const cy = y - trunk - r + 8;
  return (
    <g>
      <rect x={x - 2} y={y - trunk} width={4} height={trunk + 6} rx={1.5} fill={C.plum} />
      <circle cx={x} cy={cy} r={r} fill={C.plum} />
      <path d={`M${x - r * 0.74},${cy - r * 0.34}A${r * 0.82},${r * 0.82} 0 0 1 ${x - r * 0.28},${cy - r * 0.78}`} fill="none" stroke={C.plumLight} strokeWidth={Math.max(3, r * 0.09)} strokeLinecap="round" />
    </g>
  );
}

function Lamp({ x }: { x: number }) {
  const y = hillY(x);
  return (
    <g>
      <path d={`M${x - 9},${y + 6}V${y - 36}Q${x - 9},${y - 42} ${x - 3},${y - 42}H${x + 3}Q${x + 9},${y - 42} ${x + 9},${y - 36}V${y + 6}Z`} fill={C.plum} />
      <rect x={x - 3} y={y - 212} width={6} height={176} rx={3} fill={C.plum} />
      <path d={`M${x - 3},${y - 204}C${x - 3},${y - 224} ${x + 12},${y - 232} ${x + 38},${y - 234}V${y - 228}C${x + 16},${y - 226} ${x + 3},${y - 218} ${x + 3},${y - 204}Z`} fill={C.plum} />
      {/* luminaire */}
      <path d={`M${x + 32},${y - 240}H${x + 62}Q${x + 68},${y - 240} ${x + 66},${y - 234}L${x + 63},${y - 229}H${x + 35}Q${x + 31},${y - 229} ${x + 31},${y - 234}Z`} fill={C.plum} />
      <path d={`M${x + 38},${y - 228}H${x + 60}L${x + 57},${y - 223}H${x + 41}Z`} fill={C.pinkTint} />
    </g>
  );
}

function SlopeTile({ ox }: { ox: number }) {
  return (
    <g transform={`translate(${ox} ${-HILL_SLOPE * ox})`}>
      <Lamp x={934} />
      <Tree x={1016} r={44} trunk={56} />
      <Tree x={1104} r={34} trunk={64} />
      <Lamp x={1180} />
    </g>
  );
}

/* ── courier (scooter frame: x forward along the road, y down, ground at y = 0) ── */

function Wheel({ cx }: { cx: number }) {
  const cy = -R;
  return (
    <g className="nfs-wheel">
      <circle cx={cx} cy={cy} r={R} fill={C.ink} />
      <circle cx={cx} cy={cy} r={R - 6} fill="none" stroke="#fff" strokeOpacity={0.09} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={29} fill={C.white} />
      <circle cx={cx} cy={cy} r={29} fill="none" stroke="#eadfd6" strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 72 * Math.PI) / 180;
        return <circle key={i} cx={cx + 16.5 * Math.sin(a)} cy={cy - 16.5 * Math.cos(a)} r={4.4} fill={C.ink} />;
      })}
      <circle cx={cx} cy={cy} r={8} fill={C.pink} />
      <circle cx={cx} cy={cy} r={3} fill={C.ink} />
    </g>
  );
}

const BODY_PATH =
  "M-66,-24C-76,-52 -78,-94 -64,-122C-60,-130 -50,-132 -40,-132L50,-132C74,-132 92,-118 102,-98C110,-82 118,-72 134,-70L186,-70L184,-150C184,-190 186,-224 194,-248C200,-262 218,-266 230,-258C246,-248 264,-206 274,-168C283,-138 287,-106 282,-84C279,-70 270,-58 258,-52L240,-34C206,-26 156,-26 108,-24C80,-22 60,-8 30,-6L-30,-4C-52,-6 -62,-12 -66,-24Z";

function ScooterBody() {
  return (
    <g>
      <clipPath id="nfs-body">
        <path d={BODY_PATH} />
      </clipPath>
      {/* rear rack brackets */}
      <path d="M-112,-154L-80,-130" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
      <path d={BODY_PATH} fill={C.body} />
      <g clipPath="url(#nfs-body)">
        <rect x={-100} y={-38} width={400} height={60} fill={C.bodyShade} />
        <path d="M186,-70L184,-150C184,-190 186,-224 194,-248L214,-250L206,-150L208,-70Z" fill={C.bodyLight} opacity={0.7} />
        <path d="M-66,-24C-76,-52 -78,-94 -64,-122L-54,-122C-62,-92 -62,-56 -52,-24Z" fill={C.bodyLight} opacity={0.8} />
      </g>
      {/* floor mat */}
      <rect x={110} y={-73} width={76} height={7} rx={3.5} fill={C.plum} />
      {/* leg-shield trim */}
      <path d="M262,-206C271,-176 276,-146 274,-112" fill="none" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
      {/* rear wheel cover: the brand-pink disc */}
      <path d="M-50,-14A58.3,58.3 0 1 1 50,-14Z" fill={C.pink} />
      <path d="M-37,-16A45,45 0 1 1 37,-16" fill="none" stroke={C.pinkInk} strokeWidth={1.6} opacity={0.5} />
      <path d="M-47,-44A58,58 0 0 1 -24,-86" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.32} />
      <circle cx={0} cy={-44} r={8} fill={C.pinkTint} />
      <circle cx={0} cy={-44} r={3.4} fill={C.pink} />
      {/* seat */}
      <path d="M-58,-158L78,-158C92,-158 100,-150 100,-142C100,-134 92,-130 80,-130L-58,-130C-70,-130 -76,-136 -76,-144C-76,-152 -70,-158 -58,-158Z" fill={C.plum} />
      <path d="M-56,-154L74,-154" stroke={C.plumLight} strokeWidth={3} strokeLinecap="round" />
      {/* tail light */}
      <rect x={-81} y={-112} width={10} height={20} rx={5} fill={C.pinkInk} />
      <rect x={-79} y={-109} width={3} height={8} rx={1.5} fill="#fff" opacity={0.6} />
      {/* headlight + handlebar */}
      <circle cx={258} cy={-228} r={13.5} fill={C.pinkTint} />
      <circle cx={258} cy={-228} r={10} fill={C.white} />
      <path d="M252,-232a8,8 0 0 1 8,-4" stroke={C.pinkTint} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <path d="M222,-250L198,-240" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      <rect x={179} y={-250} width={13} height={32} rx={6.5} fill={C.ink} />
      <path d="M185,-244v10" stroke="#fff" strokeOpacity={0.25} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function DeliveryBox() {
  const x = -135;
  const y = -292;
  return (
    <g>
      {/* rack plate */}
      <rect x={-156} y={-160} width={188} height={6} rx={3} fill={C.ink} />
      {/* brand-pink side + shaded underside */}
      <path d={`M${x},${y}L${x - 17.7},${y + 1}V${y + 133}L${x},${y + 132}Z`} fill={C.pink} />
      <path d={`M${x - 17.7},${y + 133}L${x},${y + 132}H20V${y + 139}H${x - 11}Z`} fill={C.pinkInk} />
      {/* front face */}
      <rect x={x} y={y} width={155} height={132} rx={3} fill={C.ink} />
      <rect x={x + 7} y={y + 7} width={141} height={118} rx={1.5} fill="none" stroke={C.sky} strokeOpacity={0.14} strokeWidth={1} />
      <path d={`M${x},${y + 22}H20`} stroke={C.sky} strokeOpacity={0.14} strokeWidth={1} />
      <rect x={x + 65} y={y + 16} width={26} height={12} rx={3} fill={C.pink} />
      {/* wordmark — mirrors layout/Logo.tsx: Instrument Serif "Nykaa" + pink full stop + tracked "FASHION" */}
      <text x={x + 20} y={y + 80} fill={C.sky} fontFamily="var(--font-display, 'Instrument Serif', Georgia, serif)" fontSize={50} letterSpacing={-1}>
        Nykaa<tspan fill={C.pink}>.</tspan>
      </text>
      <text x={x + 23} y={y + 106} fill={C.sky} fontFamily="var(--font-sans, 'Geist', system-ui, sans-serif)" fontWeight={500} fontSize={11.5} letterSpacing={4.2}>
        FASHION
      </text>
    </g>
  );
}

function Fender() {
  // arc around the front wheel centre (267, -47): outer r 63, inner r 51, spanning 170° → 370° (clockwise)
  return (
    <g>
      <path d="M204.96,-36.06A63,63 0 1 1 329.04,-36.06L317.22,-38.14A51,51 0 1 0 216.78,-38.14Z" fill={C.pink} strokeLinejoin="round" stroke={C.pink} strokeWidth={3} />
      <path d="M214,-52A57,57 0 0 1 256,-100" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
    </g>
  );
}

/** Rider + bag live in screen space (upright), anchored to the seat and bars of the scooter. */
function Rider() {
  const soft = { strokeLinejoin: "round", strokeLinecap: "round" } as const;
  return (
    <g>
      {/* far leg */}
      <path d="M518,372V458" stroke={C.rustShade} strokeWidth={40} {...soft} transform="translate(3 3)" />
      <path d="M518,372V458" stroke={C.rust} strokeWidth={40} {...soft} />
      <g transform="translate(521 481) rotate(-12.95)">
        <path d="M-20,0L-20,-12C-20,-18 -14,-22 -8,-22H14C28,-22 38,-16 46,-11C52,-7 52,0 46,0Z" fill={C.ink} />
      </g>

      {/* torso */}
      <path d="M402,408C402,372 408,330 414,298C418,274 420,258 428,248C436,238 456,236 464,246C472,256 474,272 478,290L488,330L480,408Z" fill={C.white} stroke={C.white} strokeWidth={6} strokeLinejoin="round" />
      <path d="M458,318C468,327 478,329 488,331L480,408H452C458,378 460,346 458,318Z" fill={C.shirtShade} />
      {/* collar + neck */}
      <rect x={440} y={222} width={13} height={26} rx={5} fill={C.skin} />
      <path d="M440,232H453V238C449,242 444,242 440,238Z" fill={C.skinShade} />

      {/* pants (thigh + shin as one soft polyline), shaded on the lower-right */}
      <g transform="translate(4 5)">
        <path d="M430,394L548,366L549,452" fill="none" stroke={C.marigoldShade} strokeWidth={42} {...soft} />
      </g>
      <path d="M430,394L548,366L549,452" fill="none" stroke={C.marigold} strokeWidth={42} {...soft} />
      <path d="M549,438V454" stroke={C.marigoldShade} strokeWidth={42} />
      <path d="M530,436H568" stroke="#fff" strokeWidth={2} opacity={0.35} />

      {/* shoe, laid on the floor mat */}
      <g transform="translate(549 479) rotate(-12.95)">
        <path d="M-20,0L-20,-12C-20,-18 -14,-22 -8,-22H14C28,-22 38,-16 46,-11C52,-7 52,0 46,0Z" fill={C.ink} />
        <path d="M-20,-3.5H49" stroke={C.white} strokeWidth={3.2} strokeLinecap="round" />
        <path d="M10,-20L26,-14" stroke="#fff" strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" />
      </g>

      {/* arm: shade pass first, then the sleeve */}
      <path d="M452,262L492,324L546,310" fill="none" stroke={C.shirtShade} strokeWidth={26} {...soft} transform="translate(0 4)" />
      <path d="M452,262L492,324L546,310" fill="none" stroke={C.white} strokeWidth={26} {...soft} />
      <path d="M535,300.5L541,321" stroke={C.pink} strokeWidth={4} strokeLinecap="butt" />
      <ellipse cx={554} cy={310} rx={9.5} ry={8} fill={C.skin} transform="rotate(-14 554 310)" />
      <path d="M548,314a9,7 0 0 0 12,2" fill="none" stroke={C.skinShade} strokeWidth={2} strokeLinecap="round" />

      {/* scarf, flowing back */}
      <g className="nfs-scarf">
        <path d="M440,244C424,243 408,248 392,256C380,262 370,272 358,270C364,282 384,286 400,276C414,268 428,262 444,256Z" fill={C.pink} />
        <path d="M436,250C426,256 416,266 408,280C402,290 394,298 384,298C396,306 414,300 424,288C432,278 440,266 446,256Z" fill={C.pinkInk} />
        <path d="M392,258C398,262 404,262 410,260M404,270C410,272 416,270 420,268" fill="none" stroke={C.pinkInk} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      </g>
      <ellipse cx={446} cy={249} rx={12} ry={8} fill={C.pink} />
      <path d="M437,247C441,252 449,252 455,247" fill="none" stroke={C.pinkInk} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />

      {/* head: ear, profile, then helmet */}
      <ellipse cx={436} cy={214} rx={4.6} ry={6.6} fill={C.skinShade} />
      <path d="M440,196H457C458,200 460,204 462,207C464,209 467,211 466,213C465,214.5 463,214.5 462,215C463,216.5 463,218 461.5,219C462.5,220.5 462.5,222 461,223C461.5,226 460,229.5 456.5,231.5C453,233.5 448,234 444,233H440Z" fill={C.skin} />
      <circle cx={455.5} cy={203.5} r={1.5} fill={C.ink} />
      <path d="M452,199.5C454,198.5 456.5,198.5 458.5,199.5" fill="none" stroke={C.skinShade} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={451} cy={214} r={4.2} fill={C.pink} opacity={0.22} />
      <path d="M459.5,218.5C460.8,218.8 461.6,218.6 462,218.2" fill="none" stroke={C.skinShade} strokeWidth={1.2} strokeLinecap="round" />

      <path d="M456,203L477,200C479.5,200 479.5,204.5 477,205L459,208Z" fill={C.pinkInk} />
      <path d="M409,222C404,194 421,170 441,169C458,168 470,181 469,198L467,204C462,207 456,208 450,208L436,208C434,212 434,218 432,222Z" fill={C.pink} />
      <path d="M416,196C418,185 428,175 440,173" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.42} />
      <path d="M409,222H432L436,208H466" fill="none" stroke={C.pinkInk} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={420.5} cy={209} r={3.2} fill={C.white} />
      <path d="M433,222C437,227 441,230 446,232" fill="none" stroke={C.ink} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

function ShoppingBag() {
  return (
    <g className="nfs-bag">
      <path d="M558,323C562,338 574,342 582,347M558,323C556,342 598,334 604,347" fill="none" stroke={C.plum} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={558} cy={322} r={2.6} fill={C.ink} />
      <path d="M572,346H614L618,400H568Z" fill={C.pink} strokeLinejoin="round" stroke={C.pink} strokeWidth={2} />
      <path d="M572,346H614L615,356H571Z" fill={C.pinkInk} />
      <path d="M602,356H614L618,400H606Z" fill={C.pinkInk} opacity={0.28} />
      <Hanger x={581} y={367} s={0.8} />
    </g>
  );
}

function Courier() {
  const y0 = hillY(REAR_X);
  const front = REAR_X + WHEELBASE * Math.cos((HILL_DEG * Math.PI) / 180);
  const frontY = hillY(front);
  return (
    <g>
      {/* contact shadows */}
      <ellipse cx={REAR_X} cy={y0 + 1} rx={46} ry={4.5} fill={C.plum} opacity={0.16} transform={`rotate(${-HILL_DEG} ${REAR_X} ${y0})`} />
      <ellipse cx={front} cy={frontY + 1} rx={46} ry={4.5} fill={C.plum} opacity={0.16} transform={`rotate(${-HILL_DEG} ${front} ${frontY})`} />

      <g transform={`translate(${REAR_X} ${y0.toFixed(2)}) rotate(${(-HILL_DEG).toFixed(2)})`}>
        <Wheel cx={0} />
        <g className="nfs-bob">
          <ScooterBody />
          <DeliveryBox />
        </g>
        <Wheel cx={WHEELBASE} />
        <g className="nfs-bob">
          <Fender />
        </g>
      </g>

      <g className="nfs-bob">
        <Rider />
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
  const hillTop = (x: number, dy = 0) => `${x},${hillY(x) + dy}`;
  return (
    <svg
      className={cn("nfs block h-full w-full", className)}
      data-motion={motion ? "on" : "off"}
      viewBox="0 0 1200 675"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="nfs-hill" gradientUnits="userSpaceOnUse" x1="0" y1="380" x2="0" y2="675">
          <stop offset="0" stopColor={C.hill} />
          <stop offset="1" stopColor={C.hillDeep} />
        </linearGradient>
      </defs>
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

      {/* skyline + mounds drift slowly (parallax) */}
      <g className="nfs-far">
        {[0, FAR_TILE].map((ox) => (
          <FarTile key={ox} ox={ox} />
        ))}
        {[0, FAR_TILE].map((ox) => (
          <MoundTile key={`m${ox}`} ox={ox} />
        ))}
      </g>

      {/* the hill is a straight line, so it looks identical while sliding along itself — only the props move */}
      <polygon points={`${hillTop(-1000)} ${hillTop(3200)} 3200,1500 -1000,1500`} fill="url(#nfs-hill)" />
      <polygon points={`${hillTop(-1000)} ${hillTop(3200)} ${hillTop(3200, 9)} ${hillTop(-1000, 9)}`} fill={C.hillLip} />
      <g className="nfs-slope">
        <line x1={-1000} y1={hillY(-1000) + 30} x2={3200} y2={hillY(3200) + 30} stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${DASH_PERIOD * 0.42} ${DASH_PERIOD * 0.58}`} opacity={0.5} />
        {[0, TILE].map((ox) => (
          <SlopeTile key={ox} ox={ox} />
        ))}
      </g>

      <Courier />
    </svg>
  );
}
