// Fabric / material table. These numbers drive shading (lib/shade.mjs), fold amplitude and texture.
//   amb/wrap  – ambient floor and wrap-around diffuse (cloth is soft-lit)
//   spec/shin – specular strength / tightness;  metal – 0..1 environment-reflection mix
//   rim       – grazing-angle brightening (velvet, wool halo)
//   foldAmp   – multiplier on drape amplitude;  crisp – crease sharpness;  wrink – small wrinkle amplitude
//   tex       – micro texture {type, amp(albedo modulation), bump(normal perturbation)}
//   alpha     – opacity;  trans – translucency (lifts shadows)
export const FABRICS = {
  cotton:  { amb: 0.38, wrap: 0.25, spec: 0.015, shin: 6, rim: 0.06, foldAmp: 1.0, crisp: 0.5, wrink: 0.5, tex: { type: 'weave', amp: 0.032, bump: 0.05 } },
  linen:   { amb: 0.40, wrap: 0.22, spec: 0.0, shin: 6, rim: 0.05, foldAmp: 1.1, crisp: 0.8, wrink: 1.5, tex: { type: 'slub', amp: 0.06, bump: 0.08 } },
  silk:    { amb: 0.32, wrap: 0.30, spec: 0.26, shin: 9, rim: 0.05, foldAmp: 1.1, crisp: 0.25, wrink: 0.25, tex: { type: 'fine', amp: 0.014, bump: 0.01 } },
  satin:   { amb: 0.26, wrap: 0.30, spec: 0.7, shin: 22, rim: 0.0, foldAmp: 1.2, crisp: 0.2, wrink: 0.15, tex: { type: 'fine', amp: 0.01, bump: 0.0 } },
  chiffon: { amb: 0.50, wrap: 0.40, spec: 0.05, shin: 8, rim: 0.0, foldAmp: 1.25, crisp: 0.2, wrink: 0.3, alpha: 0.93, trans: 0.4, tex: { type: 'fine', amp: 0.012, bump: 0.0 } },
  denim:   { amb: 0.40, wrap: 0.18, spec: 0.02, shin: 8, rim: 0.04, foldAmp: 0.85, crisp: 0.9, wrink: 0.9, tex: { type: 'twill', amp: 0.085, bump: 0.07 } },
  knit:    { amb: 0.42, wrap: 0.30, spec: 0.0, shin: 6, rim: 0.12, foldAmp: 0.8, crisp: 0.3, wrink: 0.3, tex: { type: 'knit', amp: 0.07, bump: 0.06 } },
  velvet:  { amb: 0.32, wrap: 0.4, spec: 0.12, shin: 5, rim: 0.7, foldAmp: 1.1, crisp: 0.25, wrink: 0.2, tex: { type: 'pile', amp: 0.035, bump: 0.02 } },
  leather: { amb: 0.34, wrap: 0.18, spec: 0.55, shin: 28, rim: 0.0, foldAmp: 0.7, crisp: 0.6, wrink: 0.4, tex: { type: 'pebble', amp: 0.06, bump: 0.12 } },
  wool:    { amb: 0.42, wrap: 0.30, spec: 0.0, shin: 6, rim: 0.2, foldAmp: 0.9, crisp: 0.4, wrink: 0.5, tex: { type: 'wool', amp: 0.08, bump: 0.05 } },
  ceramic: { amb: 0.34, wrap: 0.10, spec: 0.85, shin: 55, rim: 0.0, foldAmp: 0, tex: { type: 'none', amp: 0, bump: 0 } },
  glass:   { amb: 0.30, wrap: 0.10, spec: 1.0, shin: 90, rim: 0.4, foldAmp: 0, alpha: 0.55, tex: { type: 'none', amp: 0, bump: 0 } },
  brass:   { amb: 0.30, wrap: 0.10, spec: 0.8, shin: 40, metal: 0.9, rim: 0.0, foldAmp: 0, tex: { type: 'none', amp: 0, bump: 0 } },
  wood:    { amb: 0.40, wrap: 0.22, spec: 0.22, shin: 18, rim: 0.0, foldAmp: 0, tex: { type: 'wood', amp: 0.07, bump: 0.02 } },
  terracotta: { amb: 0.46, wrap: 0.25, spec: 0.04, shin: 8, rim: 0.0, foldAmp: 0, tex: { type: 'grit', amp: 0.05, bump: 0.05 } },
};

export function fabricOf(name, fallback = 'cotton') {
  return { name: FABRICS[name] ? name : fallback, ...FABRICS[FABRICS[name] ? name : fallback] };
}

/** sensible default fabric by pattern/kind when spec.fabric is absent */
export function defaultFabric(spec) {
  const p = spec.pattern;
  if (spec.fabric) return spec.fabric;
  if (p === 'sequin' || p === 'tonal-jacquard') return 'silk';
  if (p === 'embroidery' || p === 'mirror-work') return 'cotton';
  if (p === 'block-print' || p === 'bandhani' || p === 'ikat') return 'cotton';
  return 'cotton';
}
