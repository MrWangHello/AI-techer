"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type PetAction = "idle" | "eat" | "play" | "bathe" | "sleep";

interface Cat3DProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  /** 乙：一动作一视频。失败或超时立刻走旧 mood 片 + 甲贴花 */
  action?: PetAction;
  onTap?: () => void;
  speaking?: boolean;
  onActionEnd?: () => void;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** 5 个 mood 各对应一个 MP4 循环视频 */
const MOOD_VIDEOS: Record<string, string> = {
  neutral: `${BASE}/videos/white-cat-3d.mp4`,
  happy: `${BASE}/videos/white-cat-happy-3d.mp4`,
  sad: `${BASE}/videos/white-cat-sleepy-3d.mp4`, // 困倦/睡觉表情
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

const ACTION_VIDEOS: Record<PetAction, string> = {
  idle: `${BASE}/videos/actions/idle.mp4`,
  eat: `${BASE}/videos/actions/eat.mp4`,
  play: `${BASE}/videos/actions/play.mp4`,
  bathe: `${BASE}/videos/actions/bathe.mp4`,
  sleep: `${BASE}/videos/actions/sleep.mp4`,
};

const ACTION_POSTERS: Record<PetAction, string> = {
  idle: `${BASE}/images/actions/idle.jpg`,
  eat: `${BASE}/images/actions/eat.jpg`,
  play: `${BASE}/images/actions/play.jpg`,
  bathe: `${BASE}/images/actions/bathe.jpg`,
  sleep: `${BASE}/images/actions/sleep.jpg`,
};

const ACTION_TO_MOOD: Record<PetAction, "happy" | "sad" | "neutral"> = {
  idle: "neutral",
  eat: "happy",
  play: "happy",
  bathe: "happy",
  sleep: "sad",
};

const ACTION_LOAD_MS = 2000;

const MOOD_GLOWS: Record<string, string> = {
  neutral: "rgba(244, 114, 182, 0.08)",
  happy: "rgba(251, 191, 36, 0.1)",
  sad: "rgba(56, 189, 248, 0.08)",
  surprised: "rgba(167, 139, 250, 0.1)",
  thinking: "rgba(99, 102, 241, 0.08)",
};

/** 卡片同色：浅粉白。不再用旧片米色，避免「一块片子贴在卡片上」 */
const SCENE_BG = "transparent";

/** 只留猫身，裁掉视频里的窗台/墙，边缘溶进卡片 */
const VIDEO_MASK =
  "radial-gradient(ellipse 48% 56% at 50% 54%, black 36%, transparent 72%)";

/** 移动端避免 blob 缓存多路视频导致 Tab 崩溃，桌面端可缓存当前路 */
const videoCache = new Map<string, string>();
const MAX_VIDEO_CACHE = 2;

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

async function prefetchVideo(url: string, allowBlob = true): Promise<string | null> {
  if (videoCache.has(url)) return videoCache.get(url)!;
  if (!allowBlob) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (videoCache.size >= MAX_VIDEO_CACHE) {
      const oldest = videoCache.keys().next().value;
      if (oldest) {
        URL.revokeObjectURL(videoCache.get(oldest)!);
        videoCache.delete(oldest);
      }
    }
    videoCache.set(url, blobUrl);
    return blobUrl;
  } catch {
    return url;
  }
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
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [useFakeFx, setUseFakeFx] = useState(false);
  /** 记录 resolvedSrc 对应的原始 URL，避免 mood 切换竞态 */
  const [activeSrc, setActiveSrc] = useState<{ url: string; src: string } | null>(null);
  const bounceTimeoutRef = useRef<number | null>(null);
  const loadedMoodsRef = useRef<Set<string>>(new Set());
  const actionEndTimer = useRef<number | null>(null);

  const fallbackMood = ACTION_TO_MOOD[action] || mood;
  const displayMood = action !== "idle" ? fallbackMood : mood;
  const preferActionClip = action !== "idle" ? !useFakeFx : mood === "neutral";
  const currentVideo = preferActionClip
    ? ACTION_VIDEOS[action]
    : MOOD_VIDEOS[action !== "idle" ? fallbackMood : mood] || MOOD_VIDEOS.neutral;
  const currentPoster = preferActionClip
    ? ACTION_POSTERS[action]
    : MOOD_POSTERS[action !== "idle" ? fallbackMood : mood] || MOOD_POSTERS.neutral;
  const glowColor = MOOD_GLOWS[displayMood] || MOOD_GLOWS.neutral;
  const srcReady = activeSrc?.url === currentVideo;
  const isOneShot = action !== "idle" && !useFakeFx;

  useEffect(() => {
    setUseFakeFx(false);
    setVideoError(false);
    setVideoLoaded(false);
  }, [action]);

  useEffect(() => {
    if (action === "idle" || useFakeFx) return;
    const timer = window.setTimeout(() => {
      if (!videoLoaded) setUseFakeFx(true);
    }, ACTION_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [action, useFakeFx, videoLoaded]);

  useEffect(() => {
    if (action === "idle") return;
    if (actionEndTimer.current) window.clearTimeout(actionEndTimer.current);
    actionEndTimer.current = window.setTimeout(() => onActionEnd?.(), useFakeFx ? 2200 : 3200);
    return () => {
      if (actionEndTimer.current) window.clearTimeout(actionEndTimer.current);
    };
  }, [action, useFakeFx, onActionEnd]);

  // mood / action 变化 → 加载对应视频
  useEffect(() => {
    let cancelled = false;
    setVideoError(false);

    const load = async () => {
      const mobile = isMobileDevice();
      const cached = await prefetchVideo(currentVideo, !mobile);
      if (cancelled) return;
      setActiveSrc({ url: currentVideo, src: cached || currentVideo });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentVideo]);

  // activeSrc 就绪后绑定到 video 元素
  useEffect(() => {
    if (!srcReady || !activeSrc) return;

    const video = videoRef.current;
    if (!video) return;

    const alreadyLoaded = loadedMoodsRef.current.has(currentVideo);
    if (!alreadyLoaded) setVideoLoaded(false);

    const handleCanPlay = () => {
      setVideoLoaded(true);
      loadedMoodsRef.current.add(mood);
      video.play().catch(() => {});
    };

    const handleError = () => setVideoError(true);

    video.src = activeSrc.src;
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.load();
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [activeSrc, srcReady, mood]);

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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-transparent">
      {/* mood 色调光晕（极淡，不盖视频背景） */}
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${glowColor} 0%, transparent 65%)`,
        }}
      />

      {/* 甲兜底贴花：仅在动作片失败/超时时出现 */}
      {useFakeFx && action === "eat" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce-slow pointer-events-none z-10">
          🐟
        </div>
      )}
      {useFakeFx && action === "play" && (
        <div className="absolute top-6 right-10 text-3xl animate-bounce-slow pointer-events-none z-10">
          🧶
        </div>
      )}
      {useFakeFx && action === "bathe" && (
        <div className="absolute top-8 left-1/3 text-2xl animate-float-slow pointer-events-none z-10">
          🫧
        </div>
      )}
      {useFakeFx && action === "sleep" && (
        <div className="absolute top-6 right-8 text-xl animate-float-slow pointer-events-none z-10 opacity-70">
          Zz
        </div>
      )}

      {/* 心情特效（旧片路径保留） */}
      {displayMood === "happy" && !useFakeFx && action === "idle" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce-slow pointer-events-none z-10">
          ✨
        </div>
      )}
      {mood === "sad" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xl animate-float-slow pointer-events-none opacity-50 z-10">
          💧
        </div>
      )}
      {mood === "surprised" && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl animate-ping-once pointer-events-none z-10">
          ❗
        </div>
      )}
      {mood === "thinking" && (
        <div className="absolute -top-1 right-6 text-xl animate-float-slow pointer-events-none z-10">
          💭
        </div>
      )}

      <div
        className="relative cursor-pointer z-10"
        style={{
          transform: `translateY(${bounce ? -20 : 0}px) scale(${bounce ? 1.08 : 1})`,
          transition: bounce
            ? "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "transform 0.3s ease-out",
        }}
        onClick={handleTap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap();
        }}
      >
        <div
          aria-hidden
          className="absolute left-1/2 bottom-10 -translate-x-1/2 w-44 h-10 md:w-52 md:h-12 rounded-full bg-pink-100/70 blur-md pointer-events-none"
        />
        <div
          className="relative w-60 h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"
          style={{
            backgroundColor: SCENE_BG,
            filter: "drop-shadow(0 16px 22px rgba(236, 72, 153, 0.12))",
          }}
        >
          {videoError ? (
            <img
              src={currentPoster}
              alt="Bella"
              className="absolute inset-0 w-full h-full object-cover scale-[1.12]"
              style={maskStyle}
            />
          ) : (
            <>
              {/* poster / 切换中占位：src 未就绪或视频未加载时显示 */}
              {(!srcReady || !videoLoaded) && (
                <img
                  src={currentPoster}
                  alt="Bella"
                  className="absolute inset-0 w-full h-full object-cover scale-[1.12]"
                  style={maskStyle}
                />
              )}

              {srcReady && activeSrc && (
                <video
                  key={currentVideo}
                  ref={videoRef}
                  poster={currentPoster}
                  preload={action === "idle" ? "auto" : "metadata"}
                  className={`absolute inset-0 w-full h-full object-cover scale-[1.12] transition-opacity duration-300 ${
                    videoLoaded ? "opacity-100" : "opacity-0"
                  } ${
                    displayMood === "happy"
                      ? "brightness-105 saturate-105"
                      : displayMood === "sad"
                      ? "brightness-95 saturate-90"
                      : ""
                  }`}
                  style={maskStyle}
                  muted
                  loop={!isOneShot}
                  playsInline
                  autoPlay
                  draggable={false}
                  onLoadedData={() => {
                    setVideoLoaded(true);
                    loadedMoodsRef.current.add(currentVideo);
                  }}
                  onEnded={() => {
                    if (isOneShot) onActionEnd?.();
                  }}
                  onError={() => {
                    if (action !== "idle" && !useFakeFx) setUseFakeFx(true);
                    else setVideoError(true);
                  }}
                />
              )}

              {!videoLoaded && srcReady && !loadedMoodsRef.current.has(currentVideo) && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                  <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

          {speaking && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6 z-20">
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-1" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-2" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-3" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-2" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-1" />
            </div>
          )}
        </div>

        <div className="text-center mt-1">
          <span className="text-sm text-gray-500">点击我互动</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
        <span
          className={`text-sm px-3 py-1 rounded-full transition-all duration-300 backdrop-blur-sm ${
            displayMood === "happy"
              ? "bg-amber-100/60 text-amber-600"
              : mood === "sad"
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
