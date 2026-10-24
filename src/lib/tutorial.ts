/**
 * ビートシーケンサー チュートリアルの定義と純粋関数
 */

export interface TutorialStepConfig {
  step: number;
  message: string;
  triggerName: "play" | "stepClick" | "bpmChange" | "trackLengthChange" | "quickFill";
  title?: string;
  targetId: string;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    step: 1,
    title: "音を鳴らす",
    message: "まずは再生ボタンを押して、リズムを聴いてみよう！",
    triggerName: "play",
    targetId: "tutorial-target-play",
  },
  {
    step: 2,
    title: "音を触る",
    message: "光っているマスをクリックして音を消したり、空いているマスを押して音を増やしてみよう！",
    triggerName: "stepClick",
    targetId: "tutorial-target-step",
  },
  {
    step: 3,
    title: "スピードを変える",
    message: "BPMスライダーを動かして、リズムのスピードを変えてみよう！",
    triggerName: "bpmChange",
    targetId: "tutorial-target-bpm",
  },
  {
    step: 4,
    title: "一気にリズムを作る",
    message: "クイックフィルを使ってみよう！ボタン一つで指定したリズムパターンを一括で打ち込めるよ！",
    triggerName: "quickFill",
    targetId: "tutorial-target-fill",
  },
  {
    step: 5,
    title: "変拍子を体感する",
    message: "ハイハットのステップ数を『16』から『7』に減らしてみよう！リズムがズレて不思議なグルーヴが生まれるよ！",
    triggerName: "trackLengthChange",
    targetId: "tutorial-target-length",
  },
];

export const TOTAL_TUTORIAL_STEPS = TUTORIAL_STEPS.length;

/**
 * 指定したトリガー条件を満たしたときに次のステップ番号を計算します。
 * 最後のステップを完了した場合は null を返します。
 *
 * @param currentStep 現在のチュートリアルステップ (null の場合は進行しない)
 * @param triggeredStep 発火したアクションに対応するステップ番号
 * @param totalSteps 総ステップ数（デフォルト: TOTAL_TUTORIAL_STEPS）
 */
export function calculateNextTutorialStep(
  currentStep: number | null,
  triggeredStep: number,
  totalSteps: number = TOTAL_TUTORIAL_STEPS
): number | null {
  if (currentStep === null || currentStep !== triggeredStep) {
    return currentStep;
  }
  if (currentStep >= totalSteps) {
    return null;
  }
  return currentStep + 1;
}

/**
 * 強制的に次のステップへ進める計算を行います（デバッグ用）
 */
export function forceNextTutorialStep(
  currentStep: number | null,
  totalSteps: number = TOTAL_TUTORIAL_STEPS
): number | null {
  if (currentStep === null) return null;
  if (currentStep >= totalSteps) return null;
  return currentStep + 1;
}
