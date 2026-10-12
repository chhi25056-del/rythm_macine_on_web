/**
 * 拍子・ステップシーケンサーの状態更新を行う純粋関数群
 */

export type TrackId =
  | "crash"
  | "hihatOpen"
  | "hihatClosed"
  | "hiTom"
  | "lowTom"
  | "snare"
  | "kick";

export type MeasureCount = 1 | 2 | 4;

export type TimeSignature = "4/4" | "3/4" | "5/4" | "6/8" | "7/8";

export interface TimeSignatureConfig {
  id: TimeSignature;
  name: string;
  description: string;
  stepsPerBar: number;
  groups: number[]; // 各拍グループのステップ数
}

export const TIME_SIGNATURE_CONFIGS: Record<TimeSignature, TimeSignatureConfig> = {
  "4/4": {
    id: "4/4",
    name: "4/4",
    description: "4拍子 (16ステップ)",
    stepsPerBar: 16,
    groups: [4, 4, 4, 4],
  },
  "3/4": {
    id: "3/4",
    name: "3/4",
    description: "3拍子・ワルツ (12ステップ)",
    stepsPerBar: 12,
    groups: [4, 4, 4],
  },
  "5/4": {
    id: "5/4",
    name: "5/4",
    description: "5拍子 (20ステップ)",
    stepsPerBar: 20,
    groups: [4, 4, 4, 4, 4],
  },
  "6/8": {
    id: "6/8",
    name: "6/8",
    description: "6/8拍子・複合2拍子 (12ステップ)",
    stepsPerBar: 12,
    groups: [6, 6],
  },
  "7/8": {
    id: "7/8",
    name: "7/8",
    description: "7/8拍子・変拍子 (14ステップ)",
    stepsPerBar: 14,
    groups: [4, 4, 6],
  },
};

export const MAX_STEPS = 80; // 5/4拍子 × 4小節 = 80ステップ

export interface TrackInfo {
  id: TrackId;
  name: string;
  shortName: string;
}

export const TRACK_INFO: Record<TrackId, TrackInfo> = {
  crash: { id: "crash", name: "Crash", shortName: "CR" },
  hihatOpen: { id: "hihatOpen", name: "Open HH", shortName: "OH" },
  hihatClosed: { id: "hihatClosed", name: "Closed HH", shortName: "CH" },
  hiTom: { id: "hiTom", name: "Hi Tom", shortName: "HT" },
  lowTom: { id: "lowTom", name: "Low Tom", shortName: "LT" },
  snare: { id: "snare", name: "Snare", shortName: "SD" },
  kick: { id: "kick", name: "Kick", shortName: "KD" },
};

export const MIN_TRACK_LENGTH = 1;
export const MAX_TRACK_LENGTH = 32;
export const DEFAULT_TRACK_LENGTH = 16;

export type TrackLengths = Record<TrackId, number>;

/**
 * トラックごとのステップ長を初期化します
 * @param defaultLength 各トラックの初期ステップ数（デフォルト: 16）
 */
export function createDefaultTrackLengths(
  defaultLength: number = DEFAULT_TRACK_LENGTH
): TrackLengths {
  return {
    crash: defaultLength,
    hihatOpen: defaultLength,
    hihatClosed: defaultLength,
    hiTom: defaultLength,
    lowTom: defaultLength,
    snare: defaultLength,
    kick: defaultLength,
  };
}

/**
 * グローバルステップ番号とトラックのステップ長から、該当トラックの演奏ステップインデックス（0〜length-1）を算出します
 */
export function getTrackStepIndex(
  globalStep: number,
  trackLength: number
): number {
  if (trackLength <= 0) return 0;
  return ((globalStep % trackLength) + trackLength) % trackLength;
}

/**
 * 指定したステップ番号がトラックの有効ステップ範囲内（0〜length-1）かどうかを判定します
 */
export function isStepActiveForTrack(
  stepIndex: number,
  trackLength: number
): boolean {
  return stepIndex >= 0 && stepIndex < trackLength;
}

