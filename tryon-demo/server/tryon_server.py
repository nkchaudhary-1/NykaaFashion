#!/usr/bin/env python3
"""
Photo try-on render server — runs on YOUR machine (the gaming PC), nothing leaves your network.

POST /tryon   JSON {person, garment, category, garment_photo_type?, steps?, seed?}  (images as base64 or data URLs)
              -> JSON {image (PNG, base64), ms, model, size: [w, h]}
GET  /health  -> JSON {ok, model, device, ready, loading, busy}

Model: FASHN VTON v1.5 (Apache-2.0, ~8 GB VRAM, bf16 on RTX 30xx/40xx). Install it next to this repo:

    git clone https://github.com/fashn-AI/fashn-vton-1.5.git
    cd fashn-vton-1.5 && python -m venv .venv && . .venv/bin/activate   (Windows: .venv\\Scripts\\activate)
    pip install -e . && python scripts/download_weights.py --weights-dir ./weights

then, from the same venv:

    python tryon_server.py --weights ../fashn-vton-1.5/weights          # http://<this-pc>:8000
    python tryon_server.py --mock                                        # no GPU: wiring test only, clearly labelled

Standard library only: no web framework to install. One render at a time; a second request while busy gets 429.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import socket
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

CATEGORIES = ("tops", "bottoms", "one-pieces")
PHOTO_TYPES = ("flat-lay", "model")
MAX_BODY = 24 * 1024 * 1024  # 24 MB of JSON: two photos is plenty
MAX_SIDE = 1536  # px; inputs larger than this are downscaled before inference


class Renderer:
    """Loads the model lazily (first request, or --preload) and renders one image at a time."""

    def __init__(self, weights: str | None, mock: bool, device: str | None):
        self.weights = weights
        self.mock = mock
        self.device = device
        self.pipeline: Any = None
        self.loading = False
        self.error: str | None = None
        self.lock = threading.Lock()
        self.busy = False
        self.model_name = "mock" if mock else "fashn-vton-1.5"

    @property
    def ready(self) -> bool:
        return self.mock or self.pipeline is not None

    def load(self) -> None:
        if self.mock or self.pipeline is not None:
            return
        self.loading = True
        try:
            from fashn_vton import TryOnPipeline  # type: ignore

            kwargs: dict[str, Any] = {"weights_dir": self.weights or "./weights"}
            if self.device:
                kwargs["device"] = self.device
            self.pipeline = TryOnPipeline(**kwargs)
            self.error = None
        except Exception as e:  # noqa: BLE001 — surfaced to the client as-is
            self.error = f"{type(e).__name__}: {e}"
            raise
        finally:
            self.loading = False

    def render(self, person, garment, category: str, photo_type: str, steps: int, seed: int):
        from PIL import Image

        if self.mock:
            return self._mock(person, garment)
        self.load()
        result = self.pipeline(
            person_image=person,
            garment_image=garment,
            category=category,
            garment_photo_type=photo_type,
            num_timesteps=steps,
            seed=seed,
            num_samples=1,
        )
        img = result.images[0]
        return img if isinstance(img, Image.Image) else Image.fromarray(img)

    @staticmethod
    def _mock(person, garment):
        """A crude paste, labelled MOCK across the image: proves the wiring, never passes for a render."""
        from PIL import Image, ImageDraw

        out = person.convert("RGB").copy()
        w, h = out.size
        gw = int(w * 0.5)
        gh = int(gw * garment.height / max(1, garment.width))
        g = garment.convert("RGBA").resize((gw, gh))
        out.paste(g, (int(w * 0.25), int(h * 0.22)), g)
        d = ImageDraw.Draw(out)
        band = int(h * 0.08)
        d.rectangle([0, h - band, w, h], fill=(20, 20, 20))
        d.text((12, h - band + band // 3), "MOCK RENDER - no model loaded (server started with --mock)", fill=(255, 220, 120))
        return out


def decode_image(value: str):
    from PIL import Image, ImageOps

    if not isinstance(value, str) or not value:
        raise ValueError("image must be a base64 string or data URL")
    if value.startswith("data:"):
        value = value.split(",", 1)[1]
    raw = base64.b64decode(value, validate=False)
    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img).convert("RGB")
    if max(img.size) > MAX_SIDE:
        img.thumbnail((MAX_SIDE, MAX_SIDE))
    return img


def encode_png(img) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


class Handler(BaseHTTPRequestHandler):
    renderer: Renderer  # set on the class by main()
    allow_origin: str = "*"
    server_version = "tryon-server/1"

    def log_message(self, fmt, *args):  # quieter, no client IPs in logs beyond the default
        sys.stderr.write("[tryon-server] %s\n" % (fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", self.allow_origin)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")

    def _json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] != "/health":
            return self._json(404, {"error": "not_found"})
        r = self.renderer
        return self._json(
            200,
            {
                "ok": True,
                "model": r.model_name,
                "device": r.device or ("cuda" if _cuda_available() else "cpu"),
                "ready": r.ready,
                "loading": r.loading,
                "busy": r.busy,
                "error": r.error,
            },
        )

    def do_POST(self):
        if self.path.split("?")[0] != "/tryon":
            return self._json(404, {"error": "not_found"})
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._json(413, {"error": "body_too_large"})
        try:
            req = json.loads(self.rfile.read(length))
            person = decode_image(req.get("person"))
            garment = decode_image(req.get("garment"))
            category = req.get("category", "tops")
            photo_type = req.get("garment_photo_type", "flat-lay")
            steps = int(req.get("steps", 30))
            seed = int(req.get("seed", 42))
            if category not in CATEGORIES:
                raise ValueError(f"category must be one of {CATEGORIES}")
            if photo_type not in PHOTO_TYPES:
                raise ValueError(f"garment_photo_type must be one of {PHOTO_TYPES}")
            steps = max(10, min(60, steps))
        except Exception as e:  # noqa: BLE001
            return self._json(400, {"error": "bad_request", "detail": str(e)})

        r = self.renderer
        if not r.lock.acquire(blocking=False):
            return self._json(429, {"error": "busy"})
        try:
            r.busy = True
            t0 = time.perf_counter()
            img = r.render(person, garment, category, photo_type, steps, seed)
            ms = int((time.perf_counter() - t0) * 1000)
        except ImportError as e:
            return self._json(503, {"error": "model_not_installed", "detail": str(e)})
        except Exception as e:  # noqa: BLE001
            return self._json(500, {"error": "render_failed", "detail": f"{type(e).__name__}: {e}"})
        finally:
            r.busy = False
            r.lock.release()
        return self._json(200, {"image": encode_png(img), "ms": ms, "model": r.model_name, "size": list(img.size)})


def _cuda_available() -> bool:
    try:
        import torch  # type: ignore

        return bool(torch.cuda.is_available())
    except Exception:  # noqa: BLE001
        return False


def _lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:  # noqa: BLE001
        return "127.0.0.1"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--host", default="0.0.0.0", help="bind address (default: every interface, for the LAN)")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--weights", default=os.environ.get("FASHN_WEIGHTS", "./weights"), help="FASHN weights dir")
    ap.add_argument("--device", default=None, help='force "cuda" or "cpu" (default: auto)')
    ap.add_argument("--mock", action="store_true", help="no model: paste the garment and stamp MOCK on it (wiring tests only)")
    ap.add_argument("--preload", action="store_true", help="load the model at start instead of on the first request")
    ap.add_argument("--allow-origin", default="*", help="CORS origin (default *: this is a LAN tool, not a public API)")
    args = ap.parse_args()

    try:
        import PIL  # noqa: F401
    except ImportError:
        print("Pillow is required: pip install pillow", file=sys.stderr)
        sys.exit(2)

    renderer = Renderer(args.weights, args.mock, args.device)
    Handler.renderer = renderer
    Handler.allow_origin = args.allow_origin
    if args.preload and not args.mock:
        print("[tryon-server] loading FASHN VTON 1.5 …", file=sys.stderr)
        renderer.load()
        print("[tryon-server] model ready", file=sys.stderr)

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    mode = "MOCK (no model)" if args.mock else f"FASHN VTON 1.5 (weights: {args.weights})"
    print(f"[tryon-server] {mode}", file=sys.stderr)
    print(f"[tryon-server] listening on http://{_lan_ip()}:{args.port}  — put this URL in the demo's .env.local as TRYON_PHOTO_URL", file=sys.stderr)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
