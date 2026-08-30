# 项目记忆

## 已完成

- ✅ 删除Flutter部署工作流，只保留 Next.js GitHub Pages 部署
- ✅ 3D 动画白猫（5 个表情视频）替换静态宠物图片
- ✅ Cat3D 组件 — CSS mask 羽化 + 背景色 `#f0ebe4` 匹配视频源
- ✅ 移除 Edge-TTS / Cloudflare Worker，改用 Web Speech API
- ✅ 语音：Chrome wake-up、音色缓存、STT 文字输入降级、voiceSpeed
- ✅ 视频压缩 960×480，7.8MB → ~470KB
- ✅ Cat3D：poster、prefetch 缓存、Tab keep-alive
- ✅ 修复 mood 切换竞态 bug、睡觉→困倦视频、TTS 音色漂移
- ✅ 开发文档：[`ai-english-teacher/docs/ARCHITECTURE.md`](ai-english-teacher/docs/ARCHITECTURE.md)

## 待实施（语音 UX 规划）

- ✅ **全局 VoiceChatBar** — 类微信/豆包，语音+键盘双模式，任意 Tab 可用
- ✅ **全局 VoiceReplyBar** — 文字回复保底
- ✅ **导航指令词** — 首页/宠物/学习/设置 + 帮助
- 📋 Phase 2：StudyCards 子指令（朗读/下一个/测验）
- 📋 **开放问答** — 天气工具 + **免费 Worker 搜索** + 可选 LLM，见 [`OPEN_QA_PLAN.md`](ai-english-teacher/docs/OPEN_QA_PLAN.md)

## 待测试

- ⏳ **TTS/STT** — Chrome 手机端实测
- ⏳ **宠物 mood 切换** — 说「学单词」→ thinking，「睡觉」→ 困困，「你好」→ 开心
- ⏳ **背景融合** — 确认 `#f0ebe4` 背景是否消除视频框感

## 已知限制

- MP4 自带实心背景，CSS 无法完全透明化；彻底方案需透明通道视频
- TTS 音色取决于手机系统语音包 / 浏览器（Chrome、Edge 微软音色等）
- STT 在 QQ/UC 浏览器不稳定；**荣耀/华为无 GMS 时即装 Chrome 也常失败** → 用文字输入
- STT 通常需联网（Chrome 常走 Google 云端），非纯离线
- **不是 Google 专属**：网站用 Web Speech API，Edge 浏览器同样可用；Edge-TTS 云端服务已放弃
- `agentEmotion` 触发后保持，不会自动恢复 neutral

## 文档索引

| 文档 | 内容 |
|------|------|
| [`docs/ARCHITECTURE.md`](ai-english-teacher/docs/ARCHITECTURE.md) | 完整架构：宠物 mood 映射、语音方案、部署、排错 |
| [`docs/VOICE_UX_PLAN.md`](ai-english-teacher/docs/VOICE_UX_PLAN.md) | **规划稿**：全局悬浮语音入口 + 指令词体系 |
| [`docs/BROWSER_COMPAT_PLAN.md`](ai-english-teacher/docs/BROWSER_COMPAT_PLAN.md) | 浏览器兼容 + 双通道降级 + **用户 FAQ（§11）** |
| [`docs/OPEN_QA_PLAN.md`](ai-english-teacher/docs/OPEN_QA_PLAN.md) | **规划稿**：开放问答（天气/搜索/LLM 路由方案） |
| 本文件 | 项目记忆与变更摘要 |

## 语音方案（2026-08-30 确定）

- **TTS**：浏览器原生 `SpeechSynthesis`，预热时缓存中/英音色（Chrome / Edge / Safari 等）
- **STT**：`SpeechRecognition`，Chromium 系最佳（Chrome、Edge）；**不绑定 Google 账号**
- **降级**：STT 不可用或失败 → VoiceChatBar 自动切 ⌨️ 文字；TTS 失败 → ReplyBar 仍显示文字
- **已移除**：Edge-TTS 云端 API（国内 403；与 Edge **浏览器** 无关）
- **FAQ**：荣耀无 GMS、小米对比、Edge 是否可用 → 见 `BROWSER_COMPAT_PLAN.md` §11

## 宠物 mood 速查

5 个视频 = 5 种 mood：`neutral` `happy` `sad`(困倦) `surprised` `thinking`

触发：语音关键词 / 按钮 / 戳猫 → 详见 ARCHITECTURE.md §2.2