/**
 * ポリメーター計算に基づき、該当トラックが発音されるべきかどうかを判定します
 */
export function shouldTriggerTrack(
  pattern: Pattern,
  trackId: TrackId,
  globalStep: number,
  trackLength: number
): boolean {
  const stepIdx = getTrackStepIndex(globalStep, trackLength);
  return Boolean(pattern[trackId]?.[stepIdx]);
}

export type Pattern = Record<TrackId, boolean[]>;

/**
 * すべてのステップがOFF（false）の空パターンを生成します
 * @param totalSteps 総ステップ数（デフォルト: MAX_STEPS）
 */
export function createEmptyPattern(totalSteps: number = MAX_STEPS): Pattern {
  return {
    crash: Array(totalSteps).fill(false),
    hihatOpen: Array(totalSteps).fill(false),
    hihatClosed: Array(totalSteps).fill(false),
    hiTom: Array(totalSteps).fill(false),
    lowTom: Array(totalSteps).fill(false),
    snare: Array(totalSteps).fill(false),
    kick: Array(totalSteps).fill(false),
  };
}

/**
 * 拍子ごとの特徴的な初期ビートパターンを生成します
 */
export function createDefaultPattern(
  timeSig: TimeSignature = "4/4",
  totalSteps: number = MAX_STEPS
): Pattern {
  const pattern = createEmptyPattern(totalSteps);
  const stepsPerBar = TIME_SIGNATURE_CONFIGS[timeSig].stepsPerBar;

  if (timeSig === "4/4") {
    // 4/4拍子: 基本4つ打ち・スネア・ハット
    [0, 4, 8, 12].forEach((i) => i < totalSteps && (pattern.kick[i] = true));
    [4, 12].forEach((i) => i < totalSteps && (pattern.snare[i] = true));
    [0, 2, 4, 6, 8, 10, 12, 14].forEach((i) => i < totalSteps && (pattern.hihatClosed[i] = true));
    if (14 < totalSteps) pattern.hihatOpen[14] = true;

    // 2小節目
    if (totalSteps >= 32) {
      [16, 20, 24, 28].forEach((i) => (pattern.kick[i] = true));
      [20].forEach((i) => (pattern.snare[i] = true));
      [16, 18, 20, 22, 24, 26].forEach((i) => (pattern.hihatClosed[i] = true));
      pattern.hiTom[28] = true;
      pattern.hiTom[29] = true;
      pattern.lowTom[30] = true;
      pattern.lowTom[31] = true;
    }
    // 3小節目
    if (totalSteps >= 48) {
      pattern.crash[32] = true;
      [32, 36, 40, 44].forEach((i) => (pattern.kick[i] = true));
      [36, 44].forEach((i) => (pattern.snare[i] = true));
      [32, 34, 36, 38, 40, 42, 44, 46].forEach((i) => (pattern.hihatClosed[i] = true));
      pattern.hihatOpen[46] = true;
    }
  } else if (timeSig === "3/4") {
    // 3/4拍子 (12ステップ): ワルツ・3拍子
    for (let bar = 0; bar < 4; bar++) {
      const offset = bar * stepsPerBar;
      if (offset >= totalSteps) break;
      pattern.kick[offset] = true; // 1拍目キック
      if (offset + 4 < totalSteps) pattern.snare[offset + 4] = true; // 2拍目スネア
      if (offset + 8 < totalSteps) pattern.snare[offset + 8] = true; // 3拍目スネア
      [0, 2, 4, 6, 8, 10].forEach((s) => {
        if (offset + s < totalSteps) pattern.hihatClosed[offset + s] = true;
      });
      if (offset + 10 < totalSteps && bar === 1) pattern.hihatOpen[offset + 10] = true;
    }
  } else if (timeSig === "5/4") {
    // 5/4拍子 (20ステップ): 3+2または5拍子グルーヴ
    for (let bar = 0; bar < 4; bar++) {
      const offset = bar * stepsPerBar;
      if (offset >= totalSteps) break;
      if (bar === 0) pattern.crash[offset] = true;
      pattern.kick[offset] = true; // 1拍目
      if (offset + 6 < totalSteps) pattern.kick[offset + 6] = true; // 2拍目裏
      if (offset + 8 < totalSteps) pattern.snare[offset + 8] = true; // 3拍目
      if (offset + 12 < totalSteps) pattern.kick[offset + 12] = true; // 4拍目
      if (offset + 16 < totalSteps) pattern.snare[offset + 16] = true; // 5拍目
      [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].forEach((s) => {
        if (offset + s < totalSteps) pattern.hihatClosed[offset + s] = true;
      });
    }
  } else if (timeSig === "6/8") {
    // 6/8拍子 (12ステップ): 複合2拍子（付点4分音符 × 2）
    for (let bar = 0; bar < 4; bar++) {
      const offset = bar * stepsPerBar;
      if (offset >= totalSteps) break;
      if (bar === 0) pattern.crash[offset] = true;
      pattern.kick[offset] = true; // 1大拍目
      if (offset + 6 < totalSteps) pattern.snare[offset + 6] = true; // 2大拍目
      [0, 2, 4, 6, 8, 10].forEach((s) => {
        if (offset + s < totalSteps) pattern.hihatClosed[offset + s] = true;
      });
      if (bar === 1 && offset + 10 < totalSteps) {
        pattern.hiTom[offset + 8] = true;
        pattern.lowTom[offset + 10] = true;
      }
    }
  } else if (timeSig === "7/8") {
    // 7/8拍子 (14ステップ): 2+2+3変拍子
    for (let bar = 0; bar < 4; bar++) {
      const offset = bar * stepsPerBar;
      if (offset >= totalSteps) break;
      if (bar === 0) pattern.crash[offset] = true;
      pattern.kick[offset] = true; // 1拍目 (step 0)
      if (offset + 4 < totalSteps) pattern.kick[offset + 4] = true; // 2拍目 (step 4)
      if (offset + 8 < totalSteps) pattern.snare[offset + 8] = true; // 3拍目 (step 8)
      [0, 2, 4, 6, 8, 10, 12].forEach((s) => {
        if (offset + s < totalSteps) pattern.hihatClosed[offset + s] = true;
      });
      if (offset + 12 < totalSteps) pattern.hihatOpen[offset + 12] = true;
    }
  }

  return pattern;
}

