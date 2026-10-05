"use client";

import { useState, useEffect, useRef } from "react";
import { toggleStepAt, getNextStep } from "@/lib/sequencer";

export default function RhythmMachine() {
  const [steps, setSteps] = useState<boolean[]>(() =>
    Array(16)
      .fill(false)
      .map((_, i) => i % 4 === 0)
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const playKick = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);

    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = getNextStep(prev, 16);
        if (stepsRef.current[next]) {
          playKick();
        }
        return next;
      });
    }, 125);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (stepsRef.current[0]) playKick();
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentStep(0);
    }
  };

  const toggleStep = (idx: number) => {
    setSteps((prev) => toggleStepAt(prev, idx));
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 sm:p-8 bg-zinc-900 text-white rounded-2xl shadow-xl max-w-4xl mx-auto w-full">
      <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-zinc-100">16-STEP RHYTHM</h1>

      <div className="w-full">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 w-full">
          {[0, 1, 2, 3].map((groupIndex) => (
            <div
              key={groupIndex}
              className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 sm:p-2 bg-zinc-950/50 rounded-xl border border-zinc-800/80"
            >
              {steps.slice(groupIndex * 4, groupIndex * 4 + 4).map((on, subIdx) => {
                const idx = groupIndex * 4 + subIdx;
                const isCurrent = isPlaying && currentStep === idx;
                const isDownbeat = idx % 4 === 0;

                return (
                  <button
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`w-full h-12 sm:h-16 rounded-md sm:rounded-lg transition-all border flex items-center justify-center select-none ${
                      on
                        ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30"
                        : isDownbeat
                        ? "bg-zinc-800/90 border-zinc-700 hover:border-zinc-500"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                    } ${isCurrent ? "ring-2 sm:ring-4 ring-amber-400 scale-105 z-10 brightness-125" : ""}`}
                    aria-label={`Step ${idx + 1}`}
                  >
                    <span
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                        on
                          ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110"
                          : isDownbeat
                          ? "bg-zinc-600/60"
                          : "bg-zinc-700/40"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={togglePlay}
        className={`px-8 py-3 rounded-full font-bold tracking-wide transition-all shadow-md active:scale-95 ${
          isPlaying
            ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-amber-500/20"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
        }`}
      >
        {isPlaying ? "STOP" : "PLAY"}
      </button>
    </div>
  );
}
