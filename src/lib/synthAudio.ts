/**
 * 内蔵ドラムシンセサイザーの音声生成モジュール
 * AudioContext（リアルタイム再生）および OfflineAudioContext（WAV書き出し）の
 * 両方に対応するよう BaseAudioContext を受け取る設計になっています。
 */

import { BuiltinTrackId } from "./sequencer";

/**
 * ホワイトノイズ用 AudioBuffer を生成します
 */
export function createNoiseBuffer(
  ctx: BaseAudioContext,
  durationSeconds: number = 2
): AudioBuffer {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * バスドラム（Kick）の合成
 */
export function playKick(
  ctx: BaseAudioContext,
  time: number,
  destination: AudioNode = ctx.destination
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.15);
}

/**
 * スネアドラム（Snare）の合成
 */
export function playSnare(
  ctx: BaseAudioContext,
  time: number,
  noiseBuffer: AudioBuffer,
  destination: AudioNode = ctx.destination
): void {
  // トーン成分（三角波オシレーター）
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

  oscGain.gain.setValueAtTime(0.7, time);
  oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

  osc.connect(oscGain);
  oscGain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.1);

  // ノイズ・スナッピー成分（ハイパスフィルタを通したホワイトノイズ）
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(1200, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.18);
}

/**
 * クローズド・ハイハット（Closed Hi-Hat）の合成
 */
export function playClosedHiHat(
  ctx: BaseAudioContext,
  time: number,
  noiseBuffer: AudioBuffer,
  destination: AudioNode = ctx.destination
): void {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(7500, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.05);
}

/**
 * オープン・ハイハット（Open Hi-Hat）の合成
 */
export function playOpenHiHat(
  ctx: BaseAudioContext,
  time: number,
  noiseBuffer: AudioBuffer,
  destination: AudioNode = ctx.destination
): void {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(6500, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.35);
}

/**
 * ハイタム（Hi Tom）の合成
 */
export function playHiTom(
  ctx: BaseAudioContext,
  time: number,
  destination: AudioNode = ctx.destination
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(210, time);
  osc.frequency.exponentialRampToValueAtTime(90, time + 0.22);

  gain.gain.setValueAtTime(0.85, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

  osc.connect(gain);
  gain.connect(destination);
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
  clickGain.connect(destination);
  click.start(time);
  click.stop(time + 0.02);
}

/**
 * ロータム（Low Tom）の合成
 */
export function playLowTom(
  ctx: BaseAudioContext,
  time: number,
  destination: AudioNode = ctx.destination
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(65, time + 0.28);

  gain.gain.setValueAtTime(0.85, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

  osc.connect(gain);
  gain.connect(destination);
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
  clickGain.connect(destination);
  click.start(time);
  click.stop(time + 0.025);
}

/**
 * クラッシュシンバル（Crash）の合成
 */
export function playCrash(
  ctx: BaseAudioContext,
  time: number,
  noiseBuffer: AudioBuffer,
  destination: AudioNode = ctx.destination
): void {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(6200, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.005, time + 0.9);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.9);
}

/**
 * 内蔵トラックIDに応じた発音ディスパッチャー
 */
export function playBuiltinTrack(
  trackId: BuiltinTrackId,
  ctx: BaseAudioContext,
  time: number,
  noiseBuffer: AudioBuffer,
  destination: AudioNode = ctx.destination
): void {
  switch (trackId) {
    case "crash":
      playCrash(ctx, time, noiseBuffer, destination);
      break;
    case "hihatOpen":
      playOpenHiHat(ctx, time, noiseBuffer, destination);
      break;
    case "hihatClosed":
      playClosedHiHat(ctx, time, noiseBuffer, destination);
      break;
    case "hiTom":
      playHiTom(ctx, time, destination);
      break;
    case "lowTom":
      playLowTom(ctx, time, destination);
      break;
    case "snare":
      playSnare(ctx, time, noiseBuffer, destination);
      break;
    case "kick":
      playKick(ctx, time, destination);
      break;
  }
}

