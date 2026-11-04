// Every user-facing string in the try-on panel, in one place. Tone: plain, specific, calm — never cute about the camera.
//
// Rules this file enforces (PRD, "UX writing requirements"):
//  • a provider that streams video elsewhere never implies local processing; no latency figure is ever promised
//  • the Simulation badge is unmissable and honest — no "demo" euphemism that hides it isn't the real model
//  • every error that stops the camera says the camera is off, and that is made true in the controller
import type { PermissionReason, TryOnErrorKind } from "./types.ts";

export const copy = {
  panelLabel: "Live try-on",

  idle: {
    title: "Your try-on appears here.",
    body: "Choose a piece to see it on you, live.",
    dragHint: "Or drag a piece onto this panel.",
    drop: "Drop to try on",
  },

  consent: {
    title: "We'll use your camera to show the look on you.",
    // A provider that streams video elsewhere must say so here. None of the providers in this project does.
    live: {
      body: "Your camera video is sent to the try-on service that renders the garment, and streamed back live. We don't record or save anything. You can close it any time to turn the camera off.",
      note: "",
    },
    sim: {
      body: "This preview runs in your browser. Your camera video stays in this browser tab: it isn't sent anywhere or saved. You can close it any time to turn the camera off.",
      note: "The garment is placed by on-device tracking, an approximation of how it would sit on you.",
    },
    agree: "Agree & continue",
    decline: "Not now",
    trying: (name: string) => `Trying on ${name}`,
  },

  requesting: {
    title: "Waiting for your camera permission.",
    body: "Your browser is asking to use your camera. Choose Allow to continue.",
    cancel: "Cancel",
  },

  connecting: { text: "Starting your live try-on…", cancel: "Cancel" },
  switching: (name: string) => `Switching to ${name}…`,
  degraded: "Slow connection. Video may lag.",
  switchFailed: (failed: string, current: string) => `Couldn't switch to ${failed}. Still showing ${current}.`,

  retry: "Retry",
  close: "Close",
  closeLabel: "Close try-on and turn off camera",
  cameraOn: "Camera on",
  fullscreenEnter: "Enter fullscreen",
  fullscreenExit: "Exit fullscreen",
  garmentSwitcher: "Choose a piece",
  tryOn: "Try on",
  tryOnLabel: (name: string) => `Try on ${name}`,

  sim: {
    badge: "Simulation",
    tooltip: "Preview of the interface. The garment shape is a placeholder, not a model's output.",
    info: "About this preview",
  },

  /** Badge + tooltip per not-live provider flavour. The badge must be unmissable and honest. */
  labels: {
    tracking: {
      badge: "On-device preview",
      tooltip: "The garment follows your body using tracking in your browser. It's an approximation, not AI fit or drape. Nothing leaves your device.",
    },
    silhouette: {
      badge: "Simulation",
      tooltip: "Preview of the interface. The garment shape is a placeholder, not a model's output.",
    },
  },

  /** What the shopper should do so the on-device tracker can place the garment. */
  hints: {
    "no-person": "Step into the frame with your shoulders in view.",
    "too-far": "Come a little closer.",
    "shoulders-hidden": "Keep both shoulders in view.",
  },

  /** Still-image render on the shopper's own server ("See it properly"). */
  photo: {
    button: "See it properly",
    hint: (host: string) => `One photo → ${host}`,
    rendering: (host: string, seconds: number) => `Rendering on ${host}… ${seconds}s`,
    cancel: "Cancel",
    back: "Back to live",
    again: "Render again",
    label: (model: string, ms: number) =>
      model === "mock" ? "Mock render — the server has no model loaded" : `Rendered still · ${model} · ${(ms / 1000).toFixed(1)} s on your PC`,
    alt: (name: string) => `Rendered still of you wearing ${name}`,
    retry: "Retry",
    announce: {
      rendering: (host: string) => `Rendering a still on ${host}.`,
      done: "Still ready.",
    },
    errors: {
      unreachable: (host: string) => `Couldn't reach your render server at ${host}.`,
      busy: "Your PC is still rendering the last one.",
      not_installed: "The render server has no model installed.",
      bad_request: "The render server rejected the photo.",
      render_failed: (detail?: string) => `Render failed on your PC${detail ? `: ${detail}` : "."}`,
      timeout: "The render took too long.",
      unknown: "Something went wrong on the render server.",
      capture: "Couldn't take a photo from the camera.",
    },
  },

  readout: {
    sim: "Latency isn't measured in simulation.",
    firstFrame: "First frame",
    lastSwitch: "Last switch",
    connection: "Connection",
    measuredNote: "Measured here, on this device and network.",
  },
} as const;

