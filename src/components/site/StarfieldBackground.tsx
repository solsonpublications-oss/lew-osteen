"use client";

import { useEffect, useRef } from "react";

/**
 * Animated canvas starfield. Renders drifting stars with subtle parallax twinkle.
 * Pauses when the tab is hidden and respects prefers-reduced-motion.
 */
export function StarfieldBackground({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = { x: number; y: number; r: number; a: number; tw: number; vx: number };
    let stars: Star[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((width * height) / 9000 * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * 0.02 + 0.004,
        vx: (Math.random() - 0.5) * 0.04,
      }));
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.a += s.tw;
        if (s.a > 0.9 || s.a < 0.15) s.tw *= -1;
        s.x += s.vx;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        const alpha = Math.max(0.1, Math.min(1, s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        // Warm white/gold stars
        ctx.fillStyle = `rgba(255, 240, 210, ${alpha})`;
        if (s.r > 1) {
          ctx.shadowColor = "rgba(242, 201, 76, 0.8)";
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduced) {
      // Draw a single static frame
      draw();
      cancelAnimationFrame(raf);
    } else {
      draw();
    }

    const onVisibility = () => {
      running = !document.hidden;
      if (running && !reduced) draw();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
    />
  );
}
