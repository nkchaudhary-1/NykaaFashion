import metaJson from "@/data/generated/image-meta.json";

interface Meta {
  w: number;
  h: number;
  avg: string;
  pins?: Array<{ id: string; x: number; y: number }>;
  /** backdrop colour at the left/right edges of a wide scene (before items), so a pillar-boxed cover continues the wall */
  edge?: { wall: [string, string]; floor: [string, string]; floorY: number };
  blur?: string;
  placeholder?: boolean;
}
const meta = metaJson as Record<string, Meta>;

/** Image keys are paths under /public/img without extension — swap any file for real photography and nothing else changes. */
export const imgSrc = (key: string) => `/img/${key}.webp`;
export const imgAvg = (key: string) => meta[key]?.avg ?? "#e9e1d6";
export const imgPins = (key: string) => meta[key]?.pins ?? [];
export const imgBlur = (key: string) => meta[key]?.blur;
export const imgEdge = (key: string) => meta[key]?.edge;
export const imgSize = (key: string, fallback: [number, number] = [1000, 1250]): [number, number] => {
  const m = meta[key];
  return m ? [m.w, m.h] : fallback;
};
