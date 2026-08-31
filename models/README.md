# 离线识别包（跟网页一起发布）

浏览器只从本站拉这些文件，不连 huggingface / hf-mirror。

- `whisper-tiny/`：`Xenova/whisper-tiny` 的 q8 量化权重（约 42MB）
- 旁边的 `/ort/`：onnxruntime-web WASM

换包：在 `ai-english-teacher/` 跑 `bash scripts/vendor-stt-pack.sh`。
