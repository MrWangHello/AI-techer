"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface RealisticCatProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  onTap?: () => void;
  speaking?: boolean;
}

// 各表情对应的图片
const MOOD_IMAGES: Record<string, string> = {
  neutral: "/images/white-cat.jpg",
  happy: "/images/white-cat-happy.jpg",
  sad: "/images/white-cat-sleepy.jpg",
  surprised: "/images/white-cat-surprised.jpg",
  thinking: "/images/white-cat-curious.jpg",
};

export default function RealisticCat({ mood = "neutral", onTap, speaking = false }: RealisticCatProps) {
  const [bounce, setBounce] = useState(false);
  const [blink, setBlink] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [walkPhase, setWalkPhase] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const bounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headTiltIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 周期性眨眼
  useEffect(() => {
    const id = window.setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => window.clearInterval(id);
  }, []);

  // 呼吸/行走动画 - 猫身轻微左右摆动
  useEffect(() => {
    const id = window.setInterval(() => {
      setWalkPhase((p) => (p + 1) % 100);
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  // 思考时歪头
  useEffect(() => {
    if (mood === "thinking") {
      const id = window.setInterval(() => {
        setHeadTilt((prev) => {
          if (prev <= -5) return 5;
          return prev - 5;
        });
      }, 2000);
      return () => {
        window.clearInterval(id);
        setHeadTilt(0);
      };
    } else if (mood === "surprised") {
      setHeadTilt(0);
    } else if (mood === "happy") {
      // 开心的轻微摇头
      const id = window.setInterval(() => {
        setHeadTilt((prev) => {
          if (prev <= -3) return 3;
          return prev - 3;
        });
      }, 1500);
      return () => {
        window.clearInterval(id);
        setHeadTilt(0);
      };
    } else if (mood === "sad") {
      // 伤心时低头
      setHeadTilt(8);
    } else {
      // neutral
      setHeadTilt(0);
    }
  }, [mood]);

  // 点击弹跳
  const handleTap = useCallback(() => {
    setBounce(true);
    if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current);
    bounceTimeoutRef.current = setTimeout(() => setBounce(false), 600);
    onTap?.();
  }, [onTap]);

  // 呼吸动画值
  const breatheScale = 1 + Math.sin(walkPhase * 0.2) * 0.008;
  const swayX = Math.sin(walkPhase * 0.1) * 3;

  // 图片路径
  const imgSrc = MOOD_IMAGES[mood] || MOOD_IMAGES.neutral;

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

      {/* 猫图片容器 */}
      <div
        className="relative cursor-pointer"
        style={{
          transform: `
            translateX(${swayX}px)
            translateY(${bounce ? -20 : 0}px)
            scale(${bounce ? 1.05 : breatheScale})
            rotate(${headTilt}deg)
          `,
          transition: bounce
            ? "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "transform 0.3s ease-out",
        }}
        onClick={handleTap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap();
        }}
      >
        {/* 猫图 */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
            </div>
          )}
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-50 rounded-2xl">
              <span className="text-4xl">🐱</span>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={`Bella - ${mood}`}
              className={`w-full h-full object-cover rounded-2xl shadow-lg transition-all duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              } ${
                mood === "happy"
                  ? "brightness-110 saturate-110"
                  : mood === "sad"
                  ? "brightness-90 saturate-75"
                  : mood === "surprised"
                  ? "brightness-105 contrast-105"
                  : ""
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              draggable={false}
            />
          )}

          {/* 眨眼遮罩 */}
          {blink && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* 眼线遮罩 - 在猫眼位置 */}
              <div className="absolute top-[38%] left-[30%] w-[18%] h-[2px] bg-gray-800 rounded-full" />
              <div className="absolute top-[38%] right-[28%] w-[18%] h-[2px] bg-gray-800 rounded-full" />
            </div>
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