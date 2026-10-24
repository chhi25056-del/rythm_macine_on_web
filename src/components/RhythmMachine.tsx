"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  type TrackId,
  type Pattern,
  type MeasureCount,
  type TimeSignature,
  type TrackLengths,
  type FillInterval,
  TIME_SIGNATURE_CONFIGS,
  MIN_TRACK_LENGTH,
  MAX_TRACK_LENGTH,
  createDefaultPattern,
  createEmptyPattern,
  createDefaultTrackLengths,
  getTrackStepIndex,
  isStepActiveForTrack,
  shouldTriggerTrack,
  togglePatternStep,
  copyBarPattern,
  fillTrackPattern,
} from "@/lib/sequencer";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialSpotlight } from "@/components/TutorialSpotlight";

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
    id: "crash",
    name: "Crash",
    shortName: "CR",
    badgeColor: "text-amber-300",
    activeClasses: "bg-amber-400 border-amber-300 text-zinc-950 shadow-md shadow-amber-400/20",
    dotClasses: "bg-zinc-950 scale-110",
  },
  {
    id: "hihatOpen",
    name: "Open HH",
    shortName: "OH",
    badgeColor: "text-purple-400",
    activeClasses: "bg-purple-500 border-purple-400 text-white shadow-md shadow-purple-500/20",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
  {
    id: "hihatClosed",
    name: "Closed HH",
    shortName: "CH",
    badgeColor: "text-yellow-400",
    activeClasses: "bg-yellow-400 border-yellow-300 text-zinc-950 shadow-md shadow-yellow-400/20",
    dotClasses: "bg-zinc-950 scale-110",
  },
  {
    id: "hiTom",
    name: "Hi Tom",
    shortName: "HT",
    badgeColor: "text-emerald-400",
    activeClasses: "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
  {
    id: "lowTom",
    name: "Low Tom",
    shortName: "LT",
    badgeColor: "text-cyan-400",
    activeClasses: "bg-cyan-500 border-cyan-400 text-white shadow-md shadow-cyan-500/20",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
  {
    id: "snare",
    name: "Snare",
    shortName: "SD",
    badgeColor: "text-sky-400",
    activeClasses: "bg-sky-500 border-sky-400 text-white shadow-md shadow-sky-500/20",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
  {
    id: "kick",
    name: "Kick",
    shortName: "KD",
    badgeColor: "text-rose-400",
    activeClasses: "bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/20",
    dotClasses: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-110",
  },
];

export default function RhythmMachine() {
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [isTimeSigMenuOpen, setIsTimeSigMenuOpen] = useState<boolean>(false);
  const [pattern, setPattern] = useState<Pattern>(() => createDefaultPattern("4/4"));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [globalStep, setGlobalStep] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(120);
  const [bars, setBars] = useState<MeasureCount>(1);
  const [activeBar, setActiveBar] = useState<number>(0);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [openFillTrackId, setOpenFillTrackId] = useState<TrackId | null>(null);

  // チュートリアル状態管理
  const {
    tutorialStep,
    currentStepConfig,
    totalSteps: tutorialTotalSteps,
    isCompleted: isTutorialCompleted,
    dismissCompleted: dismissTutorialCompleted,
    triggerStep: triggerTutorialStep,
    skipTutorial,
    startTutorial,
  } = useTutorial(1);

  // トラックごとのステップ長（ポリメーター対応: 1〜32）
  const [trackLengths, setTrackLengths] = useState<TrackLengths>(() =>
    createDefaultTrackLengths(TIME_SIGNATURE_CONFIGS["4/4"].stepsPerBar)
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const timeSigMenuRef = useRef<HTMLDivElement | null>(null);
  const fillMenuRef = useRef<HTMLDivElement | null>(null);
  const patternRef = useRef(pattern);
  const trackLengthsRef = useRef(trackLengths);
  const globalStepRef = useRef(0);

  // レンダリング中の ref 変更を避け、useEffect で同期
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    trackLengthsRef.current = trackLengths;
  }, [trackLengths]);

  const currentSigConfig = TIME_SIGNATURE_CONFIGS[timeSignature];
  const stepsPerBar = currentSigConfig.stepsPerBar;
  const totalSteps = bars * stepsPerBar;

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        timeSigMenuRef.current &&
        !timeSigMenuRef.current.contains(e.target as Node)
      ) {
        setIsTimeSigMenuOpen(false);
      }
      if (
        fillMenuRef.current &&
        !fillMenuRef.current.contains(e.target as Node)
      ) {
        setOpenFillTrackId(null);
      }
    };
    if (isTimeSigMenuOpen || openFillTrackId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTimeSigMenuOpen, openFillTrackId]);

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
    const bufferSize = ctx.sampleRate * 2;
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

  /**
   * オープンハイハットの発音
   * ホワイトノイズに6.5kHzのハイパスフィルタを適用し、
   * 0.35秒の長めのエンベロープで減衰させて「シャーン」という伸びのあるシンバル音を作ります。
   */
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

  const playHiTom = useCallback((ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.22);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.22);

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "triangle";
    click.frequency.setValueAtTime(450, time);
    click.frequency.exponentialRampToValueAtTime(120, time + 0.02);
    clickGain.gain.setValueAtTime(0.4, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(time);
    click.stop(time + 0.02);
  }, []);

  const playLowTom = useCallback((ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(65, time + 0.28);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.28);

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "triangle";
    click.frequency.setValueAtTime(320, time);
    click.frequency.exponentialRampToValueAtTime(80, time + 0.025);
    clickGain.gain.setValueAtTime(0.35, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(time);
    click.stop(time + 0.025);
  }, []);

  /**
   * クラッシュシンバルの発音
   * ハイハットに近い高域のクリスプなホワイトノイズをベースに設計。
   * トライアングル波オシレーターによる濁りを排し、オープンハイハットと同系統の
   * 高域ハイパスフィルタ（6200Hz）となめらかなサステインエンベロープで、
   * ハイハットと統一感のある明るく抜けの良いシンバル音を生成します。
   */
  const playCrash = useCallback((ctx: AudioContext, time: number) => {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(6200, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.9);

    noise.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.9);
  }, [getNoiseBuffer]);

  const playInstrument = useCallback(
    (trackId: TrackId, ctx: AudioContext, time: number) => {
      switch (trackId) {
        case "crash":
          playCrash(ctx, time);
          break;
        case "hihatOpen":
          playOpenHiHat(ctx, time);
          break;
        case "hihatClosed":
          playClosedHiHat(ctx, time);
          break;
        case "hiTom":
          playHiTom(ctx, time);
          break;
        case "lowTom":
          playLowTom(ctx, time);
          break;
        case "snare":
          playSnare(ctx, time);
          break;
        case "kick":
          playKick(ctx, time);
          break;
      }
    },
    [
      playCrash,
      playOpenHiHat,
      playClosedHiHat,
      playHiTom,
      playLowTom,
      playSnare,
      playKick,
    ]
  );

  const triggerInstrument = useCallback(
    (trackId: TrackId) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      playInstrument(trackId, ctx, now);
    },
    [getAudioContext, playInstrument]
  );

  /**
   * ポリメーター対応のステップ発音処理
   * 全トラックの各ステップ長（trackLength）に基づき、
   * globalStep % trackLength を計算して該当ステップがONなら発音します。
   */
  const triggerStepSounds = useCallback(
    (tick: number) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const currentPattern = patternRef.current;
      const currentLengths = trackLengthsRef.current;

      (Object.keys(currentPattern) as TrackId[]).forEach((trackId) => {
        const len = currentLengths[trackId] ?? 16;
        if (shouldTriggerTrack(currentPattern, trackId, tick, len)) {
          playInstrument(trackId, ctx, now);
        }
      });
    },
    [getAudioContext, playInstrument]
  );

  const getStepIntervalMs = (currentBpm: number): number => {
    return 15000 / currentBpm;
  };

  /**
   * シーケンサーの自動進行タイマー
   * globalStep を増加させ続けることで、トラック間のステップ数差異によるポリメーター位相ズレを正確に維持します。
   */
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = getStepIntervalMs(bpm);
    const interval = setInterval(() => {
      const nextTick = globalStepRef.current + 1;
      globalStepRef.current = nextTick;
      setGlobalStep(nextTick);
      triggerStepSounds(nextTick);

      if (autoFollow) {
        const currentPlayingBar = Math.floor((nextTick % totalSteps) / stepsPerBar);
        if (currentPlayingBar < bars) {
          setActiveBar((prev) => (prev !== currentPlayingBar ? currentPlayingBar : prev));
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, bpm, totalSteps, stepsPerBar, bars, autoFollow, triggerStepSounds]);

  const togglePlay = () => {
    if (!isPlaying) {
      globalStepRef.current = 0;
      setGlobalStep(0);
      triggerStepSounds(0);
      if (autoFollow) {
        setActiveBar(0);
      }
      setIsPlaying(true);
      triggerTutorialStep(1);
    } else {
      setIsPlaying(false);
      globalStepRef.current = 0;
      setGlobalStep(0);
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(Number(e.target.value));
    triggerTutorialStep(3);
  };

  const handleMeasureChange = (newBars: MeasureCount) => {
    setBars(newBars);
    if (activeBar >= newBars) {
      setActiveBar(0);
    }
    const newTotalSteps = newBars * stepsPerBar;
    setTrackLengths((prev) => {
      const oldTotalSteps = bars * stepsPerBar;
      const next = { ...prev };
      (Object.keys(next) as TrackId[]).forEach((id) => {
        if (next[id] === oldTotalSteps || next[id] > newTotalSteps) {
          next[id] = newTotalSteps;
        }
      });
      return next;
    });
  };

  /**
   * トラックごとのステップ長を変更（ポリメーター設定）
   */
  const updateTrackLength = (trackId: TrackId, delta: number) => {
    setTrackLengths((prev) => {
      const current = prev[trackId] ?? totalSteps;
      const next = Math.max(MIN_TRACK_LENGTH, Math.min(MAX_TRACK_LENGTH, current + delta));
      return { ...prev, [trackId]: next };
    });
    triggerTutorialStep(5);
  };

  /**
   * 全トラックのステップ長を一括で設定・リセット
   */
  const handleResetAllTrackLengths = (length?: number) => {
    const target = length ?? totalSteps;
    setTrackLengths(createDefaultTrackLengths(target));
  };

  /**
   * 拍子変更ハンドラー
   */
  const handleTimeSignatureChange = (sig: TimeSignature) => {
    setTimeSignature(sig);
    setIsTimeSigMenuOpen(false);
    setPattern(createDefaultPattern(sig));
    const newStepsPerBar = TIME_SIGNATURE_CONFIGS[sig].stepsPerBar;
    const newTotalSteps = bars * newStepsPerBar;
    setTrackLengths(createDefaultTrackLengths(newTotalSteps));
    globalStepRef.current = 0;
    setGlobalStep(0);
    setActiveBar(0);
  };

  const handleDuplicateBar = () => {
    const nextBar = (activeBar + 1) % bars;
    setPattern((prev) => copyBarPattern(prev, activeBar, nextBar, stepsPerBar));
  };

  const handleClearPattern = () => {
    setPattern(createEmptyPattern());
  };

  const handleResetPattern = () => {
    setPattern(createDefaultPattern(timeSignature));
    setTrackLengths(createDefaultTrackLengths(totalSteps));
  };

  const toggleStep = (trackId: TrackId, stepIndex: number) => {
    setPattern((prev) => {
      const next = togglePatternStep(prev, trackId, stepIndex);
      if (next[trackId][stepIndex]) {
        triggerInstrument(trackId);
      }
      return next;
    });
    triggerTutorialStep(2);
  };

  const handleFillTrack = (
    trackId: TrackId,
    interval: FillInterval,
    scope: "currentBar" | "all" = "currentBar"
  ) => {
    setPattern((prev) =>
      fillTrackPattern(prev, trackId, interval, {
        scope,
        barIndex: activeBar,
        stepsPerBar,
        trackLength: trackLengths[trackId],
        mode: "replace",
      })
    );
    if (interval !== "clear") {
      triggerInstrument(trackId);
    }
    triggerTutorialStep(4);
    setOpenFillTrackId(null);
  };

  const barOffset = activeBar * stepsPerBar;
  const currentPlayingBar = Math.floor((globalStep % totalSteps) / stepsPerBar);

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 bg-zinc-900/95 text-white rounded-xl shadow-2xl max-w-4xl w-full border border-zinc-800">
      {/* コンパクトヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-black tracking-wide text-zinc-100">
            Rythm Machine
          </h1>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            7 Tracks
          </span>

          {/* 拍子変更ボタン＆ポップオーバーメニュー */}
          <div className="relative" ref={timeSigMenuRef}>
            <button
              type="button"
              onClick={() => setIsTimeSigMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="拍子を変更する"
            >
              <span className="text-[10px] text-zinc-500 font-semibold">拍子:</span>
              <span className="text-amber-400 font-extrabold">{timeSignature}</span>
              <span className="text-[9px] text-zinc-500">▼</span>
            </button>

            {/* 拍子変更ポップオーバー（普段は隠されており、クリックで展開） */}
            {isTimeSigMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider border-b border-zinc-800 mb-1">
                  拍子を選択
                </div>
                {(["4/4", "3/4", "5/4", "6/8", "7/8"] as TimeSignature[]).map((sig) => {
                  const config = TIME_SIGNATURE_CONFIGS[sig];
                  const isSelected = timeSignature === sig;
                  return (
                    <button
                      key={sig}
                      type="button"
                      onClick={() => handleTimeSignatureChange(sig)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${isSelected
                        ? "bg-amber-400 text-zinc-950 font-extrabold shadow-sm"
                        : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                        }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs">{sig}</span>
                        <span
                          className={`text-[10px] font-normal ${isSelected ? "text-zinc-900" : "text-zinc-400"
                            }`}
                        >
                          {config.description}
                        </span>
                      </div>
                      {isSelected && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* 小節数セレクタ */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-xs">
            <span className="text-[10px] font-semibold text-zinc-500 px-1.5">ループ:</span>
            {([1, 2, 4] as MeasureCount[]).map((m) => (
              <button
                key={m}
                onClick={() => handleMeasureChange(m)}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${bars === m
                  ? "bg-amber-400 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
                  }`}
                title={`${m}小節ループ`}
              >
                {m}小節
              </button>
            ))}
          </div>

          {/* BPM */}
          <div
            id="tutorial-target-bpm"
            className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-lg transition-all"
          >
            <span className="text-[10px] font-bold text-zinc-500">BPM</span>
            <span className="font-mono font-bold text-xs text-amber-400 w-7 text-right tabular-nums">
              {bpm}
            </span>
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={handleBpmChange}
              className="w-14 sm:w-20 accent-amber-400 cursor-pointer h-1 bg-zinc-800 rounded appearance-none"
              aria-label="BPM Slider"
            />
          </div>

          {/* PLAY / STOP */}
          <button
            id="tutorial-target-play"
            onClick={togglePlay}
            className={`px-4 py-1 rounded-lg font-bold tracking-wide transition-all shadow text-xs flex items-center gap-1.5 cursor-pointer ${isPlaying
              ? "bg-amber-500 hover:bg-amber-600 text-zinc-950"
              : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-zinc-950 animate-pulse" : "bg-white"}`} />
            {isPlaying ? "STOP" : "PLAY"}
          </button>

          {/* チュートリアルボタン（常設してレイアウト変化を防止） */}
          <button
            type="button"
            onClick={tutorialStep !== null ? skipTutorial : startTutorial}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              tutorialStep !== null
                ? "bg-amber-400 text-zinc-950 border-amber-300 shadow-sm"
                : "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-amber-400"
            }`}
            title={tutorialStep !== null ? "チュートリアルを終了する" : "チュートリアルを開始する"}
          >
            <span>💡</span>
            <span className="hidden sm:inline">
              {tutorialStep !== null ? "チュートリアル中" : "チュートリアル"}
            </span>
          </button>
        </div>
      </div>

      {/* チュートリアル・暗転スポットライト & 吹き出し & 完了祝賀演出 */}
      <TutorialSpotlight
        currentStep={tutorialStep}
        totalSteps={tutorialTotalSteps}
        config={currentStepConfig}
        isCompleted={isTutorialCompleted}
        onSkip={skipTutorial}
        onDismiss={dismissTutorialCompleted}
      />

      {/* 小節ナビゲーション＆操作ツール */}
      <div className="flex items-center justify-between gap-2 px-2 py-1 bg-zinc-950/70 rounded-lg border border-zinc-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-zinc-400">編集小節:</span>
          {Array.from({ length: bars }).map((_, barIdx) => {
            const isBarPlaying = isPlaying && currentPlayingBar === barIdx;
            const isSelected = activeBar === barIdx;
            const startStepNum = barIdx * stepsPerBar + 1;
            const endStepNum = (barIdx + 1) * stepsPerBar;
            return (
              <button
                key={barIdx}
                onClick={() => setActiveBar(barIdx)}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${isSelected
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
              >
                <span>Bar {barIdx + 1}</span>
                <span className={`text-[10px] ${isSelected ? "text-zinc-900" : "text-zinc-500"}`}>
                  ({startStepNum}-{endStepNum})
                </span>
                {isBarPlaying && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-zinc-950" : "bg-emerald-400"} animate-ping`} />
                )}
              </button>
            );
          })}

          {bars > 1 && (
            <button
              onClick={() => setAutoFollow((prev) => !prev)}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-all ml-1 cursor-pointer ${autoFollow
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
              title="再生小節に自動追従"
            >
              {autoFollow ? "追従ON" : "追従OFF"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleResetAllTrackLengths(totalSteps)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
            title={`全トラックのステップ長をループ全体のステップ数（${totalSteps}）に揃える`}
          >
            長さを揃える ({totalSteps})
          </button>
          {bars > 1 && (
            <button
              onClick={handleDuplicateBar}
              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
              title="現在の小節を次の小節へ複製"
            >
              次小節へ複製
            </button>
          )}
          <button
            onClick={handleResetPattern}
            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
          >
            初期化
          </button>
          <button
            onClick={handleClearPattern}
            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 border border-zinc-700 cursor-pointer"
          >
            クリア
          </button>
        </div>
      </div>

      {/* ステップシーケンサーグリッド（拍子に応じた拍グループ分割 ＆ ポリメーター表示） */}
      <div className="flex flex-col gap-1 w-full">
        {TRACKS.map((track) => {
          let stepCounter = 0;
          const trackLen = trackLengths[track.id] ?? totalSteps;
          const currentTrackPlayStep = getTrackStepIndex(globalStep, trackLen);

          return (
            <div key={track.id} className="flex items-center gap-2 w-full">
              {/* トラック名ラベル＆ステップ長コントローラー (Polymeter) & クイックフィル */}
              <div className="w-36 sm:w-44 shrink-0 flex items-center justify-between gap-1 relative">
                <button
                  type="button"
                  onClick={() => triggerInstrument(track.id)}
                  className="flex-1 min-w-0 flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-zinc-800/80 transition-colors text-left cursor-pointer group"
                  title="クリックして試聴"
                >
                  <span className={`text-xs font-bold truncate group-hover:brightness-125 ${track.badgeColor}`}>
                    {track.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold group-hover:text-zinc-300 ml-1">
                    {track.shortName}
                  </span>
                </button>

                {/* ステップ長 +/- コントロール */}
                <div
                  id={track.id === "hihatClosed" ? "tutorial-target-length" : undefined}
                  className="flex items-center bg-zinc-950/90 rounded border border-zinc-800 p-0.5 shrink-0"
                  title={`トラックステップ長: ${trackLen} (1〜${MAX_TRACK_LENGTH})`}
                >
                  <button
                    type="button"
                    onClick={() => updateTrackLength(track.id, -1)}
                    disabled={trackLen <= MIN_TRACK_LENGTH}
                    className="w-4 h-4 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none"
                    aria-label={`${track.name}のステップ数を減らす`}
                  >
                    -
                  </button>
                  <span className="font-mono text-[10px] font-bold text-amber-300 w-4 sm:w-5 text-center select-none">
                    {trackLen}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTrackLength(track.id, 1)}
                    disabled={trackLen >= MAX_TRACK_LENGTH}
                    className="w-4 h-4 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none"
                    aria-label={`${track.name}のステップ数を増やす`}
                  >
                    +
                  </button>
                </div>

                {/* クイックフィルメニュー（4分・8分・16分） */}
                <div
                  id={track.id === "hihatClosed" ? "tutorial-target-fill" : undefined}
                  className="relative shrink-0"
                  ref={openFillTrackId === track.id ? fillMenuRef : null}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFillTrackId(openFillTrackId === track.id ? null : track.id)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-all flex items-center gap-0.5 cursor-pointer select-none ${openFillTrackId === track.id
                      ? "bg-amber-400 text-zinc-950 border-amber-300 shadow-sm"
                      : "bg-zinc-950/90 text-zinc-400 hover:text-amber-300 border-zinc-800 hover:border-zinc-700"
                      }`}
                    title={`${track.name} のステップを一括配置（4分・8分・16分）`}
                  >
                    <span>Fill</span>
                    <span className="text-[8px] opacity-70">▾</span>
                  </button>

                  {openFillTrackId === track.id && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700/80 rounded-lg p-1.5 shadow-2xl shadow-black min-w-[136px] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="text-[9px] font-bold text-zinc-400 px-1.5 py-0.5 uppercase tracking-wider border-b border-zinc-800/80 flex items-center justify-between">
                        <span className={track.badgeColor}>{track.name}</span>
                        <span className="text-amber-400 font-mono">Bar {activeBar + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFillTrack(track.id, "1/4")}
                        className="w-full text-left px-2 py-1 rounded text-xs text-zinc-200 hover:bg-amber-400 hover:text-zinc-950 transition-colors flex items-center justify-between font-medium cursor-pointer"
                      >
                        <span>♩ 4分音符</span>
                        <span className="text-[10px] opacity-75 font-mono">1/4</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillTrack(track.id, "1/8")}
                        className="w-full text-left px-2 py-1 rounded text-xs text-zinc-200 hover:bg-amber-400 hover:text-zinc-950 transition-colors flex items-center justify-between font-medium cursor-pointer"
                      >
                        <span>♪ 8分音符</span>
                        <span className="text-[10px] opacity-75 font-mono">1/8</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillTrack(track.id, "1/16")}
                        className="w-full text-left px-2 py-1 rounded text-xs text-zinc-200 hover:bg-amber-400 hover:text-zinc-950 transition-colors flex items-center justify-between font-medium cursor-pointer"
                      >
                        <span>♬ 16分音符</span>
                        <span className="text-[10px] opacity-75 font-mono">1/16</span>
                      </button>
                      <div className="my-0.5 border-t border-zinc-800" />
                      <button
                        type="button"
                        onClick={() => handleFillTrack(track.id, "clear")}
                        className="w-full text-left px-2 py-1 rounded text-xs text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-between font-medium cursor-pointer"
                      >
                        <span>✕ クリア</span>
                        <span className="text-[10px] opacity-75 font-mono">Clear</span>
                      </button>

                      {bars > 1 && (
                        <div className="pt-1 mt-0.5 border-t border-zinc-800">
                          <div className="text-[9px] text-zinc-400 px-1.5 pb-1 font-semibold">全小節に適用:</div>
                          <div className="grid grid-cols-3 gap-1 px-0.5">
                            <button
                              type="button"
                              onClick={() => handleFillTrack(track.id, "1/4", "all")}
                              className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-zinc-200 font-mono text-center cursor-pointer transition-colors"
                              title="全小節に4分音符を配置"
                            >
                              4分
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFillTrack(track.id, "1/8", "all")}
                              className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-zinc-200 font-mono text-center cursor-pointer transition-colors"
                              title="全小節に8分音符を配置"
                            >
                              8分
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFillTrack(track.id, "1/16", "all")}
                              className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-zinc-200 font-mono text-center cursor-pointer transition-colors"
                              title="全小節に16分音符を配置"
                            >
                              16分
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 拍グループ単位のグリッド */}
              <div className="flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5">
                {currentSigConfig.groups.map((groupStepCount, groupIndex) => {
                  const groupStartStep = stepCounter;
                  stepCounter += groupStepCount;

                  return (
                    <div
                      key={groupIndex}
                      className="grid gap-0.5 sm:gap-1 p-0.5 bg-zinc-950/80 rounded border border-zinc-800/90"
                      style={{
                        flex: groupStepCount,
                        gridTemplateColumns: `repeat(${groupStepCount}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: groupStepCount }).map((_, subIdx) => {
                        const stepInBar = groupStartStep + subIdx;
                        const absoluteStep = barOffset + stepInBar;
                        const isActive = isStepActiveForTrack(absoluteStep, trackLen);
                        const on = pattern[track.id][absoluteStep] ?? false;
                        const isCurrent = isPlaying && isActive && currentTrackPlayStep === absoluteStep;
                        const isDownbeat = subIdx === 0;

                        if (!isActive) {
                          return (
                            <button
                              key={stepInBar}
                              type="button"
                              disabled
                              className="w-full h-7 sm:h-8 rounded border border-dashed border-zinc-800/40 bg-zinc-950/40 flex items-center justify-center opacity-20 cursor-not-allowed select-none"
                              aria-label={`${track.name} 非アクティブステップ ${absoluteStep + 1}（設定ステップ長: ${trackLen}）`}
                              title={`非アクティブ（${trackLen}ステップでループ）`}
                            >
                              <span className="w-1 h-1 rounded-full bg-zinc-700/30" />
                            </button>
                          );
                        }

                        return (
                          <button
                            key={stepInBar}
                            id={track.id === "kick" && stepInBar === 0 ? "tutorial-target-step" : undefined}
                            type="button"
                            onClick={() => toggleStep(track.id, absoluteStep)}
                            className={`w-full h-7 sm:h-8 rounded transition-all border flex items-center justify-center select-none cursor-pointer ${on
                              ? track.activeClasses
                              : isDownbeat
                                ? "bg-zinc-800/90 border-zinc-700 hover:border-zinc-500"
                                : "bg-zinc-900 border-zinc-800/90 hover:border-zinc-600"
                              } ${isCurrent
                                ? "ring-2 ring-amber-400 scale-105 z-10 brightness-125 shadow shadow-amber-400/40"
                                : ""
                              }`}
                            aria-label={`${track.name} Bar ${activeBar + 1} Step ${stepInBar + 1}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-all ${on
                                ? track.dotClasses
                                : isDownbeat
                                  ? "bg-zinc-600/70"
                                  : "bg-zinc-700/40"
                                }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
