# Plan — generative try-on, self-hosted

*Goal as stated: "a new approach, exactly how Decart does it", running on your own machine. This is the plan, staged so each step produces something you can see, with an honest line between what your PC can do and what needs a bigger machine.*

## 1. What Decart actually does

Your camera stream goes to their GPUs. A generative video model (Lucy VTON) **redraws every frame**, conditioned on the garment image and a short prompt, and the frames stream back over WebRTC at 20–30 fps, 720p. It generates cloth; it does not move a picture of cloth. That is why fit, folds and crossed arms look right.

Three things make it work, and all three are the expensive part:

| Ingredient | What it is | What it costs |
| --- | --- | --- |
| A video try-on model | A multi-billion-parameter video diffusion model trained to replace clothing, conditioned on a garment image | Training: large video datasets, weeks on hundreds of GPUs |
| Real-time inference | The model distilled to a few steps and made *causal* (streams frame by frame instead of rendering a whole clip), served with a custom inference stack | Research-grade engineering; one high-end GPU (H100/B200 class) **per viewer** |
| Streaming | WebRTC in and out, tokens, autoscaling, moderation | Ordinary infrastructure, the easy part |

Decart's own open release, Lucy Edit Dev (5B, Wan2.2-based), is the non-real-time cousin: it edits a *recorded* clip from a text instruction, including "change the top". Its weights are non-commercial.

## 2. What your hardware can and cannot do

Ryzen 7, 32 GB RAM, **RTX 3070 with 8 GB VRAM**.

| | Fits the 3070? | Result | Time per result |
| --- | --- | --- | --- |
| Image try-on (FASHN VTON 1.5, Apache-2.0; CatVTON, non-commercial) | **Yes** (~8 GB, at the limit) | A realistic still of you in the garment | 5–20 s |
| Video try-on, small (MagicTryOn-1.3B / -Turbo, Wan2.1-based, non-commercial) | **Maybe**, with CPU offload at low resolution; unproven | A 3–5 s clip of you, dressed, played back | Minutes |
| Video try-on, large (MagicTryOn-14B, Lucy Edit Dev 5B) | No (needs 24–80 GB) | Better clips | Rented GPU: 30 s–3 min per clip |
| Real-time video try-on (what Decart does) | No, on any consumer card | Live | Needs a data-centre GPU per stream plus a distilled causal model that **does not exist in the open** |

No amount of engineering changes the last row on a 3070. The row is bound by memory and by a model nobody has released.

## 3. The staged plan

Each stage is a shippable state of the same demo panel. Later stages don't replace earlier ones; they add a mode.

### Stage A — Realistic stills on your PC *(this week)*

- **What you get:** the live preview as now; a **See it properly** button; hold still, and 5–20 s later the panel shows a real render of you in the garment. Nothing leaves your network.
- **Engine:** FASHN VTON 1.5 on the 3070. Apache-2.0, so it survives beyond a demo.
- **Status:** server written and tested in mock mode (`server/tryon_server.py`); the panel side is not wired yet.
- **You do:** install FASHN on the PC (four commands, `server/README.md`), run the server, put its URL in `.env.local`.
- **I do:** wire the button, the rendering state, the result view and the error copy; test against the mock server here; hand you the setup.
- **Gate:** does a real still of you look good enough to be worth showing? If yes, Stage B is worth the effort. If not, the garment photos or the model are the problem, and we fix that before touching video.

### Stage B — Dressed clips on your PC, or a rented GPU *(2–3 weekends)*

- **What you get:** **Record 4 seconds**, wait, play back dressed, with your own movement. Generation, not overlay; not live.
- **Engine candidates:** MagicTryOn-Turbo or -1.3B (video diffusion on Wan2.1, 50× faster distilled variant). Heavy preprocessing pipeline (DensePose, agnostic masks, captions, line maps). Non-commercial licence: fine for a personal demo, not for a product.
- **Hardware truth:** on the 3070 this is an experiment that may run at 480p with offloading in minutes per clip, or may not fit. A rented GPU (A100/H100, $2–4/hour, your account, your server) makes it reliable: 30 s–2 min per clip, maybe $20–60 for the whole experiment.
- **I do:** the clip recorder in the panel, the batch server (same shape as the photo server), the preprocessing script, the first evaluation on your garments.
- **Gate:** quality and time per clip. This is the point where "self-hosted generative try-on on video" either exists or doesn't.

### Stage C — Toward real-time *(months; a research project)*

- **Target:** 512p at 5–10 fps with ~1 s latency on a rented H100, in the browser over WebRTC. "Laggy live". Honest, and a real engineering result.
- **How:** take a video try-on model and make it causal and few-step (the Self-Forcing / CausVid family of techniques: generate frame by frame with a short context, distilled from the full model), plus a streaming inference server.
- **Needs:** ML engineering time (training runs on 4–8 H100s for days each, $5k–50k across the project), the Stage B pipeline as the base, and a tolerance for things not working for weeks.
- **Gate:** whether you are building a product company. Below that line, Stage C is not worth your money.

### Stage D — Decart-grade

Real-time 720p at 30 fps with their quality is a trained-from-scratch model, a custom inference stack, a GPU fleet, and a team of 10–30. It is what Decart raised money to do. The plan does not pretend otherwise.

## 4. What "run it on my local system" means per stage

- **A and B run on the PC** (B possibly on a rented box you control). I cannot run anything on your PC from this session: Remote Control didn't expose the folder. So each stage ships as code plus a setup script plus a prompt you can paste into Claude Code on the PC, which then does the install with you.
- **C runs on rented GPUs** you own the account for. Your data goes to your rented machine, not a vendor's product.

## 5. Risks, in the order they'll bite

1. **8 GB VRAM.** FASHN says ~8 GB; Windows and the browser eat some of it. Mitigation: close GPU users, `--device cpu` as a slow fallback, CatVTON as a smaller fallback (non-commercial).
2. **Preprocessing pipelines** for video models are fragile (DensePose/detectron2 builds). Budget an evening of error-pasting per model.
3. **Licences.** Only FASHN is commercially clean among the candidates. Everything video is non-commercial today. Fine for a portfolio, a wall for a product.
4. **Garment images.** Generative models want clean product shots. The art-engine renders may read as cartoons; real photos will matter from Stage A on.
5. **Expectation.** Stage A and B produce the *look* of the reference; nothing until Stage C produces the *feel* of it, and nothing self-hosted matches it today.

## 6. The one decision

Stage A is cheap, local, Apache-licensed and already half built: it should start now. The real decision is whether Stage B's answer ("self-hosted video try-on exists, slowly") is the goal, or whether live is non-negotiable, in which case the honest options are Decart with a zero-data-retention key, or Stage C as a funded project.

**Recommendation:** A now, B as a time-boxed experiment, decide on C only with B's results in hand.
