import { describe, it, expect } from "vitest";
import {
  TUTORIAL_STEPS,
  TOTAL_TUTORIAL_STEPS,
  calculateNextTutorialStep,
  forceNextTutorialStep,
} from "./tutorial";

describe("tutorial logic", () => {
  it("should define 5 steps with correct messages, targets, and trigger names", () => {
    expect(TOTAL_TUTORIAL_STEPS).toBe(5);
    expect(TUTORIAL_STEPS[0]).toMatchObject({
      step: 1,
      title: "音を鳴らす",
      message: "まずは再生ボタンを押して、リズムを聴いてみよう！",
      triggerName: "play",
      targetId: "tutorial-target-play",
    });
    expect(TUTORIAL_STEPS[1]).toMatchObject({
      step: 2,
      title: "音を触る",
      message: "光っているマスをクリックして音を消したり、空いているマスを押して音を増やしてみよう！",
      triggerName: "stepClick",
      targetId: "tutorial-target-step",
    });
    expect(TUTORIAL_STEPS[2]).toMatchObject({
      step: 3,
      title: "スピードを変える",
      message: "BPMスライダーを動かして、リズムのスピードを変えてみよう！",
      triggerName: "bpmChange",
      targetId: "tutorial-target-bpm",
    });
    expect(TUTORIAL_STEPS[3]).toMatchObject({
      step: 4,
      title: "一気にリズムを作る",
      message: "クイックフィルを使ってみよう！ボタン一つで指定したリズムパターンを一括で打ち込めるよ！",
      triggerName: "quickFill",
      targetId: "tutorial-target-fill",
    });
    expect(TUTORIAL_STEPS[4]).toMatchObject({
      step: 5,
      title: "変拍子を体感する",
      message: "ハイハットのステップ数を『16』から『7』に減らしてみよう！リズムがズレて不思議なグルーヴが生まれるよ！",
      triggerName: "trackLengthChange",
      targetId: "tutorial-target-length",
    });
  });

  describe("calculateNextTutorialStep", () => {
    it("should advance from step 1 to 2 when trigger 1 fires", () => {
      expect(calculateNextTutorialStep(1, 1)).toBe(2);
    });

    it("should advance from step 2 to 3 when trigger 2 fires", () => {
      expect(calculateNextTutorialStep(2, 2)).toBe(3);
    });

    it("should advance from step 3 to 4 when trigger 3 fires", () => {
      expect(calculateNextTutorialStep(3, 3)).toBe(4);
    });

    it("should advance from step 4 to 5 when trigger 4 fires", () => {
      expect(calculateNextTutorialStep(4, 4)).toBe(5);
    });

    it("should return null (complete) when final step 5 trigger fires", () => {
      expect(calculateNextTutorialStep(5, 5)).toBe(null);
    });

    it("should not advance if trigger does not match current step", () => {
      expect(calculateNextTutorialStep(1, 2)).toBe(1);
      expect(calculateNextTutorialStep(2, 1)).toBe(2);
      expect(calculateNextTutorialStep(3, 4)).toBe(3);
      expect(calculateNextTutorialStep(5, 1)).toBe(5);
    });

    it("should keep null when current step is null", () => {
      expect(calculateNextTutorialStep(null, 1)).toBe(null);
    });
  });

  describe("forceNextTutorialStep", () => {
    it("should forcefully advance to next step or null when completed", () => {
      expect(forceNextTutorialStep(1)).toBe(2);
      expect(forceNextTutorialStep(2)).toBe(3);
      expect(forceNextTutorialStep(3)).toBe(4);
      expect(forceNextTutorialStep(4)).toBe(5);
      expect(forceNextTutorialStep(5)).toBe(null);
      expect(forceNextTutorialStep(null)).toBe(null);
    });
  });
});
