import { describe, it, expect } from "vitest";
import {
  PATTERN_TUTORIAL_CONFIGS,
  isPatternStepComplete,
  getRemainingTargetSteps,
  isStepHighlightedInTutorial,
  type PatternTutorialStep,
} from "./patternTutorial";
import { createEmptyPattern } from "./sequencer";

describe("patternTutorial", () => {
  it("should have all 3 tutorial patterns configured correctly", () => {
    expect(PATTERN_TUTORIAL_CONFIGS.fourOnTheFloor).toBeDefined();
    expect(PATTERN_TUTORIAL_CONFIGS.eightBeat).toBeDefined();
    expect(PATTERN_TUTORIAL_CONFIGS.sixteenBeat).toBeDefined();

    expect(PATTERN_TUTORIAL_CONFIGS.fourOnTheFloor.steps.length).toBe(4);
    expect(PATTERN_TUTORIAL_CONFIGS.eightBeat.steps.length).toBe(4);
    expect(PATTERN_TUTORIAL_CONFIGS.sixteenBeat.steps.length).toBe(4);

    // YouTube 楽曲サジェストの検証
    Object.values(PATTERN_TUTORIAL_CONFIGS).forEach((config) => {
      expect(config.suggestedTracks).toBeDefined();
      expect(config.suggestedTracks.length).toBeGreaterThanOrEqual(2);
      config.suggestedTracks.forEach((track) => {
        expect(track.title).toBeTruthy();
        expect(track.artist).toBeTruthy();
        expect(track.youtubeUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
        expect(track.comment).toBeTruthy();
      });
    });
  });

  describe("isPatternStepComplete", () => {
    it("should return false when target steps are not fully placed", () => {
      const pattern = createEmptyPattern(16);
      const stepConfig = PATTERN_TUTORIAL_CONFIGS.fourOnTheFloor.steps[0]; // Kick on 0, 4, 8, 12

      // 0 だけON
      pattern.kick[0] = true;
      expect(isPatternStepComplete(stepConfig, pattern, false)).toBe(false);

      // 0, 4, 8 だけON
      pattern.kick[4] = true;
      pattern.kick[8] = true;
      expect(isPatternStepComplete(stepConfig, pattern, false)).toBe(false);

      // すべてON
      pattern.kick[12] = true;
      expect(isPatternStepComplete(stepConfig, pattern, false)).toBe(true);
    });

    it("should complete play step when isPlaying is true", () => {
      const pattern = createEmptyPattern(16);
      const playStep = PATTERN_TUTORIAL_CONFIGS.fourOnTheFloor.steps[3]; // actionType: "play"

      expect(isPatternStepComplete(playStep, pattern, false)).toBe(false);
      expect(isPatternStepComplete(playStep, pattern, true)).toBe(true);
    });
  });

  describe("getRemainingTargetSteps", () => {
    it("should correctly return unfinished step indices", () => {
      const pattern = createEmptyPattern(16);
      const stepConfig: PatternTutorialStep = {
        step: 1,
        title: "Test",
        description: "Test desc",
        actionType: "placeSteps",
        trackId: "snare",
        targetSteps: [4, 12],
      };

      expect(getRemainingTargetSteps(stepConfig, pattern)).toEqual([4, 12]);

      pattern.snare[4] = true;
      expect(getRemainingTargetSteps(stepConfig, pattern)).toEqual([12]);

      pattern.snare[12] = true;
      expect(getRemainingTargetSteps(stepConfig, pattern)).toEqual([]);
    });
  });

  describe("isStepHighlightedInTutorial", () => {
    it("should highlight only matching track and target steps", () => {
      const stepConfig = PATTERN_TUTORIAL_CONFIGS.fourOnTheFloor.steps[0]; // kick: [0, 4, 8, 12]

      expect(isStepHighlightedInTutorial(stepConfig, "kick", 0)).toBe(true);
      expect(isStepHighlightedInTutorial(stepConfig, "kick", 1)).toBe(false);
      expect(isStepHighlightedInTutorial(stepConfig, "snare", 0)).toBe(false);
      expect(isStepHighlightedInTutorial(null, "kick", 0)).toBe(false);
    });
  });
});
