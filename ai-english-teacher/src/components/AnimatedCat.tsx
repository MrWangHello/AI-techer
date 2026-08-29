"use client";

import { useEffect, useRef, useCallback } from "react";

interface AnimatedCatProps {
  mood?: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  onTap?: () => void;
}

export default function AnimatedCat({ mood = "neutral", onTap }: AnimatedCatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const blinkRef = useRef(0);
  const tapAnimRef = useRef({ active: false, time: 0 });
  const tailWagRef = useRef(0);

  const drawCat = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const baseY = h * 0.62;

    // 呼吸动画 - 上下浮动
    const breathe = Math.sin(t * 0.002) * 3;
    const bodyY = baseY + breathe;

    // 尾巴摆动
    const tailWag = Math.sin(t * 0.005) * 0.3;
    tailWagRef.current = tailWag;

    // 眨眼
    const blink = blinkRef.current > 0 && blinkRef.current < 5;

    // 点击弹跳
    const bounce = tapAnimRef.current.active
      ? Math.sin((t - tapAnimRef.current.time) * 0.02) * Math.exp(-(t - tapAnimRef.current.time) * 0.003) * 20
      : 0;

    const finalY = bodyY - Math.abs(bounce);

    // ---- 身体 ----
    ctx.save();
    // 身体椭圆
    ctx.beginPath();
    ctx.ellipse(cx, finalY + 5, 60, 55, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fbcfe8";
    ctx.fill();
    ctx.strokeStyle = "#f9a8d4";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 肚子（浅色）
    ctx.beginPath();
    ctx.ellipse(cx, finalY + 12, 32, 35, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fce7f3";
    ctx.fill();

    // ---- 耳朵 ----
    // 左耳
    ctx.beginPath();
    ctx.moveTo(cx - 40, finalY - 35);
    ctx.lineTo(cx - 55, finalY - 70);
    ctx.lineTo(cx - 20, finalY - 40);
    ctx.closePath();
    ctx.fillStyle = "#f9a8d4";
    ctx.fill();
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 左耳内
    ctx.beginPath();
    ctx.moveTo(cx - 38, finalY - 38);
    ctx.lineTo(cx - 48, finalY - 62);
    ctx.lineTo(cx - 25, finalY - 42);
    ctx.closePath();
    ctx.fillStyle = "#fce7f3";
    ctx.fill();

    // 右耳
    ctx.beginPath();
    ctx.moveTo(cx + 40, finalY - 35);
    ctx.lineTo(cx + 55, finalY - 70);
    ctx.lineTo(cx + 20, finalY - 40);
    ctx.closePath();
    ctx.fillStyle = "#f9a8d4";
    ctx.fill();
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 右耳内
    ctx.beginPath();
    ctx.moveTo(cx + 38, finalY - 38);
    ctx.lineTo(cx + 48, finalY - 62);
    ctx.lineTo(cx + 25, finalY - 42);
    ctx.closePath();
    ctx.fillStyle = "#fce7f3";
    ctx.fill();

    // ---- 尾巴 ----
    ctx.beginPath();
    const tailStartX = cx + 58;
    const tailStartY = finalY;
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      tailStartX + 30 + Math.sin(tailWag) * 15,
      tailStartY - 30 + Math.cos(tailWag) * 10,
      tailStartX + 20 + Math.sin(tailWag * 0.7) * 10,
      tailStartY - 60 + Math.cos(tailWag * 0.5) * 8
    );
    ctx.strokeStyle = "#f9a8d4";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // ---- 眼睛 ----
    // 根据 mood 调整眼睛形状
    const eyeY = finalY - 10;
    const eyeSpacing = 18;

    if (mood === "happy") {
      // 笑眼（弯弯的）
      drawHappyEye(ctx, cx - eyeSpacing, eyeY, blink);
      drawHappyEye(ctx, cx + eyeSpacing, eyeY, blink);
    } else if (mood === "sad") {
      // 悲伤眼（下垂）
      drawSadEye(ctx, cx - eyeSpacing, eyeY, blink);
      drawSadEye(ctx, cx + eyeSpacing, eyeY, blink);
    } else if (mood === "surprised") {
      // 惊讶眼（大圆）
      drawSurprisedEye(ctx, cx - eyeSpacing, eyeY, blink);
      drawSurprisedEye(ctx, cx + eyeSpacing, eyeY, blink);
    } else if (mood === "thinking") {
      // 思考眼（斜视）
      drawThinkingEye(ctx, cx - eyeSpacing, eyeY, blink);
      drawThinkingEye(ctx, cx + eyeSpacing, eyeY, blink);
    } else {
      // 正常眼（圆）
      drawNormalEye(ctx, cx - eyeSpacing, eyeY, blink);
      drawNormalEye(ctx, cx + eyeSpacing, eyeY, blink);
    }

    // ---- 腮红 ----
    const blushAlpha = mood === "happy" || mood === "surprised" ? 0.5 : 0.3;
    ctx.beginPath();
    ctx.ellipse(cx - 28, finalY + 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(251, 182, 206, ${blushAlpha})`;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 28, finalY + 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(251, 182, 206, ${blushAlpha})`;
    ctx.fill();

    // ---- 鼻子 ----
    ctx.beginPath();
    ctx.ellipse(cx, finalY + 2, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f472b6";
    ctx.fill();

    // ---- 嘴巴 ----
    ctx.strokeStyle = "#e53e3e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (mood === "happy") {
      // 微笑
      ctx.beginPath();
      ctx.arc(cx, finalY + 5, 8, 0.1, Math.PI - 0.1);
      ctx.stroke();
    } else if (mood === "sad") {
      // 悲伤
      ctx.beginPath();
      ctx.arc(cx, finalY + 15, 8, Math.PI + 0.1, -0.1);
      ctx.stroke();
    } else if (mood === "surprised") {
      // 惊讶（O型嘴）
      ctx.beginPath();
      ctx.ellipse(cx, finalY + 8, 4, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#e53e3e";
      ctx.fill();
    } else if (mood === "thinking") {
      // 思考（歪嘴）
      ctx.beginPath();
      ctx.moveTo(cx - 5, finalY + 8);
      ctx.quadraticCurveTo(cx + 3, finalY + 5, cx + 8, finalY + 10);
      ctx.stroke();
    } else {
      // 正常（一条线）
      ctx.beginPath();
      ctx.arc(cx, finalY + 7, 5, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }

    // ---- 胡须 ----
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;

    // 左胡须
    ctx.beginPath();
    ctx.moveTo(cx - 12, finalY + 1);
    ctx.lineTo(cx - 32, finalY - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, finalY + 4);
    ctx.lineTo(cx - 32, finalY + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, finalY + 7);
    ctx.lineTo(cx - 32, finalY + 9);
    ctx.stroke();

    // 右胡须
    ctx.beginPath();
    ctx.moveTo(cx + 12, finalY + 1);
    ctx.lineTo(cx + 32, finalY - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 12, finalY + 4);
    ctx.lineTo(cx + 32, finalY + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 12, finalY + 7);
    ctx.lineTo(cx + 32, finalY + 9);
    ctx.stroke();

    ctx.restore();
  }, [mood]);

  // 各种眼睛绘制函数
  const drawNormalEye = (ctx: CanvasRenderingContext2D, x: number, y: number, blink: boolean) => {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    // 眼眶
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 瞳孔
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 5, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#4a5568";
    ctx.fill();
    // 高光
    ctx.beginPath();
    ctx.arc(x + 3, y - 3, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 1, y - 1, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fill();
  };

  const drawHappyEye = (ctx: CanvasRenderingContext2D, x: number, y: number, blink: boolean) => {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    // 弯弯的笑眼
    ctx.beginPath();
    ctx.arc(x, y - 2, 9, Math.PI + 0.2, -0.2);
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const drawSadEye = (ctx: CanvasRenderingContext2D, x: number, y: number, blink: boolean) => {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    // 下垂的悲伤眼
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 9, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 瞳孔（稍微偏下）
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 5, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#4a5568";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3, y - 1, 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  };

  const drawSurprisedEye = (ctx: CanvasRenderingContext2D, x: number, y: number, blink: boolean) => {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    // 大圆惊讶眼
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 小瞳孔
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#4a5568";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 2, y - 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  };

  const drawThinkingEye = (ctx: CanvasRenderingContext2D, x: number, y: number, blink: boolean) => {
    if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.strokeStyle = "#4a5568";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    // 斜视思考眼
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 瞳孔（偏一侧）
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 1, 4, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#4a5568";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5, y - 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  };

  // 点击动画
  const handleClick = useCallback(() => {
    tapAnimRef.current = { active: true, time: timeRef.current };
    onTap?.();
  }, [onTap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 动画循环
    let running = true;
    const loop = (timestamp: number) => {
      if (!running) return;
      timeRef.current = timestamp;

      // 随机眨眼（每 2-4 秒）
      if (blinkRef.current <= 0) {
        if (Math.random() < 0.005) {
          blinkRef.current = 10;
        }
      } else {
        blinkRef.current--;
      }

      // 点击弹跳结束检测
      if (tapAnimRef.current.active) {
        const elapsed = timestamp - tapAnimRef.current.time;
        if (elapsed > 1000) {
          tapAnimRef.current.active = false;
        }
      }

      drawCat(ctx, canvas.width, canvas.height, timestamp);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleClick);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleClick);
    };
  }, [drawCat, handleClick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: "pointer" }}
    />
  );
}