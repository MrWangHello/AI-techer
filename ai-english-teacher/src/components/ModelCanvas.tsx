"use client";

import { useEffect, useRef, useCallback } from "react";

interface ModelCanvasProps {
  onReady?: () => void;
  onError?: (err: string) => void;
  onTap?: () => void;
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action?: "feed" | "play" | "study" | "none";
}

declare const PIXI: any;
declare const Live2D: any;

export default function ModelCanvas({
  onReady,
  onError,
  onTap,
}: ModelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const initedRef = useRef(false);

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
      // 清空容器（保留之前创建的 canvas 可能有问题，先清空）
      container.innerHTML = "";

      const app = new PIXI.Application({
        width: w,
        height: h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });

      // 确保 canvas 填满容器
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

          // 自适应缩放
          const scale = Math.min(w / model.width, h / model.height) * 0.85;
          model.scale.set(scale);
          model.x = w / 2;
          model.y = h - model.height * scale * 0.85;

          // 点击交互
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
            onTap?.();
          });

          app.stage.addChild(model);
          onReady?.();

          // 窗口自适应
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
          onError?.(err.message || "模型加载失败");
          initedRef.current = false;
        });
    } catch (e: any) {
      console.error("[Live2D] Init error:", e);
      onError?.(e.message || "Live2D 初始化失败");
      initedRef.current = false;
    }
  }, [onReady, onError, onTap]);

  useEffect(() => {
    // 确保依赖已加载，否则动态加载
    const ensureDeps = () => {
      // 检查是否所有依赖已就绪
      if (typeof PIXI !== "undefined" && PIXI.live2d) {
        // 已就绪，直接初始化
        setTimeout(doInit, 100);
        return;
      }

      // 需要加载的脚本
      const needed: string[] = [];
      if (typeof PIXI === "undefined") {
        needed.push(
          "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js"
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
          // 等待 React 渲染循环
          setTimeout(doInit, 200);
        }
      };

      needed.forEach((src) => {
        // 检查是否已有该 script 标签
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          // 脚本标签存在但可能未执行完，检查 PIXI
          if (typeof PIXI !== "undefined" && (window as any).PIXI?.live2d) {
            onLoad();
          } else {
            // 等待
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

    // 等待 Live2D Core 加载
    const waitForLive2D = () => {
      if (typeof Live2D !== "undefined") {
        ensureDeps();
      } else {
        const check = setInterval(() => {
          if (typeof Live2D !== "undefined") {
            clearInterval(check);
            ensureDeps();
          }
        }, 200);
        // 10 秒超时
        setTimeout(() => clearInterval(check), 10000);
      }
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
  }, [doInit]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px]"
      style={{ touchAction: "none" }}
    />
  );
}