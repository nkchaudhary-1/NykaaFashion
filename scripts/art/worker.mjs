// Worker thread: renders jobs sent by render.mjs / preview.mjs.
import { parentPort } from 'node:worker_threads';
import { renderJob, renderRaw } from './lib/engine.mjs';
import { sharp } from './lib/raster.mjs';

sharp.concurrency(1);
parentPort.on('message', async (msg) => {
  try {
    if (msg.type === 'job') {
      const r = await renderJob(msg.job, msg.opts);
      parentPort.postMessage({ type: 'done', id: msg.id, ...r, webp: new Uint8Array(r.webp) });
    } else if (msg.type === 'raw') {
      // preview: render at a reduced size and hand back a PNG buffer
      const j = { ...msg.job, w: msg.w, h: msg.h };
      const { rgb, w, h, pins } = await renderRaw(j);
      const png = await sharp(Buffer.from(rgb.buffer, rgb.byteOffset, rgb.byteLength), { raw: { width: w, height: h, channels: 3 } }).png({ compressionLevel: 3 }).toBuffer();
      parentPort.postMessage({ type: 'done', id: msg.id, png: new Uint8Array(png), w, h, pins: pins || null });
    }
  } catch (e) {
    parentPort.postMessage({ type: 'error', id: msg.id, error: String(e && e.stack ? e.stack : e) });
  }
});
parentPort.postMessage({ type: 'ready' });
