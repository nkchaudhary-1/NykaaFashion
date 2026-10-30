// Tiny worker-thread pool: run(msg) -> Promise(result). Jobs are queued; at most `size` run at once.
import { Worker } from 'node:worker_threads';
import os from 'node:os';

export class Pool {
  constructor(workerFile, size = Math.min(4, os.cpus().length)) {
    this.size = Math.max(1, size);
    this.file = workerFile;
    this.free = [];
    this.queue = [];
    this.pending = new Map();
    this.seq = 0;
    this.workers = [];
    for (let i = 0; i < this.size; i++) this._spawn();
  }
  _spawn() {
    const w = new Worker(this.file, { resourceLimits: { maxOldGenerationSizeMb: 2048 } });
    w.busy = false;
    w.on('message', (m) => {
      if (m.type === 'ready') { this.free.push(w); this._pump(); return; }
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      w.busy = false; this.free.push(w);
      if (m.type === 'error') p.reject(new Error(m.error)); else p.resolve(m);
      this._pump();
    });
    w.on('error', (e) => { for (const [id, p] of this.pending) if (p.worker === w) { this.pending.delete(id); p.reject(e); } });
    this.workers.push(w);
  }
  run(msg) {
    return new Promise((resolve, reject) => { this.queue.push({ msg, resolve, reject }); this._pump(); });
  }
  _pump() {
    while (this.free.length && this.queue.length) {
      const w = this.free.pop(), t = this.queue.shift();
      const id = ++this.seq;
      w.busy = true;
      this.pending.set(id, { resolve: t.resolve, reject: t.reject, worker: w });
      w.postMessage({ ...t.msg, id });
    }
  }
  async close() { await Promise.all(this.workers.map((w) => w.terminate())); }
}