type Card = { title: string; body: string; action?: string; detail?: string };

export function deniedCopy(reason: PermissionReason | null): Card {
  switch (reason) {
    case "dismissed":
      return {
        title: "Camera access wasn't granted.",
        body: "Try-on needs your camera. Choose Allow when your browser asks, then try again.",
        action: copy.retry,
      };
    case "no-camera":
      return {
        title: "No camera found.",
        body: "Try-on needs a camera. Connect one, or check it isn't switched off, then retry.",
        action: copy.retry,
      };
    case "in-use":
      return {
        title: "Camera's busy.",
        body: "Another app or tab is using your camera. Close it, then retry.",
        action: copy.retry,
      };
    case "unsupported":
      return {
        title: "Camera isn't available here.",
        body: "Browsers only allow camera access on secure pages (https) or localhost. Open this page that way, then retry.",
        action: copy.retry,
      };
    case "denied":
    default:
      return {
        title: "Camera's blocked.",
        body: "Try-on needs your camera. Allow it in your browser's address-bar settings, then retry.",
        action: copy.retry,
      };
  }
}

export function errorCopy(kind: TryOnErrorKind | undefined, opts: { maxSessionSeconds?: number } = {}): Card {
  switch (kind) {
    case "dropped":
      return {
        title: "Lost the connection.",
        body: "The live try-on dropped. Your camera's been turned off. Try again?",
        action: copy.retry,
      };
    case "backgrounded":
      return {
        title: "Paused.",
        body: "Try-on stops when you leave this tab, and your camera was turned off. Resume?",
        action: "Resume",
      };
    case "limit": {
      const s = opts.maxSessionSeconds ?? 0;
      const span = s >= 60 && s % 60 === 0 ? `${s / 60} minute${s === 60 ? "" : "s"}` : `${s} seconds`;
      return {
        title: "Time's up for this session.",
        body: `To limit cost, live sessions in this demo end after ${span}. Your camera's been turned off.`,
        action: "Start again",
      };
    }
    case "timeout":
      return {
        title: "Taking too long.",
        body: "The live try-on didn't start in time. Your camera's been turned off. Try again?",
        action: copy.retry,
        detail: "No first frame arrived in time.",
      };
    case "capacity":
      return {
        title: "The try-on service is busy.",
        body: "There's no capacity right now. Your camera's been turned off. Try again in a moment?",
        action: copy.retry,
      };
    case "ended":
      return {
        title: "The session ended.",
        body: "The try-on service ended this session. Your camera's been turned off.",
        action: copy.retry,
      };
    case "connect":
    case "unknown":
    default:
      return {
        title: "Couldn't start try-on.",
        body: "The try-on service didn't connect. Your camera's been turned off. Try again?",
        action: copy.retry,
      };
  }
}

/** The honest account of what this build does with the shopper's video, for the page footer. */
export function disclosure(opts: { photoHost?: string | null }) {
  const photo = opts.photoHost
    ? ` "See it properly" sends one camera photo and the garment image to your own render server at ${opts.photoHost} and shows the result; that server keeps nothing.`
    : "";
  return {
    title: "On-device preview",
    body: `This build runs entirely in your browser and on hardware you control: body tracking places a flat image of the garment on you and follows your movement. It's an approximation, not fit or drape, and nothing leaves this browser tab.${photo} No AI service and no API key are involved anywhere in this project.`,
  };
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** 1840 -> "1.8 s", 640 -> "640 ms". Observed values, shown as observed. */
export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}
