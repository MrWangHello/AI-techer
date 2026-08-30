# AI-techer

面向小学生的 AI 英语学习 Web 应用（Bella 白猫陪伴），部署于 GitHub Pages。

**线上地址：** https://mrwanghello.github.io/AI-techer/

## 仓库结构

```
AI-techer/
├── AGENTS.md                 # Agent 活跃记忆（短）
├── ai-english-teacher/       # ★ 唯一活跃项目（Next.js）
│   ├── src/                  # 应用源码
│   ├── docs/                 # 架构、问题沉淀、产品规划
│   ├── e2e/                  # Playwright 端到端测试
│   └── public/               # 静态资源（视频、图片）
└── .github/workflows/        # GitHub Pages 部署
```

## 快速开始

```bash
cd ai-english-teacher
npm ci
npm run dev        # 本地开发 http://localhost:3000
npm run test:all   # 单元 + e2e 测试
npm run build      # 生产构建
```

## 文档

- [问题沉淀库](ai-english-teacher/docs/PROJECT_MEMORY.md) — 历史 bug 与修复记录
- [系统架构](ai-english-teacher/docs/SYSTEM_ARCHITECTURE.md)
- [浏览器兼容](ai-english-teacher/docs/BROWSER_COMPAT_PLAN.md)

## 技术栈

Next.js 16 · React 19 · Tailwind · Web Speech API · GitHub Pages 静态部署
