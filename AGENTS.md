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
| [`docs/FEATURES.md`](ai-english-teacher/docs/FEATURES.md) | **功能说明书** |
| [`docs/EVALUATION.md`](ai-english-teacher/docs/EVALUATION.md) | **评测方法与评分（当前 72 分）** |
| [`docs/TEST_CASES.md`](ai-english-teacher/docs/TEST_CASES.md) | 用例与代码映射 |
| [`src/lib/eval/feature-catalog.ts`](ai-english-teacher/src/lib/eval/feature-catalog.ts) | 机器可读功能目录（新功能先改这里） |
| [`docs/PROJECT_MEMORY.md`](ai-english-teacher/docs/PROJECT_MEMORY.md) | 问题沉淀库（修 bug 先查） |
| [`docs/SYSTEM_ARCHITECTURE.md`](ai-english-teacher/docs/SYSTEM_ARCHITECTURE.md) | 分层架构 |
| [`docs/BROWSER_COMPAT_PLAN.md`](ai-english-teacher/docs/BROWSER_COMPAT_PLAN.md) | 浏览器兼容 FAQ |
| [`docs/APP_PRODUCT_PLAN.md`](ai-english-teacher/docs/APP_PRODUCT_PLAN.md) | 产品路线图 |
| [`docs/archive/`](ai-english-teacher/docs/archive/) | 已废弃方案 |

## 记忆维护规则

1. **新语音功能**：先加 `feature-catalog.ts` 一条 → 实现 → `npm run test:all`
2. 修 bug → 追加 `PROJECT_MEMORY.md`
3. 承诺与行为不一致 → catalog `status` 标 `broken`/`partial`，并改 hint
4. 复评 → 更新 `EVALUATION.md` 分数
5. 6 个月未复现标 `[stable]`
