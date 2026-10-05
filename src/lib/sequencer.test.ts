import { describe, it, expect } from "vitest";
import {
  toggleStepAt,
  getNextStep,
  createDefaultPattern,
  createEmptyPattern,
  togglePatternStep,
  TRACK_INFO,
} from "./sequencer";

describe("sequencer", () => {
  describe("TRACK_INFO", () => {
    it("should include all 4 drum instruments", () => {
      expect(TRACK_INFO.kick.name).toBe("Kick");
      expect(TRACK_INFO.snare.name).toBe("Snare");
      expect(TRACK_INFO.hihatClosed.name).toBe("Closed HH");
      expect(TRACK_INFO.hihatOpen.name).toBe("Open HH");
    });
  });

  describe("createEmptyPattern", () => {
    it("should create pattern with 16 false steps for all tracks", () => {
      const pattern = createEmptyPattern();
      expect(pattern.kick).toHaveLength(16);
      expect(pattern.snare).toHaveLength(16);
      expect(pattern.hihatClosed).toHaveLength(16);
      expect(pattern.hihatOpen).toHaveLength(16);
      expect(pattern.kick.every((step) => step === false)).toBe(true);
    });
  });

  describe("createDefaultPattern", () => {
    it("should create default pattern with 4-on-the-floor kick, backbeat snare, and hats", () => {
      const pattern = createDefaultPattern();
      expect(pattern.kick[0]).toBe(true);
      expect(pattern.kick[4]).toBe(true);
      expect(pattern.snare[4]).toBe(true);
      expect(pattern.snare[12]).toBe(true);
      expect(pattern.hihatClosed[0]).toBe(true);
      expect(pattern.hihatOpen[14]).toBe(true);
    });
  });

  describe("togglePatternStep", () => {
    it("should toggle specific step of a track without mutating other tracks", () => {
      const pattern = createDefaultPattern();
      const updated = togglePatternStep(pattern, "snare", 0);

      expect(updated.snare[0]).toBe(true);
      expect(pattern.snare[0]).toBe(false);
      // Other tracks should be untouched
      expect(updated.kick).toBe(pattern.kick);
      expect(updated.hihatClosed).toBe(pattern.hihatClosed);
    });
  });

  describe("toggleStepAt", () => {
    it("should toggle the step at the specified index without mutating the original array", () => {
      const initial = [true, false, false, true, false, false, false, false];
      const updated = toggleStepAt(initial, 1);

      expect(updated[1]).toBe(true);
      expect(initial[1]).toBe(false); // 不変性の検証
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
      expect(getNextStep(6)).toBe(7);
      expect(getNextStep(14)).toBe(15);
    });

    it("should loop back to 0 after the last step", () => {
      expect(getNextStep(15)).toBe(0);
    });

    it("should respect custom totalSteps", () => {
      expect(getNextStep(7, 8)).toBe(0);
      expect(getNextStep(3, 4)).toBe(0);
      expect(getNextStep(2, 4)).toBe(3);
    });
  });
});


