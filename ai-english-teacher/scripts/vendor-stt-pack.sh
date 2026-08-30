#!/usr/bin/env bash
# 把 Whisper tiny q8 + onnxruntime WASM 拉进 public/，供 Pages 同源下载。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL="$ROOT/public/models/whisper-tiny"
ORT="$ROOT/public/ort"
mkdir -p "$MODEL/onnx" "$ORT"
HF="https://huggingface.co/Xenova/whisper-tiny/resolve/main"
ORT_VER="1.26.0-dev.20260416-b7804b056c"
JS="https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist"

get() {
  echo "GET $1"
  curl -fL --retry 3 --retry-delay 2 --max-time 180 -o "$2" "$1"
}

for f in config.json generation_config.json preprocessor_config.json tokenizer.json tokenizer_config.json added_tokens.json special_tokens_map.json normalizer.json; do
  get "$HF/$f" "$MODEL/$f"
done
get "$HF/onnx/encoder_model_quantized.onnx" "$MODEL/onnx/encoder_model_quantized.onnx"
get "$HF/onnx/decoder_model_merged_quantized.onnx" "$MODEL/onnx/decoder_model_merged_quantized.onnx"
for f in ort-wasm-simd-threaded.asyncify.wasm ort-wasm-simd-threaded.asyncify.mjs ort-wasm-simd-threaded.wasm ort-wasm-simd-threaded.mjs; do
  get "$JS/$f" "$ORT/$f"
done
du -sh "$MODEL" "$ORT"
