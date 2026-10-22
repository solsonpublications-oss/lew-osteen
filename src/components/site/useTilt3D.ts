"use client";

import { useRef, useState, useCallback } from "react";

// ============================================================
// useTilt3D — tracks mouse position over an element and
// returns a transform string for a 3D tilt effect.
// Returns { ref, style, onMouseMove, onMouseLeave }.
// ============================================================

export type Tilt3DResult = {
  ref: React.RefObject<HTMLDivElement>;
  style: React.CSSProperties;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
};

export function useTilt3D(opts?: {
  maxTilt?: number; // max degrees of rotation
  scale?: number; // hover scale
  perspective?: number; // px
}): Tilt3DResult {
  const maxTilt = opts?.maxTilt ?? 12;
  const scale = opts?.scale ?? 1.04;
  const perspective = opts?.perspective ?? 800;
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>(
    `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // px from left
      const y = e.clientY - rect.top; // px from top
      const px = x / rect.width; // 0..1
      const py = y / rect.height; // 0..1
      // Tilt toward the cursor.
      const rotY = (px - 0.5) * 2 * maxTilt; // -maxTilt..maxTilt
      const rotX = -(py - 0.5) * 2 * maxTilt; // inverted so cursor up tilts forward
      setTransform(
        `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale})`
      );
    },
    [maxTilt, perspective, scale]
  );

  const onMouseLeave = useCallback(() => {
    setTransform(
      `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`
    );
  }, [perspective]);

  return {
    ref,
    style: {
      transform,
      transition: "transform 0.2s ease-out",
      transformStyle: "preserve-3d",
      willChange: "transform",
    },
    onMouseMove,
    onMouseLeave,
  };
}
