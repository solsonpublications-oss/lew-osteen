"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ambient desert-wind audio toggle for the hero.
 *
 * Generates a procedural ambient soundscape with the Web Audio API — no audio
 * file to download, fully client-side, and respects browser autoplay policies
 * (starts ONLY on user gesture). Combines:
 *   - filtered brown noise (low wind rumble)
 *   - slowly-modulated bandpass (the "whoosh")
 *   - occasional faint high shimmer (distant air)
 *
 * Master gain is intentionally low (~0.08) so it's a subtle bed, not a song.
 */
export function AmbientAudioToggle() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    master: GainNode;
    stop: () => void;
  } | null>(null);

  const build = useCallback(async () => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    await ctx.resume();

    // ---- Brown noise buffer (warmer than white) ----
    const bufferSize = 2 * ctx.sampleRate; // 2 seconds, looped
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // ---- Low-pass to make it a soft wind bed ----
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 380;
    lowpass.Q.value = 0.7;

    // ---- Bandpass with LFO modulation for the "whoosh" ----
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 600;
    bandpass.Q.value = 0.8;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08; // very slow sweep
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 280;
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    // ---- High shimmer (faint) ----
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 2200;

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.18;

    // ---- Master gain (kept low) ----
    const master = ctx.createGain();
    master.gain.value = 0; // start silent, fade in

    // ---- Wiring ----
    noise.connect(lowpass);
    lowpass.connect(bandpass);
    bandpass.connect(master);

    // Also route a tiny high-pass for air shimmer
    lowpass.connect(highpass);
    highpass.connect(shimmerGain);
    shimmerGain.connect(master);

    master.connect(ctx.destination);

    // Start
    noise.start();
    lfo.start();

    // Fade in
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.08, now + 1.5);

    return {
      master,
      stop: () => {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 0.6);
        // Stop nodes after fade
        setTimeout(() => {
          try {
            noise.stop();
            lfo.stop();
          } catch {
            /* already stopped */
          }
        }, 800);
      },
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!enabled) {
      // Build + start
      const nodes = await build();
      if (!nodes) return;
      ctxRef.current = nodes.master ? (ctxRef.current ?? null) : null;
      nodesRef.current = nodes;
      setEnabled(true);
    } else {
      // Fade out + stop
      nodesRef.current?.stop();
      nodesRef.current = null;
      setEnabled(false);
    }
  }, [enabled, build]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      nodesRef.current?.stop();
      nodesRef.current = null;
    };
  }, []);

  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute ambient sound" : "Play ambient desert wind"}
      title={enabled ? "Ambient: on" : "Ambient: off"}
      className={cn(
        "h-9 w-9 rounded-full border flex items-center justify-center transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
        enabled
          ? "border-gold bg-gold/10 text-gold-bright"
          : "border-gold/50 text-gold hover:border-gold hover:bg-gold/5"
      )}
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      {enabled && (
        <span
          className="absolute inset-0 rounded-full border border-gold/40 animate-ping-slow"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
