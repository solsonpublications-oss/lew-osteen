"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient dust-mote particle layer for the hero.
 * Renders slow-drifting golden dust motes on a canvas — adds atmosphere
 * beyond the static starfield. Motes drift upward slowly with gentle
 * horizontal sway. Pauses when the tab is hidden and respects
 * prefers-reduced-motion (renders nothing).
 */
export function DustMotes({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    type Mote = {
      x: number;
      y: number;
      r: number;
      vy: number;
      sway: number;
      swaySpeed: number;
      phase: number;
      alpha: number;
    };
    let motes: Mote[] = [];

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

      const count = Math.floor((width * height) / 14000 * density);
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.4,
        vy: Math.random() * 0.12 + 0.04,
        sway: Math.random() * 8 + 4,
        swaySpeed: Math.random() * 0.008 + 0.003,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const now = performance.now() * 0.001;
      for (const m of motes) {
        m.y -= m.vy;
        if (m.y < -10) {
          m.y = height + 10;
          m.x = Math.random() * width;
        }
        const x = m.x + Math.sin(now + m.phase) * m.sway;
        const a = m.alpha * (0.6 + 0.4 * Math.sin(now * 0.5 + m.phase));
        ctx.beginPath();
        ctx.arc(x, m.y, m.r, 0, Math.PI * 2);
        // Warm gold/cream motes
        ctx.fillStyle = `rgba(242, 201, 76, ${a})`;
        ctx.shadowColor = "rgba(217, 178, 107, 0.6)";
        ctx.shadowBlur = m.r > 1 ? 4 : 2;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    const onVis = () => {
      running = !document.hidden;
      if (running) draw();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
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
