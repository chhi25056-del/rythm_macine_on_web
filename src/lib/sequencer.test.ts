import { describe, it, expect } from "vitest";
import {
  toggleStepAt,
  getNextStep,
  createDefaultPattern,
  createEmptyPattern,
  togglePatternStep,
  copyBarPattern,
  TRACK_INFO,
  TIME_SIGNATURE_CONFIGS,
  MAX_STEPS,
  MAX_TRACK_LENGTH,
  createDefaultTrackLengths,
  getTrackStepIndex,
  isStepActiveForTrack,
  shouldTriggerTrack,
} from "./sequencer";

describe("sequencer", () => {
  describe("TRACK_INFO", () => {
    it("should include all 7 drum instruments", () => {
      expect(TRACK_INFO.kick.name).toBe("Kick");
      expect(TRACK_INFO.snare.name).toBe("Snare");
      expect(TRACK_INFO.hihatClosed.name).toBe("Closed HH");
      expect(TRACK_INFO.hihatOpen.name).toBe("Open HH");
      expect(TRACK_INFO.hiTom.name).toBe("Hi Tom");
      expect(TRACK_INFO.lowTom.name).toBe("Low Tom");
      expect(TRACK_INFO.crash.name).toBe("Crash");
    });
  });

  describe("TIME_SIGNATURE_CONFIGS", () => {
    it("should provide correct stepsPerBar and groups for each time signature", () => {
      expect(TIME_SIGNATURE_CONFIGS["4/4"].stepsPerBar).toBe(16);
      expect(TIME_SIGNATURE_CONFIGS["4/4"].groups).toEqual([4, 4, 4, 4]);

      expect(TIME_SIGNATURE_CONFIGS["3/4"].stepsPerBar).toBe(12);
      expect(TIME_SIGNATURE_CONFIGS["3/4"].groups).toEqual([4, 4, 4]);

      expect(TIME_SIGNATURE_CONFIGS["5/4"].stepsPerBar).toBe(20);
      expect(TIME_SIGNATURE_CONFIGS["5/4"].groups).toEqual([4, 4, 4, 4, 4]);

      expect(TIME_SIGNATURE_CONFIGS["6/8"].stepsPerBar).toBe(12);
      expect(TIME_SIGNATURE_CONFIGS["6/8"].groups).toEqual([6, 6]);

      expect(TIME_SIGNATURE_CONFIGS["7/8"].stepsPerBar).toBe(14);
      expect(TIME_SIGNATURE_CONFIGS["7/8"].groups).toEqual([4, 4, 6]);
    });
  });

  describe("createEmptyPattern", () => {
    it("should create pattern with MAX_STEPS false steps for all tracks by default", () => {
      const pattern = createEmptyPattern();
      expect(pattern.kick).toHaveLength(MAX_STEPS);
      expect(pattern.snare).toHaveLength(MAX_STEPS);
      expect(pattern.hihatClosed).toHaveLength(MAX_STEPS);
      expect(pattern.hihatOpen).toHaveLength(MAX_STEPS);
      expect(pattern.hiTom).toHaveLength(MAX_STEPS);
      expect(pattern.lowTom).toHaveLength(MAX_STEPS);
      expect(pattern.crash).toHaveLength(MAX_STEPS);
      expect(pattern.kick.every((step) => step === false)).toBe(true);
    });

    it("should respect custom totalSteps parameter", () => {
      const pattern = createEmptyPattern(16);
      expect(pattern.kick).toHaveLength(16);
      expect(pattern.snare).toHaveLength(16);
    });
  });

  describe("createDefaultPattern", () => {
    it("should create default pattern for 4/4 time signature", () => {
      const pattern = createDefaultPattern("4/4");
      expect(pattern.kick[0]).toBe(true);
      expect(pattern.kick[4]).toBe(true);
      expect(pattern.snare[4]).toBe(true);
      expect(pattern.snare[12]).toBe(true);
      expect(pattern.hihatClosed[0]).toBe(true);
      expect(pattern.hihatOpen[14]).toBe(true);
    });

    it("should create default patterns for 3/4, 5/4, 6/8, and 7/8", () => {
      const p34 = createDefaultPattern("3/4");
      expect(p34.kick[0]).toBe(true);
      expect(p34.snare[4]).toBe(true);
      expect(p34.snare[8]).toBe(true);

      const p54 = createDefaultPattern("5/4");
      expect(p54.kick[0]).toBe(true);
      expect(p54.snare[8]).toBe(true);
      expect(p54.snare[16]).toBe(true);

      const p68 = createDefaultPattern("6/8");
      expect(p68.kick[0]).toBe(true);
      expect(p68.snare[6]).toBe(true);

      const p78 = createDefaultPattern("7/8");
      expect(p78.kick[0]).toBe(true);
      expect(p78.kick[4]).toBe(true);
      expect(p78.snare[8]).toBe(true);
    });
  });

  describe("togglePatternStep", () => {
    it("should toggle specific step of a track without mutating other tracks", () => {
      const pattern = createDefaultPattern();
      const updated = togglePatternStep(pattern, "snare", 0);

      expect(updated.snare[0]).toBe(true);
      expect(pattern.snare[0]).toBe(false);
      expect(updated.kick).toBe(pattern.kick);
      expect(updated.hihatClosed).toBe(pattern.hihatClosed);
    });
  });

  describe("copyBarPattern", () => {
    it("should copy patterns from one bar to another with stepsPerBar", () => {
      const pattern = createDefaultPattern("3/4");
      const custom = togglePatternStep(pattern, "crash", 0);
      const copied = copyBarPattern(custom, 0, 1, 12);

      expect(copied.crash[12]).toBe(true);
      expect(copied.kick[12]).toBe(copied.kick[0]);
    });
  });

  describe("toggleStepAt", () => {
    it("should toggle the step at the specified index without mutating the original array", () => {
      const initial = [true, false, false, true, false, false, false, false];
      const updated = toggleStepAt(initial, 1);

      expect(updated[1]).toBe(true);
      expect(initial[1]).toBe(false);
      expect(updated[0]).toBe(true);
      expect(updated[3]).toBe(true);
    });

    it("should toggle from true to false", () => {
      const initial = [true, false, false, false, false, false, false, false];
      const updated = toggleStepAt(initial, 0);

      expect(updated[0]).toBe(false);
    });
  });

  describe("getNextStep", () => {
    it("should advance to the next step", () => {
      expect(getNextStep(0)).toBe(1);
      expect(getNextStep(4)).toBe(5);
    });

    it("should loop back to 0 after totalSteps", () => {
      expect(getNextStep(11, 12)).toBe(0);
      expect(getNextStep(19, 20)).toBe(0);
      expect(getNextStep(13, 14)).toBe(0);
      expect(getNextStep(15, 16)).toBe(0);
    });
  });

  describe("Polymeter / Track Lengths", () => {
    describe("createDefaultTrackLengths", () => {
      it("should initialize all 7 tracks with default length (16)", () => {
        const lengths = createDefaultTrackLengths();
        expect(lengths.kick).toBe(16);
        expect(lengths.snare).toBe(16);
        expect(lengths.hihatClosed).toBe(16);
        expect(lengths.hihatOpen).toBe(16);
        expect(lengths.hiTom).toBe(16);
        expect(lengths.lowTom).toBe(16);
        expect(lengths.crash).toBe(16);
      });

      it("should accept custom default length", () => {
        const lengths = createDefaultTrackLengths(12);
        expect(lengths.kick).toBe(12);
      });
    });

    describe("getTrackStepIndex", () => {
      it("should calculate correct index with modulo of track length", () => {
        // 7ステップのハイハット: globalStep 0..13
        expect(getTrackStepIndex(0, 7)).toBe(0);
        expect(getTrackStepIndex(6, 7)).toBe(6);
        expect(getTrackStepIndex(7, 7)).toBe(0); // 7ステップ目でループ
        expect(getTrackStepIndex(8, 7)).toBe(1);
        expect(getTrackStepIndex(14, 7)).toBe(0);
      });

      it("should handle 16 step kick", () => {
        expect(getTrackStepIndex(16, 16)).toBe(0);
        expect(getTrackStepIndex(17, 16)).toBe(1);
      });
    });

    describe("isStepActiveForTrack", () => {
      it("should return true when step is within track length", () => {
        expect(isStepActiveForTrack(0, 7)).toBe(true);
        expect(isStepActiveForTrack(6, 7)).toBe(true);
      });

      it("should return false when step is equal to or exceeds track length", () => {
        expect(isStepActiveForTrack(7, 7)).toBe(false);
        expect(isStepActiveForTrack(15, 7)).toBe(false);
      });
      it("should support up to MAX_STEPS for MAX_TRACK_LENGTH", () => {
        expect(MAX_TRACK_LENGTH).toBe(MAX_STEPS);
      });

      it("should correctly activate steps in Bar 2 and Bar 4 when trackLength matches totalSteps", () => {
        // 2小節 (32ステップ) の場合、Bar 2 (16..31) はすべてアクティブ
        expect(isStepActiveForTrack(16, 32)).toBe(true);
        expect(isStepActiveForTrack(31, 32)).toBe(true);
        expect(isStepActiveForTrack(32, 32)).toBe(false);

        // 4小節 (64ステップ) の場合、Bar 4 (48..63) はすべてアクティブ
        expect(isStepActiveForTrack(48, 64)).toBe(true);
        expect(isStepActiveForTrack(63, 64)).toBe(true);
        expect(isStepActiveForTrack(64, 64)).toBe(false);
      });
    });

    describe("shouldTriggerTrack", () => {
      it("should determine if note should trigger based on global step and track length", () => {
        const pattern = createEmptyPattern();
        // kick は step 0 と 4 がオン
        pattern.kick[0] = true;
        pattern.kick[4] = true;

        // length = 4 の場合、globalStep = 0, 4, 8 はすべて trackStep = 0 となりオン
        expect(shouldTriggerTrack(pattern, "kick", 0, 4)).toBe(true);
        expect(shouldTriggerTrack(pattern, "kick", 1, 4)).toBe(false);
        expect(shouldTriggerTrack(pattern, "kick", 4, 4)).toBe(true);
        expect(shouldTriggerTrack(pattern, "kick", 8, 4)).toBe(true);
      });
    });
  });
});

