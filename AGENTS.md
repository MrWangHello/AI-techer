# 项目记忆（活跃）

> Agent 每次会话必读。详细问题记录见 [`ai-english-teacher/docs/PROJECT_MEMORY.md`](ai-english-teacher/docs/PROJECT_MEMORY.md)。

## 产品定位

- **AI-techer / Bella**：面向 1–3 年级的 Web 学习助手（英语、语文、数学、阅读、探索）
- **唯一代码目录：** `ai-english-teacher/`
- **部署：** GitHub Pages → https://mrwanghello.github.io/AI-techer/
- **原则：** 语音优先、零后端、规则 Router + Skills（不用 LLM）

## 架构要点

```
VoiceChatBar → handleUserMessage → orchestrator → Skills → TTS
```

- 意图层：`src/lib/core/orchestrator.ts` + `src/lib/skills/*`
- 语音：`src/lib/speech.ts`（Web Speech API STT/TTS）
- 宠物：`Cat3D.tsx`（5 个 MP4 mood 视频）
- 学习 UI：`StudyPanel.tsx`（五科分区 + 内容卡片）

## 当前已知限制

| 限制 | 说明 |
|------|------|
| STT | 荣耀/华为/QQ 浏览器常失败 → 文字输入降级 |
| TTS | 需用户手势唤醒；沙箱环境无法测 |
| 视频 | MP4 实心底，CSS 羽化无法完全透明 |
| 联网 | 内容 API 需网络；wiki/诗词/故事有离线兜底 |
| 情绪 | `agentEmotion` 触发后不自动回 neutral |

## 待验证（部署后）

- [ ] 手机 Chrome：口算语音、讲故事朗读、中译英查词（PR #10 合并后）
- [ ] 各浏览器 TTS/STT 实测

## 明确不做

- Flutter 双轨（已清理）
- Edge-TTS / Cloudflare Worker（已废弃）
- ClawBot / 前端暴露 LLM API Key

## 文档索引

| 文档 | 用途 |
|------|------|
| [`docs/PROJECT_MEMORY.md`](ai-english-teacher/docs/PROJECT_MEMORY.md) | **问题沉淀库**（修 bug 先查） |
| [`docs/SYSTEM_ARCHITECTURE.md`](ai-english-teacher/docs/SYSTEM_ARCHITECTURE.md) | 分层架构与 Skills 设计 |
| [`docs/BROWSER_COMPAT_PLAN.md`](ai-english-teacher/docs/BROWSER_COMPAT_PLAN.md) | 浏览器兼容 FAQ |
| [`docs/APP_PRODUCT_PLAN.md`](ai-english-teacher/docs/APP_PRODUCT_PLAN.md) | 产品路线图（标 done/todo） |
| [`docs/CONTENT_API_RESEARCH.md`](ai-english-teacher/docs/CONTENT_API_RESEARCH.md) | 内容 API 实测结论 |
| [`docs/archive/`](ai-english-teacher/docs/archive/) | 已废弃方案（Flutter 等） |

## 记忆维护规则

1. 修 bug → 追加到 `PROJECT_MEMORY.md` 对应章节
2. 架构决策变更 → 更新本文件 + `SYSTEM_ARCHITECTURE.md`
3. 功能完成 → `APP_PRODUCT_PLAN.md` 标 ✅
4. 已解决项从「待验证」移除；6 个月未复现标 `[stable]`
