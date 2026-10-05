/**
 * 16ステップシーケンサーの状態更新を行う純粋関数群
 */

export function toggleStepAt(steps: boolean[], index: number): boolean[] {
  return steps.map((val, i) => (i === index ? !val : val));
}

export function getNextStep(currentStep: number, totalSteps: number = 16): number {
  return (currentStep + 1) % totalSteps;
}

