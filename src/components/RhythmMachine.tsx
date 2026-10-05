"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  type TrackId,
  type Pattern,
  createDefaultPattern,
  togglePatternStep,
  getNextStep,
} from "@/lib/sequencer";

interface TrackDisplayConfig {
  id: TrackId;
  name: string;
  shortName: string;
  badgeColor: string;
  activeClasses: string;
  dotClasses: string;
}

const TRACKS: TrackDisplayConfig[] = [
  {
    id: "hihatOpen",
    name: "Open HH",
    shortName: "OH",
    badgeColor: "text-purple-400",
    activeClasses: "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/30",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
  {
    id: "hihatClosed",
    name: "Closed HH",
    shortName: "CH",
    badgeColor: "text-amber-400",
    activeClasses: "bg-amber-400 border-amber-300 text-zinc-950 shadow-lg shadow-amber-400/30",
    dotClasses: "bg-zinc-950 scale-110",
  },
  {
    id: "snare",
    name: "Snare",
    shortName: "SD",
    badgeColor: "text-sky-400",
    activeClasses: "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/30",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
  {
    id: "kick",
    name: "Kick",
    shortName: "KD",
    badgeColor: "text-rose-400",
    activeClasses: "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
];

export default function RhythmMachine() {
  const [pattern, setPattern] = useState<Pattern>(createDefaultPattern);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const patternRef = useRef(pattern);
  patternRef.current = pattern;

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

  const getNoiseBuffer = useCallback((ctx: AudioContext): AudioBuffer => {
    if (noiseBufferRef.current) return noiseBufferRef.current;
    const bufferSize = ctx.sampleRate * 1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = buffer;
    return buffer;
  }, []);

  const playKick = useCallback((ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  }, []);

  const playSnare = useCallback((ctx: AudioContext, time: number) => {
    // トーン成分
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);

    // スナッピー（ノイズ）成分
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.18);
  }, [getNoiseBuffer]);

  const playClosedHiHat = useCallback((ctx: AudioContext, time: number) => {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(7500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  }, [getNoiseBuffer]);

  const playOpenHiHat = useCallback((ctx: AudioContext, time: number) => {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.35);
  }, [getNoiseBuffer]);

  const triggerInstrument = useCallback(
    (trackId: TrackId) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      switch (trackId) {
        case "kick":
          playKick(ctx, now);
          break;
        case "snare":
          playSnare(ctx, now);
          break;
        case "hihatClosed":
          playClosedHiHat(ctx, now);
          break;
        case "hihatOpen":
          playOpenHiHat(ctx, now);
          break;
      }
    },
    [getAudioContext, playKick, playSnare, playClosedHiHat, playOpenHiHat]
  );

  const triggerStepSounds = useCallback(
    (stepIndex: number) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const currentPattern = patternRef.current;

      if (currentPattern.kick[stepIndex]) playKick(ctx, now);
      if (currentPattern.snare[stepIndex]) playSnare(ctx, now);
      if (currentPattern.hihatClosed[stepIndex]) playClosedHiHat(ctx, now);
      if (currentPattern.hihatOpen[stepIndex]) playOpenHiHat(ctx, now);
    },
    [getAudioContext, playKick, playSnare, playClosedHiHat, playOpenHiHat]
  );

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = getNextStep(prev, 16);
        triggerStepSounds(next);
        return next;
      });
    }, 125);

    return () => clearInterval(interval);
  }, [isPlaying, triggerStepSounds]);

  const togglePlay = () => {
    if (!isPlaying) {
      triggerStepSounds(0);
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentStep(0);
    }
  };

  const toggleStep = (trackId: TrackId, idx: number) => {
    setPattern((prev) => {
      const next = togglePatternStep(prev, trackId, idx);
      if (next[trackId][idx]) {
        triggerInstrument(trackId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 sm:p-8 bg-zinc-900 text-white rounded-2xl shadow-2xl max-w-4xl mx-auto w-full border border-zinc-800">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-wider text-zinc-100">Rythm Machine on web</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Kick, Snare, Closed Hi-Hat & Open Hi-Hat</p>
        </div>
        <button
          onClick={togglePlay}
          className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold tracking-wide transition-all shadow-md active:scale-95 text-xs sm:text-sm ${isPlaying
            ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-amber-500/20"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
            }`}
        >
          {isPlaying ? "STOP" : "PLAY"}
        </button>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {TRACKS.map((track) => (
          <div key={track.id} className="flex items-center gap-2 sm:gap-4 w-full">
            {/* トラック名ラベル */}
            <div className="w-16 sm:w-24 shrink-0 flex flex-col justify-center">
              <span className={`text-xs sm:text-sm font-bold tracking-tight truncate ${track.badgeColor}`}>
                {track.name}
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold">{track.shortName}</span>
            </div>

            {/* 16ステップ（4拍 × 4ステップ） */}
            <div className="flex-1 min-w-0 grid grid-cols-4 gap-1 sm:gap-2">
              {[0, 1, 2, 3].map((groupIndex) => (
                <div
                  key={groupIndex}
                  className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 bg-zinc-950/60 rounded-lg sm:rounded-xl border border-zinc-800/80"
                >
                  {pattern[track.id].slice(groupIndex * 4, groupIndex * 4 + 4).map((on, subIdx) => {
                    const idx = groupIndex * 4 + subIdx;
                    const isCurrent = isPlaying && currentStep === idx;
                    const isDownbeat = idx % 4 === 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => toggleStep(track.id, idx)}
                        className={`w-full h-9 sm:h-12 rounded sm:rounded-md transition-all border flex items-center justify-center select-none ${on
                          ? track.activeClasses
                          : isDownbeat
                            ? "bg-zinc-800/90 border-zinc-700 hover:border-zinc-500"
                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                          } ${isCurrent ? "ring-2 sm:ring-4 ring-amber-400 scale-105 z-10 brightness-125" : ""}`}
                        aria-label={`${track.name} Step ${idx + 1}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${on
                            ? track.dotClasses
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
        ))}
      </div>
    </div>
  );
}

