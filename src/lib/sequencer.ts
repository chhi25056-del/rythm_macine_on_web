/**
 * 16ステップシーケンサーの状態更新を行う純粋関数群
 */

export type TrackId = "kick" | "snare" | "hihatClosed" | "hihatOpen";

export interface TrackInfo {
  id: TrackId;
  name: string;
  shortName: string;
}

export const TRACK_INFO: Record<TrackId, TrackInfo> = {
  kick: { id: "kick", name: "Kick", shortName: "KD" },
  snare: { id: "snare", name: "Snare", shortName: "SD" },
  hihatClosed: { id: "hihatClosed", name: "Closed HH", shortName: "CH" },
  hihatOpen: { id: "hihatOpen", name: "Open HH", shortName: "OH" },
};

export type Pattern = Record<TrackId, boolean[]>;

/**
 * すべてのステップがOFF（false）の空パターンを生成します
 */
export function createEmptyPattern(): Pattern {
  return {
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihatClosed: Array(16).fill(false),
    hihatOpen: Array(16).fill(false),
  };
}

/**
 * 初期状態の標準ビートパターン（4つ打ちキック、バックビートスネア、ハイハット）を生成します
 */
export function createDefaultPattern(): Pattern {
  const pattern = createEmptyPattern();
  [0, 4, 8, 12].forEach((i) => (pattern.kick[i] = true));
  [4, 12].forEach((i) => (pattern.snare[i] = true));
  [0, 2, 4, 6, 8, 10, 12, 14].forEach((i) => (pattern.hihatClosed[i] = true));
  [14].forEach((i) => (pattern.hihatOpen[i] = true));
  return pattern;
}

/**
 * 指定されたインデックスのステップ状態（true/false）を反転した新しい配列を返します（イミュータブル更新）
 * @param steps 元のステップ真偽値配列
 * @param index 反転対象のインデックス
 */
export function toggleStepAt(steps: boolean[], index: number): boolean[] {
  return steps.map((val, i) => (i === index ? !val : val));
}

/**
 * パターン全体のなかで、特定トラックの特定ステップのみを反転した新しいパターンを返します（イミュータブル更新）
 * @param pattern 現在の全トラックパターン
 * @param trackId 反転対象の楽器ID
 * @param stepIndex 反転対象のステップインデックス
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
 * 現在のステップ番号から次のステップ番号を計算します。終端に達した場合は0に戻ります。
 * @param currentStep 現在のステップ番号（0-indexed）
 * @param totalSteps 1小節あたりの総ステップ数（デフォルト: 16）
 */
export function getNextStep(currentStep: number, totalSteps: number = 16): number {
  return (currentStep + 1) % totalSteps;
}



