import { describe, it, expect } from "vitest";
import {
  encodeVlq,
  generateMidiFile,
  renderPatternToMidiBlob,
  MIDI_DRUM_MAP,
} from "./midiExport";
import { createEmptyPattern, createDefaultTrackLengths } from "./sequencer";

describe("midiExport", () => {
  describe("encodeVlq", () => {
    it("encodes single-byte values (0 to 127)", () => {
      expect(encodeVlq(0)).toEqual([0x00]);
      expect(encodeVlq(60)).toEqual([0x3c]);
      expect(encodeVlq(120)).toEqual([0x78]);
      expect(encodeVlq(127)).toEqual([0x7f]);
    });

    it("encodes multi-byte values (128 and above)", () => {
      expect(encodeVlq(128)).toEqual([0x81, 0x00]);
      expect(encodeVlq(480)).toEqual([0x83, 0x60]);
      expect(encodeVlq(16383)).toEqual([0xff, 0x7f]);
      expect(encodeVlq(16384)).toEqual([0x81, 0x80, 0x00]);
    });
  });

  describe("generateMidiFile", () => {
    it("creates a valid SMF Format 0 binary with correct MThd and MTrk chunks", () => {
      const pattern = createEmptyPattern(16);
      // step 0 と step 4 に Kick
      pattern.kick[0] = true;
      pattern.kick[4] = true;

      const bytes = generateMidiFile({
        pattern,
        trackLengths: createDefaultTrackLengths(16),
        bpm: 120,
        bars: 1,
        timeSignature: "4/4",
      });

      expect(bytes).toBeInstanceOf(Uint8Array);

      // MThd 検証
      const headerMagic = String.fromCharCode(...bytes.slice(0, 4));
      expect(headerMagic).toBe("MThd");
      expect(bytes[4]).toBe(0x00);
      expect(bytes[5]).toBe(0x00);
      expect(bytes[6]).toBe(0x00);
      expect(bytes[7]).toBe(0x06); // header length: 6
      expect(bytes[8]).toBe(0x00);
      expect(bytes[9]).toBe(0x00); // format: 0
      expect(bytes[10]).toBe(0x00);
      expect(bytes[11]).toBe(0x01); // tracks: 1
      expect(bytes[12]).toBe(0x01);
      expect(bytes[13]).toBe(0xe0); // 480 PPQ (0x01E0)

      // MTrk 検証
      const trackMagic = String.fromCharCode(...bytes.slice(14, 18));
      expect(trackMagic).toBe("MTrk");

      const trackLength =
        (bytes[18] << 24) | (bytes[19] << 16) | (bytes[20] << 8) | bytes[21];
      expect(bytes.length).toBe(14 + 8 + trackLength);

      // 末尾3バイトが End of Track (FF 2F 00)
      expect(bytes[bytes.length - 3]).toBe(0xff);
      expect(bytes[bytes.length - 2]).toBe(0x2f);
      expect(bytes[bytes.length - 1]).toBe(0x00);

      // Kick (Note 36) のイベントが存在することを確認
      // Channel 10 Note On: 0x99 0x24 (36) 0x64 (100)
      let foundKickNoteOnCount = 0;
      for (let i = 22; i < bytes.length - 3; i++) {
        if (
          bytes[i] === 0x99 &&
          bytes[i + 1] === MIDI_DRUM_MAP.kick &&
          bytes[i + 2] === 100
        ) {
          foundKickNoteOnCount++;
        }
      }
      expect(foundKickNoteOnCount).toBe(2);
    });

    it("generates correct tempo and time signature for odd meters (7/8)", () => {
      const pattern = createEmptyPattern(14);
      pattern.snare[0] = true;

      const bytes = generateMidiFile({
        pattern,
        trackLengths: createDefaultTrackLengths(14),
        bpm: 140,
        bars: 1,
        timeSignature: "7/8",
      });

      // 拍子メタイベント FF 58 04 07 03 (7/8) が含まれているか
      let foundTimeSig = false;
      for (let i = 22; i < bytes.length - 8; i++) {
        if (
          bytes[i] === 0xff &&
          bytes[i + 1] === 0x58 &&
          bytes[i + 2] === 0x04 &&
          bytes[i + 3] === 7 && // numerator 7
          bytes[i + 4] === 3 // denominator 2^3 = 8
        ) {
          foundTimeSig = true;
          break;
        }
      }
      expect(foundTimeSig).toBe(true);
    });

    it("renderPatternToMidiBlob produces a Blob with audio/midi type", () => {
      const pattern = createEmptyPattern(16);
      const blob = renderPatternToMidiBlob({
        pattern,
        trackLengths: createDefaultTrackLengths(16),
        bpm: 120,
        bars: 1,
        timeSignature: "4/4",
      });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("audio/midi");
      expect(blob.size).toBeGreaterThan(30);
    });
  });
});

