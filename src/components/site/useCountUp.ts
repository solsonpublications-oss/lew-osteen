"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// useCountUp — animates a number from 0 to `target` when the
// element enters the viewport. Returns { ref, value }.
// ============================================================

export function useCountUp<T extends HTMLElement = HTMLElement>(target: number, opts?: {
  duration?: number; // ms
  decimals?: number;
  startOnView?: boolean; // default true
}): {
  ref: React.RefObject<T | null>;
  value: number;
} {
  const duration = opts?.duration ?? 1500;
  const decimals = opts?.decimals ?? 0;
  const startOnView = opts?.startOnView ?? true;
  const ref = useRef<T>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  const start = useCallback(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setValue(
        decimals > 0
          ? Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals)
          : Math.floor(current)
      );
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration, decimals]);

  useEffect(() => {
    if (!startOnView) {
      start();
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          start();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView, start]);

  return { ref, value };
}
