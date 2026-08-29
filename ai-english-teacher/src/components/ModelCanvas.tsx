"use client";

import { useEffect, useRef, useCallback } from "react";

interface ModelCanvasProps {
  onReady?: () => void;
  onError?: (err: string) => void;
  onTap?: () => void;
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action?: "feed" | "play" | "study" | "none";
}

// 确保 PIXI 全局可用
declare const PIXI: any;

export default function ModelCanvas({
  onReady,
  onError,
  onTap,
  mood = "neutral",
  action = "none",
}: ModelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const initedRef = useRef(false);

  const initLive2D = useCallback(async () => {
    if (initedRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 400;

    // 检查 live2d.min.js 是否已加载
    if (typeof Live2D === "undefined") {
      // 等待加载
      const check = () => {
        if (typeof Live2D !== "undefined" && typeof PIXI !== "undefined") {
          doInit();
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    } else {
      doInit();
    }

    function doInit() {
      if (initedRef.current) return;
      initedRef.current = true;

      try {
        // 清空容器
        container.innerHTML = "";

        const app = new PIXI.Application({
          width: w,
          height: h,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
        });

        app.view.style.width = "100%";
        app.view.style.height = "100%";
        app.view.style.position = "absolute";
        app.view.style.top = "0";
        app.view.style.left = "0";
        app.view.style.objectFit = "contain";
        container.appendChild(app.view);
        container.style.position = "relative";
        container.style.overflow = "hidden";

        appRef.current = app;

        // 加载 Tororo 模型（Cubism 2.1）
        const modelUrl =
          "https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json";

        PIXI.live2d.Live2DModel.from(modelUrl, { autoInteract: false })
          .then((model: any) => {
            modelRef.current = model;

            // 自适应缩放居中
            const scale = Math.min(w / model.width, h / model.height) * 0.85;
            model.scale.set(scale);
            model.x = w / 2;
            model.y = h - model.height * scale * 0.85;

            // 启用点击交互
            model.eventMode = "static";
            model.cursor = "pointer";
            model.on("pointerdown", () => {
              // 随机播放动作
              const motions = model.internalModel.motionManager.definitions;
              if (motions && motions.length > 0) {
                const idx = Math.floor(Math.random() * motions.length);
                model.motion(idx);
              }
              onTap?.();
            });

            app.stage.addChild(model);
            onReady?.();

            // 窗口自适应
            const resize = () => {
              if (!container) return;
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
            window.addEventListener("resize", resize);
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
    }
  }, [onReady, onError, onTap]);

  useEffect(() => {
    // 加载 PixiJS + pixi-live2d-display
    const loadDeps = () => {
      const scripts = [
        "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",
        "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.min.js",
      ];

      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded >= scripts.length) {
          // 延迟确保 Live2D 绑定
          setTimeout(initLive2D, 100);
        }
      };

      scripts.forEach((src) => {
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

    // 等待 live2d.min.js 先加载
    const waitForLive2D = () => {
      if (typeof Live2D !== "undefined") {
        loadDeps();
      } else {
        const check = () => {
          if (typeof Live2D !== "undefined") {
            loadDeps();
          } else {
            setTimeout(check, 200);
          }
        };
        // 如果 live2d.min.js 是 async 加载的，等它
        if (document.querySelector('script[src="/live2d.min.js"]')) {
          setTimeout(check, 200);
        } else {
          loadDeps();
        }
      }
    };

    waitForLive2D();

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch (e) {}
        appRef.current = null;
        modelRef.current = null;
        initedRef.current = false;
      }
    };
  }, [initLive2D]);

  // 表情/动作驱动（后续可扩展）
  useEffect(() => {
    if (!modelRef.current) return;
    // 这里可以设置表情参数
    // Tororo Cubism 2.1 支持 ParamMouthOpenY 等参数
  }, [mood, action]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px]"
      style={{ touchAction: "none" }}
    />
  );
}