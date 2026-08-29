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

export default function Cat3D({ mood = "neutral", onTap, speaking = false }: Cat3DProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bounce, setBounce] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const bounceTimeoutRef = useRef<number | null>(null);
  const prevMoodRef = useRef(mood);
  const transitionTimeoutRef = useRef<number | null>(null);
  const [showTransition, setShowTransition] = useState(false);

  const currentVideo = MOOD_VIDEOS[mood] || MOOD_VIDEOS.neutral;

  // 当 mood 变化时切换视频
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      setShowTransition(true);
      setVideoLoaded(false);

      // 切换视频源
      if (videoRef.current) {
        const video = videoRef.current;
        video.pause();
        video.src = currentVideo;
        video.load();
        video.play().catch(() => {
          // 自动播放被阻止，等待用户交互
        });
      }

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      transitionTimeoutRef.current = window.setTimeout(() => setShowTransition(false), 400);
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

    // 尝试自动播放
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
      {/* 背景装饰 - 柔光 */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          mood === "happy"
            ? "bg-gradient-to-b from-yellow-100/30 via-transparent to-transparent"
            : mood === "sad"
            ? "bg-gradient-to-b from-blue-100/20 via-transparent to-transparent"
            : mood === "surprised"
            ? "bg-gradient-to-b from-purple-100/30 via-transparent to-transparent"
            : mood === "thinking"
            ? "bg-gradient-to-b from-indigo-100/20 via-transparent to-transparent"
            : "bg-gradient-to-b from-pink-50/20 via-transparent to-transparent"
        }`}
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
            <div className="absolute inset-0 flex items-center justify-center bg-pink-50 rounded-2xl">
              <span className="text-4xl">🐱</span>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={currentVideo}
                className={`w-full h-full object-cover rounded-2xl shadow-lg transition-all duration-500 ${
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
                muted
                loop
                playsInline
                autoPlay
                draggable={false}
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
              />
              {/* 加载中 */}
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-50/50 rounded-2xl">
                  <div className="w-8 h-8 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

          {/* 心情颜色叠加 */}
          <div
            className={`absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none ${
              mood === "happy"
                ? "bg-gradient-to-t from-yellow-200/10 via-transparent to-transparent"
                : mood === "sad"
                ? "bg-gradient-to-t from-blue-200/10 via-transparent to-transparent"
                : mood === "surprised"
                ? "bg-gradient-to-t from-purple-200/10 via-transparent to-transparent"
                : mood === "thinking"
                ? "bg-gradient-to-t from-indigo-200/10 via-transparent to-transparent"
                : "bg-gradient-to-t from-pink-200/5 via-transparent to-transparent"
            }`}
          />

          {/* 说话时语音波纹 */}
          {speaking && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6">
              <div className="w-1.5 bg-pink-400 rounded-full animate-sound-wave-1" />
              <div className="w-1.5 bg-pink-400 rounded-full animate-sound-wave-2" />
              <div className="w-1.5 bg-pink-400 rounded-full animate-sound-wave-3" />
              <div className="w-1.5 bg-pink-400 rounded-full animate-sound-wave-2" />
              <div className="w-1.5 bg-pink-400 rounded-full animate-sound-wave-1" />
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
          className={`text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 ${
            mood === "happy"
              ? "bg-yellow-100 text-yellow-600"
              : mood === "sad"
              ? "bg-blue-100 text-blue-500"
              : mood === "surprised"
              ? "bg-purple-100 text-purple-500"
              : mood === "thinking"
              ? "bg-indigo-100 text-indigo-500"
              : "bg-pink-50 text-pink-400"
          }`}
        >
          {mood === "happy" ? "开心 😊" : mood === "sad" ? "难过 😢" : mood === "surprised" ? "惊讶 😮" : mood === "thinking" ? "思考 🤔" : "平静 🐱"}
        </span>
      </div>
    </div>
  );
}