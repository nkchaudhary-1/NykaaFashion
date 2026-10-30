// Vase: bud / amphora / cylinder / bottle, glossy or matte glaze, optional dried stems. alt = grouped arrangement,
// detail = macro of rim + glaze with shallow depth of field.
import { Curve, f, lerp, clamp, polyD, smoothstep, tube } from '../lib/geometry.mjs';
import { mix, lighten, darken, shadowOf, highlightOf, luma } from '../lib/color.mjs';
import { Rng } from '../lib/prng.mjs';
import { fbm, vnoise } from '../lib/noise.mjs';
import { fitObject, profile } from '../lib/object.mjs';
import { FABRICS } from '../lib/fabrics.mjs';
import { makeTexture } from '../lib/texture.mjs';

const SHAPES = {
  bud: { H: 15, pts: [[0, 2.7], [0.06, 3.2], [0.28, 4.0], [0.5, 3.3], [0.72, 1.7], [0.84, 1.15], [0.93, 1.3], [1, 1.7]] },
  amphora: { H: 34, pts: [[0, 4.4], [0.05, 5.2], [0.2, 8.1], [0.4, 9.2], [0.62, 7.4], [0.78, 4.2], [0.86, 3.3], [0.94, 3.9], [1, 4.8]], handles: true },
  cylinder: { H: 27, pts: [[0, 5.6], [0.04, 6.1], [0.5, 6.5], [0.96, 6.2], [1, 6.35]] },
  bottle: { H: 31, pts: [[0, 5.2], [0.04, 6.2], [0.16, 7.0], [0.3, 6.6], [0.46, 4.2], [0.6, 2.2], [0.76, 1.55], [0.9, 1.6], [0.95, 1.9], [1, 2.0]] },
  // tableware / candles (shared renderer): bowl shows its glazed inside, mug has one handle, jar / pillar / tin carry wax
  bowl: { H: 8.6, view: 0.3, solid: true, opening: 'bowl', pts: [[0, 3.4], [0.05, 3.9], [0.22, 5.4], [0.5, 7.4], [0.82, 8.9], [0.96, 9.4], [1, 9.5]] },
  mug: { H: 10, view: 0.22, solid: true, opening: 'bowl', handle: 'mug', pts: [[0, 3.7], [0.04, 4.1], [0.5, 4.35], [0.96, 4.25], [1, 4.35]] },
  jar: { H: 11, view: 0.24, solid: true, opening: 'wax', pts: [[0, 4.3], [0.04, 4.75], [0.5, 4.95], [0.95, 4.8], [1, 4.85]] },
  pillar: { H: 15.5, view: 0.24, solid: true, opening: 'wax', flush: true, pts: [[0, 3.5], [0.03, 3.75], [0.5, 3.8], [0.97, 3.7], [1, 3.6]] },
  tin: { H: 7.4, view: 0.26, solid: true, opening: 'wax', lid: true, pts: [[0, 5.3], [0.04, 5.8], [0.5, 5.85], [0.9, 5.8], [1, 5.9]] },
};

function glaze(spec, rng) {
  const matte = spec.fabric === 'terracotta' || spec.finish === 'matte';
  const a = spec.color || '#C9B8A3', b = spec.color2 || mix(a, '#ffffff', 0.22);
  return { matte, a, b, speck: spec.fabric === 'terracotta' };
}

