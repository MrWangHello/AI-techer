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

/** 还原旧 5 段 mood 片：动作幅度比合成静帧大 */
const MOOD_VIDEOS: Record<string, string> = {
  neutral: `${BASE}/videos/white-cat-3d.mp4`,
  happy: `${BASE}/videos/white-cat-happy-3d.mp4`,
  sad: `${BASE}/videos/white-cat-sleepy-3d.mp4`,
  surprised: `${BASE}/videos/white-cat-surprised-3d.mp4`,
  thinking: `${BASE}/videos/white-cat-thinking-3d.mp4`,
};

const MOOD_POSTERS: Record<string, string> = {
  neutral: `${BASE}/images/white-cat.jpg`,
  happy: `${BASE}/images/white-cat-happy.jpg`,
  sad: `${BASE}/images/white-cat-sleepy.jpg`,
  surprised: `${BASE}/images/white-cat-surprised.jpg`,
  thinking: `${BASE}/images/white-cat-curious.jpg`,
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

/** 五段旧片合计约 470KB，全部进内存，切换不再重新拉文件 */
const videoCache = new Map<string, string>();

async function prefetchVideo(url: string): Promise<string> {
  const hit = videoCache.get(url);
  if (hit) return hit;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blobUrl = URL.createObjectURL(await res.blob());
    videoCache.set(url, blobUrl);
    return blobUrl;
  } catch {
    return url;
  }
}

function playSafe(video: HTMLVideoElement | null): void {
  if (!video) return;
  const play = video.play();
  if (play) play.catch(() => {});
}

export default function Cat3D({
  mood = "neutral",
  action = "idle",
  onTap,
  speaking = false,
  onActionEnd,
}: Cat3DProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [front, setFront] = useState<0 | 1>(0);
  const [slotSrc, setSlotSrc] = useState<[string | null, string | null]>([null, null]);
  const [bounce, setBounce] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [ready, setReady] = useState(false);
  const bounceTimeoutRef = useRef<number | null>(null);
  const actionEndTimer = useRef<number | null>(null);
  const frontRef = useRef<0 | 1>(0);
  const showingUrl = useRef<string | null>(null);

  const displayMood = action !== "idle" ? ACTION_TO_MOOD[action] : mood;
  const currentVideo = MOOD_VIDEOS[displayMood] || MOOD_VIDEOS.neutral;
  const currentPoster = MOOD_POSTERS[displayMood] || MOOD_POSTERS.neutral;
  const glowColor = MOOD_GLOWS[displayMood] || MOOD_GLOWS.neutral;

  useEffect(() => {
    frontRef.current = front;
  }, [front]);

  useEffect(() => {
    Object.values(MOOD_VIDEOS).forEach((url) => {
      void prefetchVideo(url);
    });
  }, []);

  useEffect(() => {
    if (action === "idle") return;
    if (actionEndTimer.current) window.clearTimeout(actionEndTimer.current);
    actionEndTimer.current = window.setTimeout(() => onActionEnd?.(), 2600);
    return () => {
      if (actionEndTimer.current) window.clearTimeout(actionEndTimer.current);
    };
  }, [action, onActionEnd]);

  useEffect(() => {
    let cancelled = false;
    void prefetchVideo(currentVideo).then((src) => {
      if (cancelled) return;
      if (showingUrl.current === currentVideo) {
        playSafe(frontRef.current === 0 ? videoARef.current : videoBRef.current);
        setReady(true);
        return;
      }
      const back = frontRef.current === 0 ? 1 : 0;
      setSlotSrc((prev) => {
        const next: [string | null, string | null] = [prev[0], prev[1]];
        next[back] = src;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [currentVideo]);

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

  const promote = (index: 0 | 1) => {
    showingUrl.current = currentVideo;
    playSafe(index === 0 ? videoARef.current : videoBRef.current);
    setFront(index);
    setReady(true);
    setVideoError(false);
  };

  const renderVideo = (index: 0 | 1) => {
    const src = slotSrc[index];
    if (!src) return null;
    const isFront = front === index;
    return (
      <video
        ref={index === 0 ? videoARef : videoBRef}
        src={src}
        poster={currentPoster}
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          isFront && ready ? "opacity-100" : "opacity-0"
        } ${
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
        draggable={false}
        onCanPlay={() => {
          if (index !== frontRef.current) promote(index);
          else {
            playSafe(index === 0 ? videoARef.current : videoBRef.current);
            setReady(true);
          }
        }}
        onLoadedData={() => {
          if (index !== frontRef.current) promote(index);
        }}
        onError={() => {
          if (isFront) setVideoError(true);
        }}
      />
    );
  };

  return (
    <div
      className="relative flex h-full w-full select-none items-center justify-center overflow-hidden"
      style={{ backgroundColor: SCENE_BG }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${glowColor} 0%, transparent 65%)`,
        }}
      />

      {action === "eat" && (
        <div className="animate-bounce-slow pointer-events-none absolute top-6 left-1/2 z-10 -translate-x-1/2 text-3xl">🐟</div>
      )}
      {action === "play" && (
        <div className="animate-bounce-slow pointer-events-none absolute top-6 right-10 z-10 text-3xl">🧶</div>
      )}
      {action === "bathe" && (
        <div className="animate-float-slow pointer-events-none absolute top-8 left-1/3 z-10 text-2xl">🫧</div>
      )}
      {action === "sleep" && (
        <div className="animate-float-slow pointer-events-none absolute top-6 right-8 z-10 text-xl opacity-70">Zz</div>
      )}
      {displayMood === "happy" && action === "idle" && (
        <div className="animate-bounce-slow pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 text-2xl">✨</div>
      )}
      {displayMood === "sad" && action === "idle" && (
        <div className="animate-float-slow pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 text-xl opacity-50">
          💧
        </div>
      )}
      {mood === "surprised" && action === "idle" && (
        <div className="animate-ping-once pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2 text-2xl">❗</div>
      )}
      {mood === "thinking" && action === "idle" && (
        <div className="animate-float-slow pointer-events-none absolute -top-1 right-6 z-10 text-xl">💭</div>
      )}

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
            <img src={currentPoster} alt="Bella" className="absolute inset-0 h-full w-full object-cover" style={maskStyle} />
          ) : (
            <>
              {!ready && (
                <img src={currentPoster} alt="Bella" className="absolute inset-0 h-full w-full object-cover" style={maskStyle} />
              )}
              {renderVideo(0)}
              {renderVideo(1)}
            </>
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

      <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
        <span
          className={`rounded-full px-3 py-1 text-sm backdrop-blur-sm transition-all duration-300 ${
            displayMood === "happy"
              ? "bg-amber-100/60 text-amber-600"
              : displayMood === "sad"
                ? "bg-sky-100/60 text-sky-500"
                : mood === "surprised"
                  ? "bg-violet-100/60 text-violet-500"
                  : mood === "thinking"
                    ? "bg-indigo-100/60 text-indigo-500"
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
