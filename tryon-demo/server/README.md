# Photo try-on render server (your own GPU)

A small server that renders a realistic **still** of you wearing a garment, on **your** machine, using an open model. The demo's panel gets a **See it properly** button: it sends one camera photo plus the garment image to this server and shows the result. Nothing leaves your network, nothing is stored.

- **Model:** [FASHN VTON v1.5](https://github.com/fashn-AI/fashn-vton-1.5) (Apache-2.0). About 8 GB of VRAM; bfloat16 on RTX 30-series and newer; ~2 GB of weights; output 576×864.
- **This server:** `tryon_server.py`, standard-library Python only (no web framework). One render at a time.
- **Not live.** A render takes seconds on a consumer GPU. The on-device preview stays live in the panel; this is the "hold still, see it properly" moment.

## Setup on the gaming PC (RTX 3070, 8 GB)

Windows: use **WSL2 (Ubuntu)** with the NVIDIA driver installed on Windows (no driver inside WSL), or native Python 3.10–3.12 with a CUDA build of PyTorch. The steps below are the same in both.

1. Get FASHN and its weights (once, ~2 GB):

```bash
git clone https://github.com/fashn-AI/fashn-vton-1.5.git
cd fashn-vton-1.5
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -e .
python scripts/download_weights.py --weights-dir ./weights
```

   The human-parser weights (~244 MB) download on first use. If `pip install -e .` fails on `onnxruntime-gpu`, your CUDA setup is the problem, not this project; fix that first.

2. From the same virtual environment, start the server (this folder):

```bash
cd ../NykaaFashion-tryon/tryon-demo/server
python tryon_server.py --weights ../../../fashn-vton-1.5/weights --preload
```

   It prints the LAN URL it listens on, e.g. `http://192.168.1.50:8000`. `--preload` loads the model at start (otherwise the first render pays the load time).

3. Allow port 8000 through the Windows firewall for **private** networks the first time Windows asks.

4. On the machine running the demo (your Mac), put the URL in `tryon-demo/.env.local`:

```
TRYON_PHOTO_URL=http://192.168.1.50:8000
```

   Restart `npm run dev`. The **See it properly** button appears on the live panel.

## Trying the wiring without a GPU

```bash
python tryon_server.py --mock
```

Pastes the garment image on the photo and stamps **MOCK RENDER** across it. The demo labels the result "Mock render". Only for checking that the plumbing works.

## If it runs out of memory

8 GB is FASHN's stated requirement, so the 3070 is at the limit. Close other GPU users (browsers with hardware acceleration, games), try `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`, and as a last resort `--device cpu` (minutes per image). The next fallback model is [CatVTON](https://github.com/Zheng-Chong/CatVTON) (under 8 GB, but CC BY-NC-SA: personal use only).

## API

- `GET /health` → `{ ok, model, device, ready, loading, busy, error }`
- `POST /tryon` JSON `{ person, garment, category, garment_photo_type?, steps?, seed? }` (images as base64 or data URLs; `category` ∈ `tops | bottoms | one-pieces`; `garment_photo_type` ∈ `flat-lay | model`) → `{ image, ms, model, size }` (`image` is a base64 PNG). `429` while busy, `503` if the model isn't installed, `400` on bad input.
- CORS is open (`--allow-origin`) because this is a LAN tool. Don't expose it to the internet.
