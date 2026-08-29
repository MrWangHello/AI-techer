"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface ModelCanvasProps {
  onReady?: () => void;
  onError?: (err: string) => void;
  onTap?: () => void;
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action?: "feed" | "play" | "study" | "none";
}

declare const PIXI: any;
declare const Live2D: any;

// ========== Fallback SVG Pet ==========
const FALLBACK_SVG = (mood: string) => {
  const eyes = mood === "happy" ? "M 35 40 Q 40 35 45 40" : mood === "sad" ? "M 35 42 Q 40 45 45 42" : "M 35 40 Q 40 40 45 40";
  const mouth = mood === "happy" ? "M 35 50 Q 40 56 45 50" : mood === "sad" ? "M 35 50 Q 40 46 45 50" : "M 35 50 Q 40 52 45 50";
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {/* body */}
      <ellipse cx="40" cy="50" rx="25" ry="28" fill="#fbcfe8" />
      {/* ears */}
      <polygon points="18,25 12,10 28,22" fill="#f9a8d4" />
      <polygon points="62,25 68,10 52,22" fill="#f9a8d4" />
      {/* eyes */}
      <path d={eyes} stroke="#4a5568" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* mouth */}
      <path d={mouth} stroke="#e53e3e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* blush */}
      <ellipse cx="28" cy="48" rx="5" ry="3" fill="#fbb6ce" opacity="0.6" />
      <ellipse cx="52" cy="48" rx="5" ry="3" fill="#fbb6ce" opacity="0.6" />
      {/* nose */}
      <ellipse cx="40" cy="45" rx="2" ry="1.5" fill="#e53e3e" />
      {/* whiskers */}
      <line x1="20" y1="44" x2="32" y2="46" stroke="#cbd5e0" strokeWidth="0.8" />
      <line x1="20" y1="48" x2="32" y2="48" stroke="#cbd5e0" strokeWidth="0.8" />
      <line x1="60" y1="44" x2="48" y2="46" stroke="#cbd5e0" strokeWidth="0.8" />
      <line x1="60" y1="48" x2="48" y2="48" stroke="#cbd5e0" strokeWidth="0.8" />
      {/* tail */}
      <path d="M 62 60 Q 75 55 72 40" stroke="#f9a8d4" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
};

