"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Cat3DProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  onTap?: () => void;
  speaking?: boolean;
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

const MOOD_GLOWS: Record<string, string> = {
  neutral: "rgba(244, 114, 182, 0.08)",
  happy: "rgba(251, 191, 36, 0.1)",
  sad: "rgba(56, 189, 248, 0.08)",
  surprised: "rgba(167, 139, 250, 0.1)",
  thinking: "rgba(99, 102, 241, 0.08)",
};

/** 与 MP4 源视频背景色一致，消除「视频框」感 */
const SCENE_BG = "#f0ebe4";

/** 椭圆 mask：中心保留猫，边缘完全透明 */
const VIDEO_MASK =
  "radial-gradient(ellipse 58% 58% at 50% 46%, black 48%, transparent 92%)";

const videoCache = new Map<string, string>();

async function prefetchVideo(url: string): Promise<string | null> {
  if (videoCache.has(url)) return videoCache.get(url)!;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    videoCache.set(url, blobUrl);
    return blobUrl;
  } catch {
    return null;
  }
}

export default function Cat3D({ mood = "neutral", onTap, speaking = false }: Cat3DProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bounce, setBounce] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  /** 记录 resolvedSrc 对应的原始 URL，避免 mood 切换竞态 */
  const [activeSrc, setActiveSrc] = useState<{ url: string; src: string } | null>(null);
  const bounceTimeoutRef = useRef<number | null>(null);
  const loadedMoodsRef = useRef<Set<string>>(new Set());

  const currentVideo = MOOD_VIDEOS[mood] || MOOD_VIDEOS.neutral;
  const currentPoster = MOOD_POSTERS[mood] || MOOD_POSTERS.neutral;
  const glowColor = MOOD_GLOWS[mood] || MOOD_GLOWS.neutral;
  const srcReady = activeSrc?.url === currentVideo;

  // mood 变化 → 加载对应视频
  useEffect(() => {
    let cancelled = false;
    setVideoError(false);

    const load = async () => {
      const cached = await prefetchVideo(currentVideo);
      if (cancelled) return;
      setActiveSrc({ url: currentVideo, src: cached || currentVideo });

      // 后台预加载其余 mood
      Object.values(MOOD_VIDEOS).forEach((url) => {
        if (url !== currentVideo) prefetchVideo(url);
      });
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

    const alreadyLoaded = loadedMoodsRef.current.has(mood);
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
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: SCENE_BG }}
    >
      {/* mood 色调光晕（极淡，不盖视频背景） */}
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${glowColor} 0%, transparent 65%)`,
        }}
      />

      {/* 心情特效 */}
      {mood === "happy" && (
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
          className="relative w-52 h-52 md:w-60 md:h-60 lg:w-64 lg:h-64"
          style={{ backgroundColor: SCENE_BG }}
        >
          {videoError ? (
            <img
              src={currentPoster}
              alt="Bella"
              className="absolute inset-0 w-full h-full object-cover"
              style={maskStyle}
            />
          ) : (
            <>
              {/* poster / 切换中占位：src 未就绪或视频未加载时显示 */}
              {(!srcReady || !videoLoaded) && (
                <img
                  src={currentPoster}
                  alt="Bella"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={maskStyle}
                />
              )}

              {srcReady && activeSrc && (
                <video
                  key={mood}
                  ref={videoRef}
                  poster={currentPoster}
                  preload="auto"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    videoLoaded ? "opacity-100" : "opacity-0"
                  } ${
                    mood === "happy"
                      ? "brightness-105 saturate-105"
                      : mood === "sad"
                      ? "brightness-95 saturate-90"
                      : ""
                  }`}
                  style={maskStyle}
                  muted
                  loop
                  playsInline
                  autoPlay
                  draggable={false}
                  onLoadedData={() => {
                    setVideoLoaded(true);
                    loadedMoodsRef.current.add(mood);
                  }}
                  onError={() => setVideoError(true)}
                />
              )}

              {!videoLoaded && srcReady && !loadedMoodsRef.current.has(mood) && (
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
          <span className="text-[10px] text-gray-400">点击我互动</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 backdrop-blur-sm ${
            mood === "happy"
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
          {mood === "happy"
            ? "开心 😊"
            : mood === "sad"
            ? "困困 😴"
            : mood === "surprised"
            ? "惊讶 😮"
            : mood === "thinking"
            ? "思考 🤔"
            : "平静 🐱"}
        </span>
      </div>
    </div>
  );
}
