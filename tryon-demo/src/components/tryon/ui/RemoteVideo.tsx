"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Plays the provider's output stream and reports every presented frame to the controller — that is how
 * "first frame" and "time-to-switch" are measured. Mounted from `connecting` onward (invisible until live) so the
 * first frame can be seen the moment it exists.
 *
 * Mirrored with CSS: a front camera should read like a mirror. The stream itself is never flipped.
 */
export function RemoteVideo({
  stream,
  onFrame,
  className,
  label,
}: {
  stream: MediaStream | null;
  onFrame: () => void;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.srcObject = stream;
    if (!stream) return;
    void video.play().catch(() => {
      /* autoplay can be refused until a gesture; the shopper just clicked, so this is rare */
    });

    let stopped = false;
    let handle = 0;
    let poll: ReturnType<typeof setInterval> | null = null;

    if (typeof video.requestVideoFrameCallback === "function") {
      const loop = () => {
        if (stopped) return;
        onFrame();
        handle = video.requestVideoFrameCallback(loop);
      };
      handle = video.requestVideoFrameCallback(loop);
    } else {
      // Older browsers: watch currentTime advance.
      let last = -1;
      poll = setInterval(() => {
        if (video.readyState >= 2 && video.currentTime !== last) {
          last = video.currentTime;
          onFrame();
        }
      }, 50);
    }

    return () => {
      stopped = true;
      if (poll) clearInterval(poll);
      if (handle && typeof video.cancelVideoFrameCallback === "function") video.cancelVideoFrameCallback(handle);
      video.srcObject = null;
    };
  }, [stream, onFrame]);

  return (
    <video
      ref={ref}
      aria-label={label}
      playsInline
      muted
      autoPlay
      disablePictureInPicture
      className={cn("-scale-x-100 bg-stage", className)}
    />
  );
}