/**
 * 指定されたインデックスのステップ状態（true/false）を反転した新しい配列を返します
 */
export function toggleStepAt(steps: boolean[], index: number): boolean[] {
  return steps.map((val, i) => (i === index ? !val : val));
}

/**
 * パターン全体のなかで、特定トラックの特定ステップのみを反転した新しいパターンを返します
 */
export function togglePatternStep(
  pattern: Pattern,
  trackId: TrackId,
  stepIndex: number
): Pattern {
  return {
    ...pattern,
    [trackId]: toggleStepAt(pattern[trackId], stepIndex),
  };
}

/**
 * 特定の小節のパターンを別の小節にコピーします
 */
export function copyBarPattern(
  pattern: Pattern,
  fromBar: number,
  toBar: number,
  stepsPerBar: number = 16
): Pattern {
  if (fromBar === toBar) return pattern;
  const newPattern = { ...pattern };
  const fromStart = fromBar * stepsPerBar;
  const toStart = toBar * stepsPerBar;

  (Object.keys(pattern) as TrackId[]).forEach((trackId) => {
    const trackSteps = [...pattern[trackId]];
    for (let i = 0; i < stepsPerBar; i++) {
      if (toStart + i < trackSteps.length && fromStart + i < trackSteps.length) {
        trackSteps[toStart + i] = trackSteps[fromStart + i];
      }
    }
    newPattern[trackId] = trackSteps;
  });

  return newPattern;
}

/**
 * 現在のステップ番号から次のステップ番号を計算します。終端に達した場合は0に戻ります。
 */
export function getNextStep(currentStep: number, totalSteps: number = 16): number {
  return (currentStep + 1) % totalSteps;
}
