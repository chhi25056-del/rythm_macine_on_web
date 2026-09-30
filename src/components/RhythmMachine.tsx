"use client";

import { useState, useEffect, useRef } from "react";

export default function RhythmMachine() {
  const [steps, setSteps] = useState<boolean[]>([true, false, false, false, true, false, false, false]);
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
        const next = (prev + 1) % 8;
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
    setSteps((prev) => prev.map((val, i) => (i === idx ? !val : val)));
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-zinc-900 text-white rounded-2xl shadow-xl max-w-md mx-auto">
      <h1 className="text-xl font-bold tracking-wider text-zinc-100">8-STEP RHYTHM</h1>

      <div className="flex gap-2">
        {steps.map((on, idx) => (
          <button
            key={idx}
            onClick={() => toggleStep(idx)}
            className={`w-10 h-16 rounded-lg font-bold transition-all border ${
              on
                ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
            } ${isPlaying && currentStep === idx ? "ring-4 ring-amber-400 scale-105" : ""}`}
            aria-label={`Step ${idx + 1}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <button
        onClick={togglePlay}
        className={`px-8 py-3 rounded-full font-bold tracking-wide transition-all ${
          isPlaying
            ? "bg-amber-500 hover:bg-amber-600 text-zinc-950"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        }`}
      >
        {isPlaying ? "STOP" : "PLAY"}
      </button>
    </div>
  );
}
