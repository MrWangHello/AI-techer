"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type PetAction = "idle" | "eat" | "play" | "bathe" | "sleep";

interface Cat3DProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action?: PetAction;
  onTap?: () => void;
  speaking?: boolean;
  onActionEnd?: () => void;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const MOOD_VIDEOS: Record<string, string> = {
  neutral: `${BASE}/videos/white-cat-3d.mp4`,
  happy: `${BASE}/videos/white-cat-happy-3d.mp4`,
  sad: `${BASE}/videos/white-cat-sleepy-3d.mp4`,
  surprised: `${BASE}/videos/white-cat-surprised-3d.mp4`,
  thinking: `${BASE}/videos/white-cat-thinking-3d.mp4`,
};

const ACTION_TO_MOOD: Record<PetAction, "happy" | "sad" | "neutral"> = {
  idle: "neutral",
  eat: "happy",
  play: "happy",
  bathe: "happy",
  sleep: "sad",
};

const MOOD_GLOWS: Record<string, string> = {
  neutral: "rgba(244, 114, 182, 0.08)",
  happy: "rgba(251, 191, 36, 0.1)",
  sad: "rgba(56, 189, 248, 0.08)",
  surprised: "rgba(167, 139, 250, 0.1)",
  thinking: "rgba(99, 102, 241, 0.08)",
};

const SCENE_BG = "#f0ebe4";
const VIDEO_MASK = "radial-gradient(ellipse 58% 58% at 50% 46%, black 48%, transparent 92%)";

function playSafe(video: HTMLVideoElement | null): void {
  if (!video) return;
  video.muted = true;
  const play = video.play();
  if (play) play.catch(() => {});
}

function Stickers({ action, mood }: { action: PetAction; mood: string }) {
  if (action === "eat") {
    return (
      <>
        <span className="animate-sticker-roll pointer-events-none absolute top-8 left-[18%] z-10 text-3xl">🐟</span>
        <span className="animate-sticker-roll-rev pointer-events-none absolute top-16 right-[16%] z-10 text-2xl">🍖</span>
      </>
    );
  }
  if (action === "play") {
    return (
      <>
        <span className="animate-sticker-roll pointer-events-none absolute top-7 right-[14%] z-10 text-3xl">🧶</span>
        <span className="animate-sticker-roll-rev pointer-events-none absolute top-20 left-[14%] z-10 text-2xl">🎾</span>
      </>
    );
  }
  if (action === "bathe") {
    return (
      <>
        <span className="animate-sticker-roll pointer-events-none absolute top-8 left-[22%] z-10 text-2xl">🫧</span>
        <span className="animate-sticker-roll-rev pointer-events-none absolute top-14 right-[20%] z-10 text-2xl">💧</span>
      </>
    );
  }
  if (action === "sleep") {
    return (
      <>
        <span className="animate-sticker-roll pointer-events-none absolute top-6 right-[18%] z-10 text-xl opacity-80">💤</span>
        <span className="animate-sticker-roll-rev pointer-events-none absolute top-16 left-[20%] z-10 text-lg opacity-70">Zz</span>
      </>
    );
  }
  if (mood === "happy") {
    return (
      <>
        <span className="animate-sticker-roll pointer-events-none absolute top-5 left-1/2 z-10 -translate-x-1/2 text-2xl">✨</span>
        <span className="animate-sticker-roll-rev pointer-events-none absolute top-14 right-[18%] z-10 text-xl">💕</span>
      </>
    );
  }
  return (
    <>
      <span className="animate-sticker-roll pointer-events-none absolute top-6 left-[16%] z-10 text-xl">✨</span>
      <span className="animate-sticker-roll-rev pointer-events-none absolute top-12 right-[14%] z-10 text-lg">🌸</span>
      <span className="animate-sticker-roll pointer-events-none absolute top-24 left-[22%] z-10 text-lg opacity-80">⭐</span>
    </>
  );
}

