import { describe, it, expect } from "vitest";
import {
  validateAudioFile,
  formatSampleName,
  stopPreviousAudioBuffer,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from "./customAudio";

describe("customAudio utils", () => {
  describe("validateAudioFile", () => {
    it("should accept valid audio files under 10MB", () => {
      const file = new File(["dummy content"], "snare.wav", { type: "audio/wav" });
      const res = validateAudioFile(file);
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("should accept valid audio files by extension even if type is empty", () => {
      const file = new File(["dummy content"], "my_kick.mp3", { type: "" });
      const res = validateAudioFile(file);
      expect(res.valid).toBe(true);
    });

    it("should reject non-audio files", () => {
      const file = new File(["dummy content"], "image.png", { type: "image/png" });
      const res = validateAudioFile(file);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("対応している音声ファイル形式");
    });

    it("should reject oversized files", () => {
      const largeFile = {
        name: "long_song.wav",
        type: "audio/wav",
        size: MAX_AUDIO_FILE_SIZE_BYTES + 1024,
      } as unknown as File;
      const res = validateAudioFile(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("10MB");
    });
  });

  describe("formatSampleName", () => {
    it("should remove extension and preserve short names", () => {
      expect(formatSampleName("clap.wav")).toBe("clap");
      expect(formatSampleName("vox.mp3")).toBe("vox");
    });

    it("should truncate long names gracefully", () => {
      expect(formatSampleName("very_long_custom_drum_sample.wav", 10)).toBe("very_long_…");
    });
  });

  describe("stopPreviousAudioBuffer", () => {
    it("should safely handle null or already stopped sources without throwing", () => {
      expect(() => stopPreviousAudioBuffer(null)).not.toThrow();
      const mockSource = {
        stop: () => {},
        disconnect: () => {},
      } as unknown as AudioBufferSourceNode;
      expect(() => stopPreviousAudioBuffer(mockSource)).not.toThrow();
    });
  });
});
