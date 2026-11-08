/**
 * ユーザーアップロード音声（カスタムサンプル）のデコードと再生ユーティリティ
 */

export interface CustomSampleState {
  buffer: AudioBuffer | null;
  fileName: string | null;
  displayName: string;
}

export const MAX_AUDIO_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * ファイルが有効な音声ファイルかどうかを検証します
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "ファイルサイズが10MBを超えています。より短いワンショット音声を選択してください。",
    };
  }

  // mime type または拡張子のチェック
  const validExtensions = [".wav", ".mp3", ".ogg", ".m4a", ".aac", ".webm", ".flac"];
  const fileNameLower = file.name.toLowerCase();
  const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

  if (!file.type.startsWith("audio/") && !hasValidExt) {
    return {
      valid: false,
      error: "対応している音声ファイル形式（WAV, MP3, OGG, M4A等）を選択してください。",
    };
  }

  return { valid: true };
}

/**
 * 音声ファイルを ArrayBuffer 経由で AudioBuffer にデコードします
 */
export async function decodeAudioFile(file: File, ctx: AudioContext): Promise<AudioBuffer> {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const arrayBuffer = await file.arrayBuffer();

  // Safari等の古いコールバック形式と現代のPromise形式の両方に対応
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(
      arrayBuffer.slice(0),
      (buffer) => resolve(buffer),
      (err) => reject(new Error(err ? String(err) : "音声データのデコードに失敗しました。"))
    );
  });
}

/**
 * 前回の再生音源を停止し、重複再生による音量倍増を防ぎます
 */
export function stopPreviousAudioBuffer(
  source: AudioBufferSourceNode | null,
  time?: number
): void {
  if (!source) return;
  try {
    if (typeof time === "number") {
      source.stop(time);
    } else {
      source.stop();
    }
    source.disconnect();
  } catch {
    // 既に停止している場合は安全に無視
  }
}

/**
 * AudioBuffer を指定時刻（time）で再生します。
 * 前回の source を渡すことで、前の音を停止して音が重なって音量が大きくなる現象を防止します。
 */
export function playAudioBuffer(
  buffer: AudioBuffer,
  ctx: AudioContext,
  time: number = ctx.currentTime,
  gainLevel: number = 0.7,
  previousSource?: AudioBufferSourceNode | null
): AudioBufferSourceNode {
  // 前のプレビュー音声が残っていれば即座に停止して音量増幅を防止
  if (previousSource) {
    stopPreviousAudioBuffer(previousSource, time);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  // 他のドラム音色と揃えた適正音量にリミット
  gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.5, gainLevel)), time);

  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(time);
  return source;
}

/**
 * ファイル名から拡張子を取り除き、表示用の短縮名を作成します
 */
export function formatSampleName(fileName: string, maxLength: number = 10): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  if (nameWithoutExt.length <= maxLength) {
    return nameWithoutExt;
  }
  return nameWithoutExt.slice(0, maxLength) + "…";
}
