/**
 * MIDI ファイルエクスポートユーティリティ
 * Standard MIDI File (SMF 1.0 Format 0) バイナリを生成し、
 * General MIDI (Channel 10) ドラムトラックとして書き出します。
 */

import {
  type Pattern,
  type TrackLengths,
  type TimeSignature,
  type MeasureCount,
  type TrackId,
  TIME_SIGNATURE_CONFIGS,
  shouldTriggerTrack,
} from "./sequencer";

export const TICKS_PER_BEAT = 480; // PPQ (Pulse Per Quarter Note)
export const TICKS_PER_STEP = 120; // 16分音符 = 480 / 4 = 120 ticks
export const NOTE_DURATION_TICKS = 60; // ピアノロール視認用の発音長（半ステップ）

/**
 * General MIDI (GM) ドラム規格ノート番号マッピング (Channel 10)
 */
export const MIDI_DRUM_MAP: Record<TrackId, number> = {
  kick: 36, // Bass Drum 1
  snare: 38, // Acoustic Snare
  hihatClosed: 42, // Closed Hi-Hat
  hihatOpen: 46, // Open Hi-Hat
  lowTom: 45, // Low Tom
  hiTom: 50, // High Tom
  crash: 49, // Crash Cymbal 1
  custom1: 39, // Hand Clap
  custom2: 56, // Cowbell
  custom3: 54, // Tambourine
  custom4: 75, // Claves
};

export interface RenderMidiOptions {
  pattern: Pattern;
  trackLengths: TrackLengths;
  bpm: number;
  bars: MeasureCount;
  timeSignature: TimeSignature;
}

/**
 * 数値を可変長数値（Variable-Length Quantity: VLQ）にエンコードします
 */
export function encodeVlq(value: number): number[] {
  let v = Math.floor(Math.max(0, value));
  const bytes: number[] = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

interface MidiEvent {
  tick: number;
  priority: number; // 同一 tick 内の並び順（Note Off = 0, Note On = 1）
  bytes: number[];
}

/**
 * リズムパターンから Standard MIDI File (Format 0) の Uint8Array を生成します
 */
export function generateMidiFile(options: RenderMidiOptions): Uint8Array {
  const { pattern, trackLengths, bpm, bars, timeSignature } = options;

  const stepsPerBar = TIME_SIGNATURE_CONFIGS[timeSignature].stepsPerBar;
  const totalSteps = bars * stepsPerBar;
  const totalTicks = totalSteps * TICKS_PER_STEP;

  const events: MidiEvent[] = [];

  // 1. 各ステップの Note On / Note Off イベントを収集
  for (let step = 0; step < totalSteps; step++) {
    const startTick = step * TICKS_PER_STEP;
    const endTick = Math.min(totalTicks, startTick + NOTE_DURATION_TICKS);

    (Object.keys(pattern) as TrackId[]).forEach((trackId) => {
      const len = trackLengths[trackId] ?? stepsPerBar;
      if (shouldTriggerTrack(pattern, trackId, step, len)) {
        const noteNumber = MIDI_DRUM_MAP[trackId] ?? 36;
        // Channel 10: 0x99 (Note On), 0x89 (Note Off)
        events.push({
          tick: startTick,
          priority: 1, // Note On
          bytes: [0x99, noteNumber, 100], // Velocity 100
        });
        events.push({
          tick: endTick,
          priority: 0, // Note Off
          bytes: [0x89, noteNumber, 0],
        });
      }
    });
  }

  // tick 順（同じ tick では Note Off を先）にソート
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.priority - b.priority;
  });

  // 2. トラックデータバイナリの構築
  const trackBytes: number[] = [];

  // トラック名メタイベント: FF 03 len "Rythm Machine Beat"
  const trackName = "Rythm Machine Beat";
  trackBytes.push(0x00, 0xff, 0x03, trackName.length);
  for (let i = 0; i < trackName.length; i++) {
    trackBytes.push(trackName.charCodeAt(i));
  }

  // テンポ設定メタイベント: FF 51 03 tt tt tt (microseconds per quarter note)
  const mpqn = Math.round(60_000_000 / Math.max(20, Math.min(300, bpm)));
  trackBytes.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (mpqn >> 16) & 0xff,
    (mpqn >> 8) & 0xff,
    mpqn & 0xff
  );

  // 拍子記号メタイベント: FF 58 04 nn dd cc bb
  let num = 4;
  let denExp = 2; // 2^2 = 4 (4分音符)
  if (timeSignature === "3/4") {
    num = 3;
    denExp = 2;
  } else if (timeSignature === "5/4") {
    num = 5;
    denExp = 2;
  } else if (timeSignature === "6/8") {
    num = 6;
    denExp = 3; // 2^3 = 8 (8分音符)
  } else if (timeSignature === "7/8") {
    num = 7;
    denExp = 3;
  }
  trackBytes.push(0x00, 0xff, 0x58, 0x04, num, denExp, 24, 8);

  // イベントをデルタタイムを付与しながら書き込み
  let currentTick = 0;
  for (const ev of events) {
    const delta = ev.tick - currentTick;
    trackBytes.push(...encodeVlq(delta));
    trackBytes.push(...ev.bytes);
    currentTick = ev.tick;
  }

  // End of Track までのデルタタイム（ループ全体の終端まで揃える）
  const remainingDelta = Math.max(0, totalTicks - currentTick);
  trackBytes.push(...encodeVlq(remainingDelta));
  trackBytes.push(0xff, 0x2f, 0x00); // End of Track

  // 3. SMF Header Chunk ("MThd") + Track Chunk ("MTrk")
  const headerBytes = [
    // "MThd"
    0x4d, 0x54, 0x68, 0x64,
    // Header length: 6
    0x00, 0x00, 0x00, 0x06,
    // Format: 0 (単一トラック)
    0x00, 0x00,
    // Number of tracks: 1
    0x00, 0x01,
    // Division: 480 PPQ (0x01E0)
    (TICKS_PER_BEAT >> 8) & 0xff,
    TICKS_PER_BEAT & 0xff,
  ];

  const trackHeaderBytes = [
    // "MTrk"
    0x4d, 0x54, 0x72, 0x6b,
    // Track length (big-endian 32-bit)
    (trackBytes.length >> 24) & 0xff,
    (trackBytes.length >> 16) & 0xff,
    (trackBytes.length >> 8) & 0xff,
    trackBytes.length & 0xff,
  ];

  const totalLength = headerBytes.length + trackHeaderBytes.length + trackBytes.length;
  const result = new Uint8Array(totalLength);
  result.set(headerBytes, 0);
  result.set(trackHeaderBytes, headerBytes.length);
  result.set(trackBytes, headerBytes.length + trackHeaderBytes.length);

  return result;
}

/**
 * リズムパターンから MIDI Blob を生成します
 */
export function renderPatternToMidiBlob(options: RenderMidiOptions): Blob {
  const bytes = generateMidiFile(options);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" });
}