export default function ModelCanvas({
  onReady,
  onError,
  onTap,
  mood = "neutral",
}: ModelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const initedRef = useRef(false);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  // 使用 ref 存储回调，避免每次渲染都创建新的引用
  const callbacksRef = useRef({ onReady, onError, onTap });
  callbacksRef.current = { onReady, onError, onTap };

  const doInit = useCallback(() => {
    if (initedRef.current || !containerRef.current) return;
    const container = containerRef.current;
    initedRef.current = true;

    // 检查所有依赖
    if (typeof Live2D === "undefined" || typeof PIXI === "undefined" || !PIXI.live2d) {
      initedRef.current = false;
      setTimeout(doInit, 500);
      return;
    }

    const w = container.clientWidth || 320;
    const h = container.clientHeight || 400;

    try {
      container.innerHTML = "";

      const app = new PIXI.Application({
        width: w,
        height: h,
        transparent: true,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });

      const canvas = app.view as HTMLCanvasElement;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.objectFit = "contain";
      container.appendChild(canvas);
      container.style.position = "relative";
      container.style.overflow = "hidden";

      appRef.current = app;

      // 加载 Tororo 模型
      const modelUrl =
        "https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json";

      PIXI.live2d.Live2DModel.from(modelUrl, { autoInteract: false })
        .then((model: any) => {
          modelRef.current = model;

          const scale = Math.min(w / model.width, h / model.height) * 0.85;
          model.scale.set(scale);
          model.x = w / 2;
          model.y = h - model.height * scale * 0.85;

          model.eventMode = "static";
          model.cursor = "pointer";
          model.on("pointerdown", () => {
            try {
              const motions = model.internalModel.motionManager.definitions;
              if (motions && motions.length > 0) {
                const idx = Math.floor(Math.random() * motions.length);
                model.motion(idx);
              }
            } catch (_) {}
            callbacksRef.current.onTap?.();
          });

          app.stage.addChild(model);
          setLoading(false);
          callbacksRef.current.onReady?.();

          const onResize = () => {
            if (!container.isConnected) return;
            const nw = container.clientWidth;
            const nh = container.clientHeight;
            if (nw > 0 && nh > 0) {
              app.renderer.resize(nw, nh);
              const ns = Math.min(nw / model.width, nh / model.height) * 0.85;
              model.scale.set(ns);
              model.x = nw / 2;
              model.y = nh - model.height * ns * 0.85;
            }
          };
          window.addEventListener("resize", onResize);
        })
        .catch((err: any) => {
          console.error("[Live2D] Model load error:", err);
          setLoading(false);
          setFallback(true);
          callbacksRef.current.onError?.(err.message || "模型加载失败");
          initedRef.current = false;
        });
    } catch (e: any) {
      console.error("[Live2D] Init error:", e);
      setLoading(false);
      setFallback(true);
      callbacksRef.current.onError?.(e.message || "Live2D 初始化失败");
      initedRef.current = false;
    }
  }, []); // 空依赖 - 通过 ref 访问最新回调

  useEffect(() => {
    // 如果 Live2D Core 未加载，发出警告并使用 fallback
    const waitForLive2D = () => {
      if (typeof Live2D !== "undefined") {
        ensureDeps();
      } else {
        // 等待 live2d.min.js 加载（来自 layout.tsx）
        let retries = 0;
        const check = setInterval(() => {
          retries++;
          if (typeof Live2D !== "undefined") {
            clearInterval(check);
            ensureDeps();
          } else if (retries > 50) {
            // 5秒超时，使用 fallback
            clearInterval(check);
            console.warn("[Live2D] Core not loaded after 5s, using fallback");
            setLoading(false);
            setFallback(true);
            callbacksRef.current.onError?.("Live2D 核心库加载超时");
          }
        }, 100);
      }
    };

    const ensureDeps = () => {
      // 检查是否所有依赖已就绪
      if (typeof PIXI !== "undefined" && PIXI.live2d) {
        setTimeout(doInit, 100);
        return;
      }

      const needed: string[] = [];
      if (typeof PIXI === "undefined") {
        needed.push(
          "https://cdn.jsdelivr.net/npm/pixi.js@5.3.12/dist/pixi.min.js"
        );
      }
      if (typeof PIXI === "undefined" || !(window as any).PIXI?.live2d) {
        needed.push(
          "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.min.js"
        );
      }

      if (needed.length === 0) {
        setTimeout(doInit, 100);
        return;
      }

      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded >= needed.length) {
          setTimeout(doInit, 200);
        }
      };

      needed.forEach((src) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if (typeof PIXI !== "undefined" && (window as any).PIXI?.live2d) {
            onLoad();
          } else {
            const check = setInterval(() => {
              if (typeof PIXI !== "undefined" && (window as any).PIXI?.live2d) {
                clearInterval(check);
                onLoad();
              }
            }, 100);
          }
          return;
        }

        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = onLoad;
        s.onerror = () => {
          console.warn("[Live2D] Failed to load:", src);
          onLoad();
        };
        document.head.appendChild(s);
      });
    };

    waitForLive2D();

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true });
        } catch (_) {}
        appRef.current = null;
        modelRef.current = null;
        initedRef.current = false;
      }
    };
  }, [doInit, onError]);

  return (
    <div className="w-full h-full min-h-[300px] relative" style={{ touchAction: "none" }}>
      {/* Live2D 容器 */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* 加载动画 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <div className="absolute inset-0 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-pink-100 flex items-center justify-center text-lg">
                🐱
              </div>
            </div>
            <p className="text-sm text-gray-400 animate-pulse">Bella 正在加载中...</p>
          </div>
        </div>
      )}

      {/* Fallback SVG 宠物 */}
      {fallback && (
        <div
          className="absolute inset-0 flex items-center justify-center p-8 cursor-pointer hover:bg-pink-50/50 transition-colors"
          onClick={onTap}
        >
          <div className="w-full max-w-[200px] animate-bounce-slow">
            {FALLBACK_SVG(mood)}
          </div>
          <p className="absolute bottom-4 text-xs text-gray-400">😿 3D模型加载失败，使用可爱版</p>
        </div>
      )}
    </div>
  );
}