import { describe, it, expect } from "vitest";
import { audioBufferToWavBlob, generateExportFileName } from "./wavExport";

describe("wavExport", () => {
  it("generateExportFileName generates well-formatted filenames", () => {
    const fileName = generateExportFileName("wav", {
      timeSignature: "4/4",
      bpm: 120,
      bars: 2,
    });
    expect(fileName).toMatch(/^rhythm-4_4-120bpm-2bars-\d{8}-\d{6}\.wav$/);

    const midiName = generateExportFileName("mid", {
      timeSignature: "7/8",
      bpm: 140,
      bars: 4,
    });
    expect(midiName).toMatch(/^rhythm-7_8-140bpm-4bars-\d{8}-\d{6}\.mid$/);
  });

  it("audioBufferToWavBlob creates valid RIFF WAVE header and data", async () => {
    const sampleRate = 44100;
    const length = 100; // 100 frames
    const numChannels = 2;

    // AudioBuffer の最小モック
    const leftData = new Float32Array(length);
    const rightData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      leftData[i] = Math.sin(i / 10);
      rightData[i] = Math.cos(i / 10);
    }

    const mockBuffer = {
      sampleRate,
      length,
      numberOfChannels: numChannels,
      duration: length / sampleRate,
      getChannelData: (ch: number) => (ch === 0 ? leftData : rightData),
    } as unknown as AudioBuffer;

    const blob = audioBufferToWavBlob(mockBuffer);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("audio/wav");

    // バイナリ内容を検証
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // RIFF ヘッダ検証
    const readString = (offset: number, len: number) => {
      let str = "";
      for (let i = 0; i < len; i++) {
        str += String.fromCharCode(view.getUint8(offset + i));
      }
      return str;
    };

    expect(readString(0, 4)).toBe("RIFF");
    const expectedDataSize = length * numChannels * 2; // 100 * 2 * 2 = 400 bytes
    expect(view.getUint32(4, true)).toBe(36 + expectedDataSize);
    expect(readString(8, 4)).toBe("WAVE");

    // fmt サブチャンク
    expect(readString(12, 4)).toBe("fmt ");
    expect(view.getUint32(16, true)).toBe(16); // chunk size
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(numChannels); // 2 channels
    expect(view.getUint32(24, true)).toBe(sampleRate); // 44100
    expect(view.getUint32(28, true)).toBe(sampleRate * numChannels * 2); // byteRate
    expect(view.getUint16(32, true)).toBe(numChannels * 2); // blockAlign
    expect(view.getUint16(34, true)).toBe(16); // 16-bit

    // data サブチャンク
    expect(readString(36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(expectedDataSize);

    // 全体サイズ
    expect(arrayBuffer.byteLength).toBe(44 + expectedDataSize);
  });
});

