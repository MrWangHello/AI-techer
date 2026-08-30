"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Cat3DProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  onTap?: () => void;
  speaking?: boolean;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

const MOOD_GRADIENTS: Record<string, string> = {
  neutral: "from-pink-100/30 via-pink-50/15 to-transparent",
  happy: "from-amber-100/30 via-yellow-50/15 to-transparent",
  sad: "from-sky-100/30 via-blue-50/15 to-transparent",
  surprised: "from-violet-100/30 via-purple-50/15 to-transparent",
  thinking: "from-indigo-100/30 via-indigo-50/15 to-transparent",
};

const MOOD_GLOWS: Record<string, string> = {
  neutral: "rgba(244, 114, 182, 0.12)",
  happy: "rgba(251, 191, 36, 0.15)",
  sad: "rgba(56, 189, 248, 0.12)",
  surprised: "rgba(167, 139, 250, 0.15)",
  thinking: "rgba(99, 102, 241, 0.12)",
};

const VIDEO_MASK =
  "radial-gradient(ellipse 68% 68% at 50% 44%, black 52%, transparent 100%)";

// 全局视频 blob 缓存，跨 mood 切换复用
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
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const bounceTimeoutRef = useRef<number | null>(null);
  const prevMoodRef = useRef(mood);
  const loadedMoodsRef = useRef<Set<string>>(new Set());

  const currentVideo = MOOD_VIDEOS[mood] || MOOD_VIDEOS.neutral;
  const currentPoster = MOOD_POSTERS[mood] || MOOD_POSTERS.neutral;
  const glowColor = MOOD_GLOWS[mood] || MOOD_GLOWS.neutral;
  const moodGradient = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.neutral;

  // 预加载当前 mood 视频，并后台 prefetch 其余 mood
  useEffect(() => {
    let cancelled = false;

    const loadCurrent = async () => {
      const cached = await prefetchVideo(currentVideo);
      if (cancelled) return;
      setResolvedSrc(cached || currentVideo);
    };

    loadCurrent();

    // 后台预加载其他 mood 视频
    Object.values(MOOD_VIDEOS).forEach((url) => {
      if (url !== currentVideo) prefetchVideo(url);
    });

    return () => {
      cancelled = true;
    };
  }, [currentVideo]);

  // mood 切换时更新视频源
  useEffect(() => {
    if (prevMoodRef.current === mood) return;
    prevMoodRef.current = mood;

    const alreadyLoaded = loadedMoodsRef.current.has(mood);
    if (!alreadyLoaded) {
      setVideoLoaded(false);
    }

    const video = videoRef.current;
    if (!video || !resolvedSrc) return;

    video.pause();
    video.src = resolvedSrc;
    video.load();
    video.play().catch(() => {});
  }, [mood, resolvedSrc]);

  // 视频就绪后播放
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      loadedMoodsRef.current.add(mood);
      video.play().catch(() => {});
    };

    const handleError = () => {
      setVideoError(true);
    };

    video.src = resolvedSrc;
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.load();
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [resolvedSrc, mood]);

  const handleTap = useCallback(() => {
    setBounce(true);
    if (bounceTimeoutRef.current) {
      clearTimeout(bounceTimeoutRef.current);
      bounceTimeoutRef.current = null;
    }
    bounceTimeoutRef.current = window.setTimeout(() => setBounce(false), 500);
    onTap?.();
  }, [onTap]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      {/* 全幅 mood 场景背景 */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${moodGradient} transition-all duration-700`}
      />

      {/* 外层 radial 光晕 */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* 心情特效 */}
      {mood === "happy" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce-slow pointer-events-none">
          ✨
        </div>
      )}
      {mood === "sad" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xl animate-float-slow pointer-events-none opacity-50">
          💧
        </div>
      )}
      {mood === "surprised" && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl animate-ping-once pointer-events-none">
          ❗
        </div>
      )}
      {mood === "thinking" && (
        <div className="absolute -top-1 right-6 text-xl animate-float-slow pointer-events-none">
          💭
        </div>
      )}

      {/* 视频容器 */}
      <div
        className="relative cursor-pointer"
        style={{
          transform: `
            translateY(${bounce ? -20 : 0}px)
            scale(${bounce ? 1.08 : 1})
          `,
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
        <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64">
          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={currentPoster}
                alt="Bella"
                className="w-full h-full object-cover"
                style={{
                  WebkitMaskImage: VIDEO_MASK,
                  maskImage: VIDEO_MASK,
                }}
              />
            </div>
          ) : (
            <>
              {/* poster 作为即时占位 */}
              {!videoLoaded && (
                <img
                  src={currentPoster}
                  alt="Bella"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  style={{
                    WebkitMaskImage: VIDEO_MASK,
                    maskImage: VIDEO_MASK,
                  }}
                />
              )}

              <video
                ref={videoRef}
                poster={currentPoster}
                preload="auto"
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  videoLoaded ? "opacity-100" : "opacity-0"
                } ${
                  mood === "happy"
                    ? "brightness-110 saturate-110"
                    : mood === "sad"
                    ? "brightness-90 saturate-75"
                    : mood === "surprised"
                    ? "brightness-105 contrast-105"
                    : ""
                }`}
                style={{
                  WebkitMaskImage: VIDEO_MASK,
                  maskImage: VIDEO_MASK,
                }}
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

              {/* 轻微 mood 色调 overlay */}
              <div
                className={`absolute inset-0 transition-all duration-500 pointer-events-none ${
                  mood === "happy"
                    ? "bg-gradient-to-t from-amber-200/10 via-transparent to-transparent"
                    : mood === "sad"
                    ? "bg-gradient-to-t from-sky-200/10 via-transparent to-transparent"
                    : mood === "surprised"
                    ? "bg-gradient-to-t from-violet-200/10 via-transparent to-transparent"
                    : mood === "thinking"
                    ? "bg-gradient-to-t from-indigo-200/10 via-transparent to-transparent"
                    : "bg-gradient-to-t from-pink-200/8 via-transparent to-transparent"
                }`}
                style={{
                  WebkitMaskImage: VIDEO_MASK,
                  maskImage: VIDEO_MASK,
                }}
              />

              {/* 仅在首次加载时显示 spinner */}
              {!videoLoaded && !loadedMoodsRef.current.has(mood) && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

          {/* 说话时语音波纹 */}
          {speaking && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6">
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-1" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-2" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-3" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-2" />
              <div className="w-1.5 bg-pink-400/80 rounded-full animate-sound-wave-1" />
            </div>
          )}
        </div>

        <div className="text-center mt-1">
          <span className="text-[10px] text-gray-300">点击我互动</span>
        </div>
      </div>

      {/* 心情标签 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
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
            ? "难过 😢"
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