export default function Cat3D({
  mood = "neutral",
  action = "idle",
  onTap,
  speaking = false,
  onActionEnd,
}: Cat3DProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bounce, setBounce] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const bounceTimeoutRef = useRef<number | null>(null);
  const actionEndTimer = useRef<number | null>(null);

  const displayMood = action !== "idle" ? ACTION_TO_MOOD[action] : mood;
  const currentVideo = MOOD_VIDEOS[displayMood] || MOOD_VIDEOS.neutral;
  const glowColor = MOOD_GLOWS[displayMood] || MOOD_GLOWS.neutral;

  useEffect(() => {
    setVideoError(false);
    playSafe(videoRef.current);
  }, [currentVideo]);

  useEffect(() => {
    if (action === "idle") return;
    if (actionEndTimer.current) window.clearTimeout(actionEndTimer.current);
    actionEndTimer.current = window.setTimeout(() => onActionEnd?.(), 2600);
    return () => {
      if (actionEndTimer.current) window.clearTimeout(actionEndTimer.current);
    };
  }, [action, onActionEnd]);

  const handleTap = useCallback(() => {
    setBounce(true);
    if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    bounceTimeoutRef.current = window.setTimeout(() => setBounce(false), 500);
    onTap?.();
  }, [onTap]);

  const maskStyle = {
    WebkitMaskImage: VIDEO_MASK,
    maskImage: VIDEO_MASK,
  } as React.CSSProperties;

  return (
    <div
      className="relative flex h-full w-full select-none items-center justify-center overflow-hidden"
      style={{ backgroundColor: SCENE_BG }}
    >
      {Object.values(MOOD_VIDEOS).map((url) =>
        url === currentVideo ? null : (
          <link key={url} rel="preload" as="video" href={url} />
        )
      )}

      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${glowColor} 0%, transparent 65%)`,
        }}
      />

      <Stickers action={action} mood={displayMood} />

      <div
        className="relative z-10 cursor-pointer"
        style={{
          transform: `translateY(${bounce ? -20 : 0}px) scale(${bounce ? 1.08 : 1})`,
          transition: bounce
            ? "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "transform 0.3s ease-out",
        }}
        onClick={handleTap}
      >
        <div className="relative h-64 w-64 md:h-72 md:w-72 lg:h-80 lg:w-80" style={{ backgroundColor: SCENE_BG }}>
          {videoError ? (
            <video
              src={MOOD_VIDEOS.neutral}
              className="absolute inset-0 h-full w-full object-cover"
              style={maskStyle}
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <video
              ref={videoRef}
              key={currentVideo}
              src={currentVideo}
              className={`absolute inset-0 h-full w-full object-cover ${
                displayMood === "happy"
                  ? "brightness-105 saturate-105"
                  : displayMood === "sad"
                    ? "brightness-95 saturate-90"
                    : ""
              }`}
              style={maskStyle}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              draggable={false}
              onCanPlay={(e) => playSafe(e.currentTarget)}
              onLoadedData={(e) => playSafe(e.currentTarget)}
              onError={() => setVideoError(true)}
            />
          )}

          {speaking && (
            <div className="absolute -bottom-2 left-1/2 z-20 flex h-6 -translate-x-1/2 items-end gap-1">
              <div className="animate-sound-wave-1 w-1.5 rounded-full bg-pink-400/80" />
              <div className="animate-sound-wave-2 w-1.5 rounded-full bg-pink-400/80" />
              <div className="animate-sound-wave-3 w-1.5 rounded-full bg-pink-400/80" />
              <div className="animate-sound-wave-2 w-1.5 rounded-full bg-pink-400/80" />
              <div className="animate-sound-wave-1 w-1.5 rounded-full bg-pink-400/80" />
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2">
        <span
          className={`rounded-full px-3 py-1 text-sm backdrop-blur-sm transition-all duration-300 ${
            displayMood === "happy"
              ? "bg-amber-100/60 text-amber-600"
              : displayMood === "sad"
                ? "bg-sky-100/60 text-sky-500"
                : "bg-pink-100/60 text-pink-400"
          }`}
        >
          {action === "eat"
            ? "吃饭 🐟"
            : action === "play"
              ? "玩耍 🧶"
              : action === "bathe"
                ? "洗澡 🫧"
                : action === "sleep"
                  ? "睡觉 💤"
                  : displayMood === "happy"
                    ? "开心 😊"
                    : displayMood === "sad"
                      ? "困困 😴"
                      : displayMood === "surprised"
                        ? "惊讶 😮"
                        : displayMood === "thinking"
                          ? "思考 🤔"
                          : "平静 🐱"}
        </span>
      </div>
    </div>
  );
}
