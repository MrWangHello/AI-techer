# AI English Teacher (Bella)

Next.js Web 应用，面向 1–3 年级儿童的语音驱动学习助手。

**部署：** https://mrwanghello.github.io/AI-techer/

## 开发

```bash
npm ci
npm run dev          # http://localhost:3000
npm run test         # Vitest 单元测试
npm run test:e2e     # Playwright e2e
npm run test:all     # 全部测试
npm run build        # 生产构建（GitHub Pages 需 DEPLOY_TARGET=github-pages）
```

## 目录

| 路径 | 说明 |
|------|------|
| `src/app/page.tsx` | 主页面（四 Tab） |
| `src/components/VoiceChatBar.tsx` | 全局语音入口 |
| `src/lib/core/orchestrator.ts` | 意图路由 |
| `src/lib/skills/` | 规则 Skill + 内容 Skill |
| `src/data/` | 本地 JSON（词库、故事、古诗等） |
| `docs/PROJECT_MEMORY.md` | 问题沉淀库 |

## 文档

见 [`docs/`](docs/) 目录。Agent 必读 [`../AGENTS.md`](../AGENTS.md) 与 [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md)。

## 部署

推送到 `main` 分支自动触发 `.github/workflows/deploy.yml`，构建产物输出到 `out/`。
