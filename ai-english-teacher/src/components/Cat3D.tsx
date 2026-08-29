"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Cat3DProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  onTap?: () => void;
  speaking?: boolean;
}

// 各表情对应的视频
const MOOD_VIDEOS: Record<string, string> = {
  neutral: "/videos/white-cat-3d.mp4",
  happy: "/videos/white-cat-happy-3d.mp4",
  sad: "/videos/white-cat-sleepy-3d.mp4",
  surprised: "/videos/white-cat-surprised-3d.mp4",
  thinking: "/videos/white-cat-thinking-3d.mp4",
};

// 心情对应的背景渐变
const MOOD_GRADIENTS: Record<string, string> = {
  neutral: "from-pink-100/20 via-pink-50/10 to-transparent",
  happy: "from-amber-100/20 via-yellow-50/10 to-transparent",
  sad: "from-sky-100/20 via-blue-50/10 to-transparent",
  surprised: "from-violet-100/20 via-purple-50/10 to-transparent",
  thinking: "from-indigo-100/20 via-indigo-50/10 to-transparent",
};

// 心情对应的辉光颜色
const MOOD_GLOWS: Record<string, string> = {
  neutral: "rgba(244, 114, 182, 0.15)",
  happy: "rgba(251, 191, 36, 0.2)",
  sad: "rgba(56, 189, 248, 0.15)",
  surprised: "rgba(167, 139, 250, 0.2)",
  thinking: "rgba(99, 102, 241, 0.15)",
};

export default function Cat3D({ mood = "neutral", onTap, speaking = false }: Cat3DProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bounce, setBounce] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const bounceTimeoutRef = useRef<number | null>(null);
  const prevMoodRef = useRef(mood);

  const currentVideo = MOOD_VIDEOS[mood] || MOOD_VIDEOS.neutral;
  const glowColor = MOOD_GLOWS[mood] || MOOD_GLOWS.neutral;
  const moodGradient = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.neutral;

  // 当 mood 变化时切换视频
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      setVideoLoaded(false);

      if (videoRef.current) {
        const video = videoRef.current;
        video.pause();
        video.src = currentVideo;
        video.load();
        video.play().catch(() => {});
      }
    }
  }, [mood, currentVideo]);

  // 视频加载完成后播放
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      video.play().catch(() => {});
    };

    const handleError = () => {
      setVideoError(true);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, []);

  // 点击弹跳
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
      {/* 底层背景 - 柔和渐变，与视频背景融合 */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${moodGradient} transition-all duration-700`}
      />

      {/* 外层辉光 - 让视频边缘柔和过渡 */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `
            radial-gradient(
              ellipse 55% 55% at 50% 50%,
              transparent 50%,
              ${glowColor} 80%,
              transparent 100%
            )
          `,
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
          {/* 视频元素 */}
          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-50/40 rounded-2xl">
              <span className="text-4xl">🐱</span>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={currentVideo}
                className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${
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
                  // 多层阴影叠加，让视频边缘融入背景
                  boxShadow: `
                    0 0 0 0 ${glowColor},
                    0 0 30px -5px ${glowColor},
                    inset 0 0 20px -5px rgba(0,0,0,0.03)
                  `,
                }}
                muted
                loop
                playsInline
                autoPlay
                draggable={false}
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
              />
              {/* 边缘羽化叠加层 - 让视频边缘透明过渡到背景 */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `
                    radial-gradient(
                      ellipse 70% 70% at 50% 50%,
                      transparent 55%,
                      rgba(253, 242, 248, 0.6) 85%,
                      rgba(253, 242, 248, 0.9) 100%
                    )
                  `,
                }}
              />
              {/* 心情颜色叠加层 */}
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none ${
                  mood === "happy"
                    ? "bg-gradient-to-t from-amber-200/15 via-transparent to-transparent"
                    : mood === "sad"
                    ? "bg-gradient-to-t from-sky-200/15 via-transparent to-transparent"
                    : mood === "surprised"
                    ? "bg-gradient-to-t from-violet-200/15 via-transparent to-transparent"
                    : mood === "thinking"
                    ? "bg-gradient-to-t from-indigo-200/15 via-transparent to-transparent"
                    : "bg-gradient-to-t from-pink-200/10 via-transparent to-transparent"
                }`}
              />
              {/* 加载中 */}
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-50/30 rounded-2xl backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
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

        {/* 点击提示 */}
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
          {mood === "happy" ? "开心 😊" : mood === "sad" ? "难过 😢" : mood === "surprised" ? "惊讶 😮" : mood === "thinking" ? "思考 🤔" : "平静 🐱"}
        </span>
      </div>
    </div>
  );
}