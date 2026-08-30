# 离线嘴巴（Piper 华研 x_low）

- 模型：`zh_CN-huayan-x_low.onnx`（约 20MB，16 kHz）
- 来源：rhasspy/piper-voices，`espeak.voice = cmn`
- `pinyin-ipa.json`：用本机 `espeak-ng -v cmn-latn-pinyin --ipa` 生成，运行时不再访问模型站
- 播放：ONNX 出 PCM，浏览器 `AudioContext` 播放（不依赖 `speechSynthesis`）

重新生成拼音表（开发机需要 espeak-ng）：

```bash
node scripts/gen-pinyin-ipa.mjs
```
