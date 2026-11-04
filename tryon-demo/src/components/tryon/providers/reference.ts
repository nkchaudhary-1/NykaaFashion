// Turns a garment's same-origin image URL into the bytes we send as the reference image.
// Decart's servers cannot reach localhost, so the browser fetches the image and sends it as data.
// We also flatten it to a JPEG on white and cap the long edge: smaller upload, no alpha surprises.

const MAX_EDGE = 1024;

export async function prepareReference(url: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`reference image ${url} -> HTTP ${res.status}`);
  const source = await res.blob();
  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas unavailable");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("could not encode reference image"))), "image/jpeg", 0.92),
    );
  } finally {
    bitmap.close();
  }
}
