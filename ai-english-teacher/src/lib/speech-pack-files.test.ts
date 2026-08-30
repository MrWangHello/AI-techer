import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ensureLocalModel } from "./speech-local";

const modelRoot = resolve(process.cwd(), "public/models/whisper-tiny");
const ortRoot = resolve(process.cwd(), "public/ort");

const REQUIRED: Array<[string, number]> = [
  ["config.json", 500],
  ["tokenizer.json", 1_000_000],
  ["onnx/encoder_model_quantized.onnx", 8_000_000],
  ["onnx/decoder_model_merged_quantized.onnx", 20_000_000],
];

describe("same-origin STT pack files", () => {
  it("keeps the quantized whisper-tiny weights in public/", () => {
    for (const [rel, min] of REQUIRED) {
      const path = resolve(modelRoot, rel);
      expect(existsSync(path), path).toBe(true);
      expect(statSync(path).size, path).toBeGreaterThan(min);
    }
  });

  it("keeps onnxruntime wasm next to the app", () => {
    const wasm = resolve(ortRoot, "ort-wasm-simd-threaded.asyncify.wasm");
    expect(existsSync(wasm), wasm).toBe(true);
    expect(statSync(wasm).size).toBeGreaterThan(10_000_000);
  });
});

describe("local whisper-tiny actually loads", () => {
  it("creates a pipeline from the vendored q8 files", async () => {
    expect(await ensureLocalModel()).toBe(true);
  }, 30_000);
});
