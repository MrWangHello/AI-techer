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

- 📋 **全局悬浮语音入口** — 详见 [`docs/VOICE_UX_PLAN.md`](docs/VOICE_UX_PLAN.md)
  - 右下角 FAB，任意 Tab 可说话（类豆包）
  - 全局 ReplyBar 显示 Bella 回复
- 📋 **指令词扩展** — 导航（首页/宠物/学习/设置）+ 模糊匹配 + 帮助指令

## 待测试

- ⏳ **TTS/STT** — Chrome 手机端实测
- ⏳ **宠物 mood 切换** — 说「学单词」→ thinking，「睡觉」→ 困困，「你好」→ 开心
- ⏳ **背景融合** — 确认 `#f0ebe4` 背景是否消除视频框感

## 已知限制

- MP4 自带实心背景，CSS 无法完全透明化；彻底方案需透明通道视频
- TTS 音色取决于手机系统语音包
- STT 在 QQ/UC 浏览器不稳定，已提供文字输入降级
- `agentEmotion` 触发后保持，不会自动恢复 neutral

## 文档索引

| 文档 | 内容 |
|------|------|
| [`docs/ARCHITECTURE.md`](ai-english-teacher/docs/ARCHITECTURE.md) | 完整架构：宠物 mood 映射、语音方案、部署、排错 |
| [`docs/VOICE_UX_PLAN.md`](ai-english-teacher/docs/VOICE_UX_PLAN.md) | **规划稿**：全局悬浮语音入口 + 指令词体系 |
| [`docs/BROWSER_COMPAT_PLAN.md`](ai-english-teacher/docs/BROWSER_COMPAT_PLAN.md) | **规划稿**：浏览器兼容 + 双通道文字输入降级 |
| 本文件 | 项目记忆与变更摘要 |

## 语音方案（2026-08-30 确定）

- **TTS**：浏览器原生 `SpeechSynthesis`，预热时缓存中/英音色
- **STT**：`SpeechRecognition`，Chrome 最佳
- **降级**：STT 不可用 → 文字输入；TTS 不可用 → 提示用 Chrome
- **已移除**：Edge-TTS（国内 403 + Sec-MS-GEC）

## 宠物 mood 速查

5 个视频 = 5 种 mood：`neutral` `happy` `sad`(困倦) `surprised` `thinking`

触发：语音关键词 / 按钮 / 戳猫 → 详见 ARCHITECTURE.md §2.2