/** Draw a vase with its base-centre at (cx, 0) in cm (table line y=0). Returns { layers, bounds } */
export async function drawVase(ctx, spec, { shape, cx = 0, scale = 1, color, color2, stems = false, rng, matte, drawShadow = true, dryStyle = 'pampas' }) {
  const S = SHAPES[shape] || SHAPES.cylinder;
  const H = S.H * scale;
  const pr = profile(S.pts.map(([t, r]) => [t, r * scale]), H);
  const k = ctx.cam.k;
  const view = S.view ?? 0.17; // minor/major axis ratio of horizontal circles (camera elevation)
  const rt = pr.r(H), rb = pr.r(0);
  const rimRy = rt * view, baseRy = rb * view;
  const gz = { a: color || '#C9B8A3', b: S.solid ? mix(color || '#C9B8A3', '#ffffff', 0.05) : (color2 || mix(color || '#C9B8A3', '#ffffff', 0.25)) };
  const isMatte = matte ?? false;
  // silhouette (y up is negative): base at y=0, top at y=-H
  const N = 36;
  const right = [], left = [];
  for (let i = 0; i <= N; i++) { const h = (i / N) * H; right.push([cx + pr.r(h), -h]); left.push([cx - pr.r(h), -h]); }
  const frontBase = []; for (let i = 0; i <= 14; i++) { const t = (i / 14) * Math.PI; frontBase.push([cx + rb * Math.cos(t), baseRy * Math.sin(t)]); }
  const backRim = []; for (let i = 0; i <= 14; i++) { const t = Math.PI + (i / 14) * Math.PI; backRim.push([cx + rt * Math.cos(t), -H + rimRy * Math.sin(t)]); }
  // order: base front arc (right->left), left side up, rim back arc (left->right), right side down
  const outline = [...frontBase, ...left, ...backRim.slice().reverse().slice(0, 0), ...[]];
  const poly = [...frontBase, ...left.map((p) => p).slice(1), ...backRim.slice(0), ...right.slice().reverse().slice(1)];
  const d = polyD(poly);
  const bounds = { x0: cx - rt - 3 * scale, x1: cx + rt + 3 * scale, y0: -H - rimRy - 2, y1: baseRy + 1 };
  const pad = 2;
  // ---- albedo: glaze gradient with a wavy transition + wheel lines + speckle
  const g = ctx.id('vg');
  // organic glaze line: a smooth wavy boundary with a few rounded drips hanging below it
  const lr0 = new Rng(((spec.seed | 0) + 3) * 1301);
  const gp = [];
  const nW = 6;
  const ph = lr0.range(0, 6);
  for (let i = 0; i <= nW; i++) {
    const x = cx - rt * 1.3 + (rt * 2.6 * i) / nW;
    gp.push([x, -H * (0.52 + 0.06 * Math.sin(i * 1.15 + ph) + 0.025 * Math.sin(i * 2.9 + ph * 2))]);
  }
  const wl = Curve.through(gp);
  const wp = wl.sample(48);
  const split = `M${f(wp[0][0])} ${f(-H * 1.15)}L${f(wp[wp.length - 1][0])} ${f(-H * 1.15)}` + wp.slice().reverse().map((q) => `L${f(q[0])} ${f(q[1])}`).join('') + 'Z';
  const gblur = `<filter id="gbl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.07"/></filter>`;
  const lines = [];
  const lr = new Rng(((spec.seed | 0) + 5) * 977);
  for (let i = 0; i < 9; i++) { const h = lr.range(0.08, 0.95) * H; lines.push(`<path d="M${f(cx - pr.r(h) - 0.5)} ${f(-h)}H${f(cx + pr.r(h) + 0.5)}" stroke="${lr.chance(0.5) ? '#000' : '#fff'}" stroke-opacity="${f(lr.range(0.03, 0.08))}" stroke-width="${f(lr.range(0.12, 0.4))}"/>`); }
  const speck = (spec.fabric === 'terracotta' || isMatte) ? Array.from({ length: 160 }, () => `<circle cx="${f(cx + lr.range(-rt, rt) * 1.1)}" cy="${f(-lr.range(0, H))}" r="${f(lr.range(0.03, 0.11))}" fill="#000" fill-opacity="${f(lr.range(0.1, 0.35))}"/>`).join('') : '';
  const inner = `<g filter="url(#gbl)"><path d="${split}" fill="${gz.b}"/><path d="${split}" fill="none" stroke="${shadowOf(gz.a, 0.35)}" stroke-opacity=".28" stroke-width=".35"/></g>` + lines.join('') + speck;
  const albedo = await ctx.albedo({ d, bounds, fill: gz.a, inner, pad, defs: gblur });
  // ---- shading via analytic surface-of-revolution normals
  const cam = ctx.cam;
  const X0 = albedo.x, Y0 = albedo.y;
  const normalFn = (ix, iy, out) => {
    const [ucm, vcm] = cam.inv(X0 + ix, Y0 + iy);
    const h = -vcm; // height above base
    const r = pr.r(clamp(h, 0, H));
    const uu = clamp((ucm - cx) / Math.max(r, 0.2), -0.995, 0.995);
    const cph = Math.sqrt(1 - uu * uu);
    let ny = -pr.dr(clamp(h, 0, H)) * cph;
    // gentle wheel-throwing ripple
    ny += 0.03 * Math.sin(h * 3.1 + 0.4) * cph;
    let nx = uu, nz = cph;
    // near the elliptical caps the surface turns towards the viewer
    const capB = h < 0.6 ? 0 : 0;
    const l = Math.hypot(nx, ny, nz);
    out[0] = nx / l; out[1] = ny / l; out[2] = nz / l;
  };
  const mat = isMatte ? { ...FABRICS.terracotta, spec: 0.1, shin: 10, amb: 0.4, wrap: 0.22, tex: { type: 'grit', amp: 0.03, bump: 0.0 } }
    : { ...FABRICS.ceramic, spec: 0.9, shin: 60, amb: 0.34, wrap: 0.16, rim: 0.0, tex: { type: 'none', amp: 0, bump: 0 } };
  if (drawShadow) {
    const [bx, by] = cam.fwd(cx, 0);
    ctx.groundShadow([albedo], { baseY: by, sx: 0.55, sy: 0.07, sigma: 0.32, strength: 0.34, wide: 1.7, wideStrength: 0.15 });
    ctx.contactEllipse(bx, by, rb * k * 1.04, rb * k * 0.17, { strength: 0.5, sigma: 0.32 * k });
  }
  // body
  ctx.shadeAndDraw(albedo, { mat, normalFn, bevel: { sigma: 0.35 * k, h: 0.1 }, edgeAo: 0.1, edgeSigma: 0.4 * k, contact: false });
  // glossy environment band: soft window reflection down the lit side
  if (!isMatte) {
    const refl = await ctx.albedo({ d, bounds, fill: '#ffffff', inner: '', pad });
    for (let j = 0; j < refl.h; j++) for (let i = 0; i < refl.w; i++) {
      const a = albedo.a[j * albedo.w + i]; if (a <= 0) { refl.a[j * refl.w + i] = 0; continue; }
      const [ucm, vcm] = cam.inv(X0 + i, Y0 + j);
      const h = -vcm, r = pr.r(clamp(h, 0, H));
      const u = (ucm - cx) / Math.max(r, 0.2);
      // vertical softbox streak at u ~ -0.42, plus a faint second on the right edge
      const band = Math.exp(-Math.pow((u + 0.44) / 0.085, 2)) * 0.5 + Math.exp(-Math.pow((u - 0.78) / 0.05, 2)) * 0.16;
      const fall = smoothstep(0.02, 0.18, h / H) * (1 - smoothstep(0.82, 1.0, h / H));
      refl.rgb[(j * refl.w + i) * 3] = refl.rgb[(j * refl.w + i) * 3 + 1] = refl.rgb[(j * refl.w + i) * 3 + 2] = 1;
      refl.a[j * refl.w + i] = clamp(band * fall, 0, 0.7) * a;
    }
    const { over } = await import('../lib/raster.mjs');
    over(ctx.film, ctx.W, ctx.H, refl);
  }
  // rim: opening ellipse (dark inside) + highlight lip
  const rimInner = rt * 0.82;
  const [rx0, ry0] = cam.fwd(cx, -H);
  const rg = ctx.id('rg');
  let openSvg;
  if (S.opening === 'bowl') {
    const ic = color2 || darken(gz.a, 0.25);
    openSvg = `<defs><linearGradient id="${rg}" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="${darken(ic, 0.5)}"/><stop offset=".45" stop-color="${ic}"/><stop offset="1" stop-color="${lighten(ic, 0.22)}"/></linearGradient></defs>` +
      `<ellipse cx="${f(cx)}" cy="${f(-H + rimRy * 0.04)}" rx="${f(rimInner * 1.07)}" ry="${f(rimRy * 0.9)}" fill="url(#${rg})"/>` +
      `<ellipse cx="${f(cx + rimInner * 0.06)}" cy="${f(-H + rimRy * 0.35)}" rx="${f(rimInner * 0.62)}" ry="${f(rimRy * 0.5)}" fill="#000" fill-opacity=".1"/>`;
  } else if (S.opening === 'wax') {
    const wc = matte === 'pillar' ? gz.a : (S.waxColor || mix(gz.a, '#F2E7D2', 0.6));
    const top = S.flush ? 0 : rimRy * 0.34;
    openSvg = `<defs><radialGradient id="${rg}" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="${lighten(wc, 0.12)}"/><stop offset=".7" stop-color="${wc}"/><stop offset="1" stop-color="${darken(wc, 0.22)}"/></radialGradient></defs>` +
      `<ellipse cx="${f(cx)}" cy="${f(-H + rimRy * 0.04 + top)}" rx="${f(rimInner * (S.flush ? 1.02 : 1.0))}" ry="${f(rimRy * 0.84)}" fill="url(#${rg})"/>` +
      `<ellipse cx="${f(cx)}" cy="${f(-H + rimRy * 0.1 + top)}" rx="${f(rimInner * 0.18)}" ry="${f(rimRy * 0.2)}" fill="${darken(wc, 0.4)}" fill-opacity=".55"/>` +
      `<path d="M${f(cx)} ${f(-H + rimRy * 0.08 + top)}Q${f(cx + 0.12)} ${f(-H - 0.8 + top)} ${f(cx + 0.06)} ${f(-H - 1.5 + top)}" stroke="#2a211c" stroke-width=".2" fill="none" stroke-linecap="round"/>`;
  } else {
    openSvg = `<defs><radialGradient id="${rg}" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="${darken(gz.a, 0.55)}"/><stop offset="1" stop-color="${darken(gz.a, 0.8)}"/></radialGradient></defs>` +
      `<ellipse cx="${f(cx)}" cy="${f(-H + rimRy * 0.04)}" rx="${f(rimInner)}" ry="${f(rimRy * 0.82)}" fill="url(#${rg})"/>`;
  }
  const rimSvg = openSvg.split('</defs>')[0] + '</defs>' +
    `<ellipse cx="${f(cx)}" cy="${f(-H)}" rx="${f(rt)}" ry="${f(rimRy)}" fill="${lighten(gz.a, 0.12)}" fill-opacity=".9"/>` +
    openSvg.split('</defs>')[1] +
    `<path d="M${f(cx - rimInner)} ${f(-H + rimRy * 0.04)}A${f(rimInner)} ${f(rimRy * 0.82)} 0 0 1 ${f(cx + rimInner)} ${f(-H + rimRy * 0.04)}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width=".18"/>` +
    `<path d="M${f(cx - rt + 0.2)} ${f(-H + rimRy * 0.2)}A${f(rt - 0.2)} ${f(rimRy)} 0 0 0 ${f(cx + rt - 0.2)} ${f(-H + rimRy * 0.2)}" fill="none" stroke="#fff" stroke-opacity="${isMatte ? 0.18 : 0.5}" stroke-width=".16"/>`;
  await ctx.vector(rimSvg, { bounds });
  // handles (amphora)
  const layers = [albedo];
  if (S.handles) {
    for (const sx of [-1, 1]) {
      const hh = H * 0.72, hl = H * 0.5;
      const c = Curve.through([[cx + sx * pr.r(hh) * 0.9, -hh], [cx + sx * (pr.r(hh) + 3.4 * scale), -hh - 2.2 * scale], [cx + sx * (pr.r(hh) + 3.6 * scale), -hl * 1.0 - 3 * scale], [cx + sx * pr.r(hl) * 0.96, -hl]]);
      const { L, R } = tube(c, 1.3 * scale, { n: 30 });
      const hd = polyD([...L, ...R.slice().reverse()]);
      const hb = { x0: cx - rt - 6 * scale, x1: cx + rt + 6 * scale, y0: -H, y1: 0 };
      const hl2 = await ctx.albedo({ d: hd, bounds: hb, fill: gz.a, inner: '', pad });
      ctx.shadeAndDraw(hl2, { mat, bevel: { sigma: 0.45 * k * scale, h: 0.5 * scale }, edgeAo: 0.1, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 } });
      layers.push(hl2);
    }
  }
  if (S.handle === 'mug') {
    const hh = H * 0.78, hl = H * 0.24, rr = (h) => pr.r(h);
    const c = Curve.through([[cx + rr(hh) * 0.92, -hh], [cx + rr(hh) + 2.3, -hh - 0.2], [cx + rr(hh) + 3.5, -H * 0.5], [cx + rr(hl) + 2.2, -hl + 0.1], [cx + rr(hl) * 0.92, -hl]]);
    const { L, R } = tube(c, 1.25, { n: 30 });
    const hb = { x0: cx - rt, x1: cx + rt + 6, y0: -H, y1: 0 };
    const hl2 = await ctx.albedo({ d: polyD([...L, ...R.slice().reverse()]), bounds: hb, fill: gz.a, inner: '', pad });
    ctx.shadeAndDraw(hl2, { mat, bevel: { sigma: 0.4 * k, h: 0.55 }, edgeAo: 0.1, contact: { dx: 0.2, dy: 0.3, sigma: 0.3, strength: 0.3 } });
    layers.push(hl2);
    bounds.x1 += 4.4;
  }
  if (S.lid) { // tin: a thin lid seam below the rim
    await ctx.vector(`<path d="M${f(cx - pr.r(H * 0.8))} ${f(-H * 0.8)}A${f(pr.r(H * 0.8))} ${f(pr.r(H * 0.8) * view)} 0 0 0 ${f(cx + pr.r(H * 0.8))} ${f(-H * 0.8)}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".16"/>`, { bounds });
  }
  // dried stems
  if (stems) await drawStems(ctx, { cx, H, rt, rimRy, rng: rng || new Rng(9), style: dryStyle, scale });
  return { layers, bounds, H, rt, baseY: 0 };
}

