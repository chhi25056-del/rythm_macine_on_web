"use client";

import { useState, useRef, useEffect } from "react";
import {
  type Pattern,
  type TrackLengths,
  type TimeSignature,
  type MeasureCount,
  type CustomTrackId,
} from "@/lib/sequencer";
import {
  renderPatternToWavBlob,
  downloadBlob,
  generateExportFileName,
} from "@/lib/wavExport";
import { renderPatternToMidiBlob } from "@/lib/midiExport";
import { type CustomSampleState } from "@/lib/customAudio";

export interface ExportMenuProps {
  pattern: Pattern;
  trackLengths: TrackLengths;
  bpm: number;
  bars: MeasureCount;
  timeSignature: TimeSignature;
  customSamples?: Record<CustomTrackId, CustomSampleState>;
}

export function ExportMenu({
  pattern,
  trackLengths,
  bpm,
  bars,
  timeSignature,
  customSamples,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const menuRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // トースト表示ヘルパー
  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // 外部クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // WAV エクスポート処理
  const handleExportWav = async () => {
    if (isExportingWav) return;
    setIsExportingWav(true);
    setIsOpen(false);

    try {
      const blob = await renderPatternToWavBlob({
        pattern,
        trackLengths,
        bpm,
        bars,
        timeSignature,
        customSamples,
      });

      const fileName = generateExportFileName("wav", {
        timeSignature,
        bpm,
        bars,
      });
      downloadBlob(blob, fileName);
      showToast(`WAVファイルを書き出しました (${fileName})`, "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "WAVの書き出しに失敗しました。";
      showToast(errMsg, "error");
    } finally {
      setIsExportingWav(false);
    }
  };

  // MIDI エクスポート処理
  const handleExportMidi = () => {
    setIsOpen(false);

    try {
      const blob = renderPatternToMidiBlob({
        pattern,
        trackLengths,
        bpm,
        bars,
        timeSignature,
      });

      const fileName = generateExportFileName("mid", {
        timeSignature,
        bpm,
        bars,
      });
      downloadBlob(blob, fileName);
      showToast(`MIDIファイルを書き出しました (${fileName})`, "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "MIDIの書き出しに失敗しました。";
      showToast(errMsg, "error");
    }
  };

  return (
    <div className="relative inline-block shrink-0" ref={menuRef}>
      {/* エクスポートトリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isExportingWav}
        className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border shrink-0 ${
          isExportingWav
            ? "bg-zinc-800 text-zinc-400 border-zinc-700 cursor-wait"
            : isOpen
            ? "bg-amber-400 text-zinc-950 border-amber-300 shadow-md"
            : "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white"
        }`}
        title="作成したパターンをWAVやMIDIファイルとして書き出す"
        aria-label="エクスポートメニューを開く"
        aria-expanded={isOpen}
      >
        {isExportingWav ? (
          <span className="w-3 h-3 border-2 border-zinc-500 border-t-amber-400 rounded-full animate-spin inline-block shrink-0" />
        ) : (
          <svg
            className="w-3.5 h-3.5 text-amber-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        <span className="text-[11px] sm:text-xs whitespace-nowrap">
          {isExportingWav ? "レンダリング中..." : "書き出し"}
        </span>
        <span className="text-[9px] text-zinc-400 shrink-0">▼</span>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-950 border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider border-b border-zinc-800 mb-1 flex items-center justify-between">
            <span>ファイル形式を選択</span>
            <span className="text-[9px] text-amber-400/90 font-mono">
              {timeSignature} · {bpm}BPM
            </span>
          </div>

          {/* WAV エクスポート */}
          <button
            type="button"
            onClick={handleExportWav}
            disabled={isExportingWav}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start gap-2.5 hover:bg-zinc-800/80 cursor-pointer group"
          >
            <div className="p-1 rounded bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-zinc-950 transition-colors mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-100 group-hover:text-white flex items-center gap-1.5">
                WAV オーディオ (.wav)
                <span className="text-[9px] px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded">高音質</span>
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                44.1kHz / 16-bit ステレオ波形。余韻を含めて高速レンダリング
              </span>
            </div>
          </button>

          {/* MIDI エクスポート */}
          <button
            type="button"
            onClick={handleExportMidi}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start gap-2.5 hover:bg-zinc-800/80 cursor-pointer group mt-0.5"
          >
            <div className="p-1 rounded bg-sky-400/10 text-sky-400 group-hover:bg-sky-400 group-hover:text-zinc-950 transition-colors mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-100 group-hover:text-white flex items-center gap-1.5">
                MIDI ファイル (.mid)
                <span className="text-[9px] px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded">DAW用</span>
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                GM ドラム規格（Ch 10）。Logic、Ableton、Studio One等で即利用可能
              </span>
            </div>
          </button>
        </div>
      )}

      {/* フローティングトースト通知 */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 border animate-in slide-in-from-bottom-2 duration-150 ${
            toastType === "success"
              ? "bg-zinc-900 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10"
              : "bg-zinc-900 text-rose-300 border-rose-500/50 shadow-rose-500/10"
          }`}
          role="status"
          aria-live="polite"
        >
          <span>{toastType === "success" ? "✓" : "⚠"}</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

