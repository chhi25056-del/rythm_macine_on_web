"use client";

import { useRef, useState } from "react";
import {
  decodeAudioFile,
  playAudioBuffer,
  formatSampleName,
  type CustomSampleState,
} from "@/lib/customAudio";

interface CustomTrackControlProps {
  customSample: CustomSampleState;
  onSampleLoaded: (state: CustomSampleState) => void;
  onSampleCleared: () => void;
  onDeleteTrack?: () => void;
  getAudioContext: () => AudioContext;
  trackLabel?: string;
  badgeColor?: string;
  borderColor?: string;
}

export function CustomTrackControl({
  customSample,
  onSampleLoaded,
  onSampleCleared,
  onDeleteTrack,
  getAudioContext,
  trackLabel = "Custom",
  badgeColor = "text-fuchsia-300",
  borderColor = "border-fuchsia-500/50",
}: CustomTrackControlProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const ctx = getAudioContext();
      const buffer = await decodeAudioFile(file, ctx);

      const displayName = formatSampleName(file.name, 8);
      const newState: CustomSampleState = {
        buffer,
        fileName: file.name,
        displayName,
      };

      onSampleLoaded(newState);

      // アップロード成功時にワンショットをプレビュー試聴（音量増幅防止）
      previewSourceRef.current = playAudioBuffer(
        buffer,
        ctx,
        ctx.currentTime,
        0.7,
        previewSourceRef.current
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "音声の読み込みに失敗しました";
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePreview = () => {
    if (!customSample.buffer) return;
    const ctx = getAudioContext();
    previewSourceRef.current = playAudioBuffer(
      customSample.buffer,
      ctx,
      ctx.currentTime,
      0.7,
      previewSourceRef.current
    );
  };

  return (
    <div
      className="flex items-center gap-1"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm,.aac,.flac"
        className="hidden"
      />

      {customSample.buffer ? (
        <div className={`flex items-center gap-1 bg-zinc-950/90 border ${borderColor} rounded-md px-1.5 py-0.5 shadow-sm min-w-0`}>
          {/* プレビュー再生ボタン */}
          <button
            type="button"
            onClick={handlePreview}
            className="w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center text-[8px] transition-colors cursor-pointer shrink-0"
            title="音声を試聴"
            aria-label="音声を試聴"
          >
            ▶
          </button>

          {/* ファイル名 */}
          <span
            className={`font-bold text-[10px] ${badgeColor} max-w-[42px] sm:max-w-[60px] truncate`}
            title={`カスタム音声: ${customSample.fileName}`}
          >
            {customSample.displayName}
          </span>

          {/* 音声差し替えボタン */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[9px] text-zinc-400 hover:text-white hover:underline cursor-pointer px-0.5"
            title="別の音声ファイルに変更"
          >
            変更
          </button>

          {/* 音声クリアボタン */}
          <button
            type="button"
            onClick={onSampleCleared}
            className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer px-0.5"
            title="音声を外す"
            aria-label="音声を外す"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`px-1.5 py-0.5 rounded-md border border-dashed ${borderColor} bg-zinc-950/40 hover:bg-zinc-800/60 ${badgeColor} text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none min-w-0`}
            title={`${trackLabel}: 音声ファイルを読み込み (WAV/MP3)`}
          >
            {isLoading ? (
              <span className="animate-spin text-[9px]">⏳</span>
            ) : (
              <span className="text-[10px]">📁</span>
            )}
            <span className="truncate max-w-[50px] sm:max-w-[70px]">
              {isLoading ? "読込中..." : trackLabel}
            </span>
          </button>
        </div>
      )}

      {/* トラック自体の削除ボタン */}
      {onDeleteTrack && (
        <button
          type="button"
          onClick={onDeleteTrack}
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-rose-300 hover:bg-rose-950/80 border border-zinc-800/60 hover:border-rose-700/60 transition-all cursor-pointer font-bold shrink-0 text-xs"
          title={`${trackLabel} を削除`}
          aria-label={`${trackLabel} を削除`}
        >
          ✕
        </button>
      )}

      {errorMessage && (
        <div className="absolute left-0 bottom-full mb-1 z-50 bg-rose-950/95 border border-rose-500 text-rose-200 text-[10px] p-1.5 rounded shadow-xl animate-in fade-in duration-150 max-w-[200px]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