async function drawStems(ctx, { cx, H, rt, rimRy, rng, style, scale }) {
  const n = style === 'pampas' ? 7 : style === 'wheat' ? 9 : 6;
  const lightBg = luma(ctx.bg) > 0.55;
  const tan = lightBg ? '#A8895C' : '#D8C49C', olive = lightBg ? '#7A7550' : '#A8A47E', pale = lightBg ? '#CDB387' : '#EFE3C9', dark = '#6F5F43';
  let s = '';
  let defs = '<filter id="sf" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.05"/></filter><filter id="pf" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.14"/></filter>';
  const topY = -H - 0.0;
  for (let i = 0; i < n; i++) {
    const a = (-0.65 + (1.3 * (i + rng.range(0.1, 0.9))) / n);
    const len = H * rng.range(0.7, 1.15) * (style === 'wheat' ? 0.95 : 1.0);
    const x0 = cx + a * rt * 0.55, y0 = topY + rimRy * 0.3;
    const lean = a * rng.range(0.5, 0.9) * len * 0.55 + rng.range(-3, 3) * scale;
    const x1 = x0 + lean, y1 = y0 - len;
    const mx = x0 + lean * 0.35 + rng.range(-2, 2) * scale, my = y0 - len * 0.55;
    const col = rng.chance(0.3) ? olive : tan;
    s += `<path d="M${f(x0)} ${f(y0)}Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" stroke="${darken(col, 0.3)}" stroke-width=".2" stroke-opacity=".35" fill="none" transform="translate(.25 .2)"/>`;
    s += `<path d="M${f(x0)} ${f(y0)}Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" stroke="${col}" stroke-width=".17" fill="none" stroke-linecap="round"/>`;
    const ang = Math.atan2(y1 - my, x1 - mx);
    if (style === 'pampas') {
      // feathery plume: many soft strands
      let pl = '';
      for (let q = 0; q < 26; q++) {
        const t = rng.range(0.55, 1.0), bx = lerp(mx, x1, 0.0) + (x1 - mx) * (t - 0.4), by = y1 + (1 - t) * len * 0.05;
        const L = rng.range(0.1, 0.22) * len, off = rng.range(-0.1, 0.1) * len * 0.5;
        const a2 = ang + rng.range(-0.45, 0.45);
        pl += `<path d="M${f(x1)} ${f(y1 + len * 0.15 * rng.next())}q${f(Math.cos(a2) * L * 0.5 + off)} ${f(Math.sin(a2) * L * 0.5)} ${f(Math.cos(a2) * L + off * 1.5)} ${f(Math.sin(a2) * L)}" stroke="${rng.chance(0.5) ? pale : mix(pale, '#fff', 0.35)}" stroke-width="${f(rng.range(0.12, 0.26))}" stroke-opacity="${f(rng.range(0.7, 0.95))}" fill="none" stroke-linecap="round"/>`;
      }
      s += `<g filter="url(#pf)">${pl}</g>`;
      s += `<ellipse cx="${f(x1)}" cy="${f(y1 - len * 0.12)}" rx="${f(len * 0.045)}" ry="${f(len * 0.17)}" fill="${pale}" opacity=".55" transform="rotate(${f((ang * 180) / Math.PI + 90)} ${f(x1)} ${f(y1)})" filter="url(#pf)"/>`;
    } else if (style === 'wheat') {
      for (let q = 0; q < 9; q++) {
        const t = q / 9, bx = lerp(mx, x1, 0.7) + (x1 - mx) * 0.3 * t, by = lerp(my, y1, 0.75) + (y1 - my) * 0.25 * t - q * 0.25;
        for (const sd of [-1, 1]) s += `<ellipse cx="${f(bx + sd * 0.22)}" cy="${f(by - 0.4 * q * 0)}" rx=".15" ry=".4" fill="${q % 2 ? tan : pale}" transform="rotate(${sd * 28} ${f(bx + sd * 0.22)} ${f(by)})"/>`;
      }
    } else { // eucalyptus / leaf sprigs
      for (let q = 0; q < 9; q++) {
        const t = 0.3 + q * 0.075, bx = lerp(x0, x1, t) + 0.0, by = lerp(y0, y1, t);
        const sd = q % 2 ? 1 : -1;
        s += `<ellipse cx="${f(bx + sd * 0.5)}" cy="${f(by)}" rx=".48" ry=".78" fill="${q % 3 ? olive : '#A5A07A'}" fill-opacity=".92" transform="rotate(${sd * 50} ${f(bx + sd * 0.5)} ${f(by)})"/>`;
      }
    }
  }
  const bounds = { x0: cx - H * 1.3, x1: cx + H * 1.3, y0: -H * 2.8, y1: -H + 4 };
  // clip: only the part above the front rim arc
  const arc = []; for (let i = 0; i <= 14; i++) { const t = Math.PI - (i / 14) * Math.PI; arc.push([cx + rt * Math.cos(t) * 0.97, topY + rimRy * 0.96 * Math.sin(t) + 0.0]); }
  const cid = ctx.id('sc');
  const clip = `<clipPath id="${cid}"><path d="M-1000 -1000H1000V${f(topY)}H${f(cx + rt)}${arc.map((p) => `L${f(p[0])} ${f(p[1])}`).join('')}L${f(cx - rt)} ${f(topY)}H-1000Z"/></clipPath>`;
  await ctx.vector(`<g clip-path="url(#${cid})">${s}</g>`, { bounds, defs: defs + clip });
}

