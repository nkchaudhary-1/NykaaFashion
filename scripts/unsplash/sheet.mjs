// Contact sheets: a grid of numbered thumbnails in one JPEG, so a whole group of candidates (or of built pictures) can be judged in a single look.
import sharp from "sharp";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const badge = (w, h, label, { fill = "#000", opacity = 0.82, size = 22, text = "#fff" } = {}) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${fill}" fill-opacity="${opacity}"/><text x="8" y="${Math.round(h / 2 + size * 0.35)}" font-family="Inter, DejaVu Sans, sans-serif" font-size="${size}" font-weight="600" fill="${text}">${esc(label)}</text></svg>`,
  );

/**
 * @param cells  [{ input: Buffer | path, label: string|number, sub?: string, mark?: boolean }]   label = the number to quote; sub = a short caption (size, photographer…); mark = already picked
 * @param opts   { cols, cellW, cellH, gap, bg, fit, labelSize }     fit "inside" shows the whole picture; "cover" fills the cell
 * @returns      JPEG Buffer
 */
export async function contactSheet(cells, { cols = 5, cellW = 300, cellH = 380, gap = 6, bg = "#202020", fit = "inside", labelSize = 22 } = {}) {
  const rows = Math.max(1, Math.ceil(cells.length / cols));
  const W = cols * cellW + (cols + 1) * gap;
  const H = rows * cellH + (rows + 1) * gap;
  const layers = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const left = gap + (i % cols) * (cellW + gap);
    const top = gap + Math.floor(i / cols) * (cellH + gap);
    try {
      const img = await sharp(c.input).rotate().resize(cellW, cellH, { fit, background: "#2e2e2e", position: "centre" }).flatten({ background: "#2e2e2e" }).jpeg({ quality: 82 }).toBuffer();
      layers.push({ input: img, left, top });
    } catch {
      layers.push({ input: badge(cellW, cellH, "missing", { fill: "#7a1f1f", opacity: 1 }), left, top });
    }
    const label = String(c.label);
    const bw = Math.min(cellW, Math.max(46, Math.round(16 + label.length * labelSize * 0.62)));
    layers.push({ input: badge(bw, Math.round(labelSize * 1.55), label, { fill: c.mark ? "#0b6b3a" : "#000", size: labelSize }), left, top });
    if (c.sub) layers.push({ input: badge(cellW, 22, c.sub, { size: 13, opacity: 0.7 }), left, top: top + cellH - 22 });
  }
  return sharp({ create: { width: W, height: H, channels: 3, background: bg } }).composite(layers).jpeg({ quality: 84 }).toBuffer();
}
