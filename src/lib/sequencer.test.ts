import { describe, it, expect } from "vitest";
import { toggleStepAt, getNextStep } from "./sequencer";

describe("sequencer", () => {
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