function compose(spec, shot) {
  const rng = new Rng(((spec.seed | 0) + 31) * 7919 + (shot === 'alt' ? 5 : 0));
  return rng;
}

export default {
  async front(ctx, spec) {
    const shape = SHAPES[spec.style] ? spec.style : 'cylinder';
    const S = SHAPES[shape];
    const rng = compose(spec, 'front');
    const stems = spec.stems ?? false;
    const dry = spec.dry || 'pampas';
    const tall = stems ? S.H * 2.05 : S.H;
    const bellyR = Math.max(...S.pts.map((p) => p[1]));
    const b = { x0: -bellyR * 1.6 - (stems ? S.H * 0.38 : 0), x1: bellyR * 1.6 + (stems ? S.H * 0.38 : 0), y0: -tall, y1: 1 };
    const { baseY } = fitObject(ctx, b, { baseFrac: 0.82, maxW: 0.8, maxH: 0.74, kmax: 40 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.64 });
    await drawVase(ctx, spec, { shape, cx: 0, color: spec.color, color2: spec.color2, stems, rng, dryStyle: dry, matte: spec.fabric === 'terracotta' || spec.finish === 'matte' });
  },
  async alt(ctx, spec) {
    const shape = SHAPES[spec.style] ? spec.style : 'cylinder';
    const S = SHAPES[shape];
    const rng = compose(spec, 'alt');
    const second = shape === 'bud' ? 'cylinder' : shape === 'cylinder' ? 'bud' : 'bud';
    const S2 = SHAPES[second];
    const total = S.pts[3][1] * 2.6 + S2.pts[3][1] * 2.4 + 6;
    const b = { x0: -total / 2, x1: total / 2, y0: -S.H * (spec.stems === false ? 1 : 1.0), y1: 1 };
    fitObject(ctx, b, { baseFrac: 0.8, maxW: 0.8, maxH: 0.62, kmax: 34 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.64, seedOffset: 3 });
    const c1 = S.pts[3][1] * 1.25 - total * 0.12, c2 = total * 0.36 - S2.pts[3][1] * 0.4;
    await drawVase(ctx, spec, { shape, cx: -total * 0.1, color: spec.color, color2: spec.color2, stems: false, rng, matte: spec.fabric === 'terracotta' || spec.finish === 'matte' });
    await drawVase(ctx, { ...spec, seed: (spec.seed | 0) + 11 }, { shape: second, cx: total * 0.3, scale: second === 'bud' ? 0.9 : 0.7, color: spec.color2 || mix(spec.color || '#C9B8A3', '#ffffff', 0.35), color2: spec.color, stems: spec.stems !== false, rng, dryStyle: 'wheat', matte: spec.fabric === 'terracotta' || spec.finish === 'matte' });
  },
  async detail(ctx, spec) {
    const shape = SHAPES[spec.style] ? spec.style : 'cylinder';
    const S = SHAPES[shape];
    const rng = compose(spec, 'detail');
    const rt = S.pts[S.pts.length - 1][1];
    // macro on the neck / rim
    const k = ctx.u * 9.5 * (shape === 'bud' ? 5.0 : 3.6);
    ctx.focusCamera(S.pts[3][1] * 0.15, -S.H * 0.8, k, { rot: 0.04, cx: 0.5, cy: 0.52 });
    await ctx.backdrop({ mode: 'surface', horizon: 0.9, shaft: { strength: 0.05 }, leaves: false });
    await drawVase(ctx, spec, { shape, cx: 0, color: spec.color, color2: spec.color2, stems: spec.stems ?? false, rng, matte: spec.fabric === 'terracotta' || spec.finish === 'matte' });
    ctx.setDof({ axis: 'diag', dx: 0.7, dy: 0.7, focus: 0.55, band: 0.12, falloff: 0.4, sigma: 7 });
  },
};

