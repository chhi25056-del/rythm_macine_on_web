/**
 * WAV ファイルエクスポートユーティリティ
 * OfflineAudioContext でパターンをオフライン高速レンダリングし、
 * 16-bit PCM RIFF WAVE フォーマットとして書き出します。
 */

import {
  type Pattern,
  type TrackLengths,
  type TimeSignature,
  type MeasureCount,
  type TrackId,
  type BuiltinTrackId,
  TIME_SIGNATURE_CONFIGS,
  shouldTriggerTrack,
  CUSTOM_TRACK_IDS,
  type CustomTrackId,
} from "./sequencer";
import { createNoiseBuffer, playBuiltinTrack } from "./synthAudio";
import { type CustomSampleState } from "./customAudio";

export interface RenderWavOptions {
  pattern: Pattern;
  trackLengths: TrackLengths;
  bpm: number;
  bars: MeasureCount;
  timeSignature: TimeSignature;
  customSamples?: Record<CustomTrackId, CustomSampleState>;
  sampleRate?: number;
  tailSeconds?: number;
}

/**
 * AudioBuffer から 16-bit PCM WAV (RIFF WAVE) の Blob を生成します
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 2; // ステレオ出力
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF ヘッダ書き込みヘルパー
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. "RIFF" chunk descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // ファイル全体のサイズ - 8
  writeString(8, "WAVE");

  // 2. "fmt " sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // サブチャンク1のサイズ (PCM は 16)
  view.setUint16(20, 1, true); // オーディオフォーマット: 1 = PCM
  view.setUint16(22, numChannels, true); // チャンネル数
  view.setUint32(24, sampleRate, true); // サンプリングレート
  view.setUint32(28, byteRate, true); // バイトレート
  view.setUint16(32, blockAlign, true); // ブロックアライン
  view.setUint16(34, 16, true); // ビット深度 (16-bit)

  // 3. "data" sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true); // データサイズ

  // チャンネルデータの取得
  const leftChannel = buffer.numberOfChannels > 0 ? buffer.getChannelData(0) : new Float32Array(numFrames);
  const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;

  // 16-bit PCM サンプル値のインターリーブ書き込み (-32768 〜 32767 にクリッピング)
  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    // 左チャンネル
    const lSample = Math.max(-1, Math.min(1, leftChannel[i]));
    const lInt = lSample < 0 ? lSample * 0x8000 : lSample * 0x7fff;
    view.setInt16(offset, Math.floor(lInt), true);
    offset += 2;

    // 右チャンネル
    const rSample = Math.max(-1, Math.min(1, rightChannel[i]));
    const rInt = rSample < 0 ? rSample * 0x8000 : rSample * 0x7fff;
    view.setInt16(offset, Math.floor(rInt), true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * リズムパターンを OfflineAudioContext 上で高速レンダリングし、WAV Blob を返します
 */
export async function renderPatternToWavBlob(options: RenderWavOptions): Promise<Blob> {
  const {
    pattern,
    trackLengths,
    bpm,
    bars,
    timeSignature,
    customSamples,
    sampleRate = 44100,
    tailSeconds = 1.5,
  } = options;

  const stepsPerBar = TIME_SIGNATURE_CONFIGS[timeSignature].stepsPerBar;
  const totalSteps = bars * stepsPerBar;
  // 1ステップあたりの秒数 (15 / bpm)
  const stepDuration = 15 / bpm;
  const patternDuration = totalSteps * stepDuration;
  const totalDuration = patternDuration + tailSeconds;
  const totalFrames = Math.max(1, Math.ceil(totalDuration * sampleRate));

  // OfflineAudioContext を生成
  const OfflineCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  if (!OfflineCtxClass) {
    throw new Error("お使いのブラウザは OfflineAudioContext に対応していません。");
  }

  const offlineCtx = new OfflineCtxClass(2, totalFrames, sampleRate);
  const noiseBuffer = createNoiseBuffer(offlineCtx, Math.max(2, totalDuration));

  // 全ステップのノートをスケジュール
  for (let step = 0; step < totalSteps; step++) {
    const time = step * stepDuration;

    // 内蔵トラック
    (Object.keys(pattern) as TrackId[]).forEach((trackId) => {
      const len = trackLengths[trackId] ?? stepsPerBar;
      if (shouldTriggerTrack(pattern, trackId, step, len)) {
        if (CUSTOM_TRACK_IDS.includes(trackId as CustomTrackId)) {
          // カスタムトラック
          const sample = customSamples?.[trackId as CustomTrackId];
          if (sample?.buffer) {
            const source = offlineCtx.createBufferSource();
            source.buffer = sample.buffer;
            const gainNode = offlineCtx.createGain();
            gainNode.gain.setValueAtTime(0.7, time);
            source.connect(gainNode);
            gainNode.connect(offlineCtx.destination);
            source.start(time);
          }
        } else {
          // 内蔵打楽器
          playBuiltinTrack(
            trackId as BuiltinTrackId,
            offlineCtx,
            time,
            noiseBuffer,
            offlineCtx.destination
          );
        }
      }
    });
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

/**
 * Blob を指定ファイル名でブラウザ保存（ダウンロード）します
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * エクスポート時のファイル名を生成します
 */
export function generateExportFileName(
  extension: "wav" | "mid",
  meta: { timeSignature: TimeSignature; bpm: number; bars: MeasureCount }
): string {
  const safeTimeSig = meta.timeSignature.replace("/", "_");
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return `rhythm-${safeTimeSig}-${meta.bpm}bpm-${meta.bars}bars-${timestamp}.${extension}`;
}

