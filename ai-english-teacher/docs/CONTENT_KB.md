# 内容知识库方案（不编译、不云库）

> 界面代码稳定后，**内容**应能单独更新。本方案零后端、零付费云、和 GitHub Pages 同一条发布线。

## 结论（先看这个）

| 问题 | 答案 |
|------|------|
| 要不要数据库？ | **不要。** 一年级词条/故事量级，JSON 足够 |
| 要不要 Supabase / Firebase？ | **不要。** 违反「免费、不云服务」 |
| GitHub 怎么当存储？ | 仓库里的 `public/kb/pack.json` 就是知识包；push 后 Actions 部署，App **运行时 fetch**，不打进 JS |
| 手机上即时加词？ | 设置 → 知识库，导入 JSON，写入 **本机 localStorage**（`bella_kb`），立刻可查 |

三层合并（后者覆盖提示、列表拼接）：

```
内置 src/data/*.json（打包，兜底离线）
    + 网站 public/kb/pack.json（Git 更新，全用户看到）
    + 本机 bella_kb（家长导入，仅此浏览器）
```

查词 / 故事 / 应用题 / 古诗 / 笑话 / 语音 hint 都走合并结果。

## 为什么不搞数据库

- 静态站没有写接口，自建库等于上云
- Git 本身就是版本库：diff、回滚、PR 审内容
- 内容更新频率是「改几个故事」，不是高并发写入

## 日常怎么更新（推荐）

### A. 全站更新（所有人立刻用到新内容）

1. 在 GitHub 网页打开 `ai-english-teacher/public/kb/pack.json`
2. 按 `public/kb/template.json` 的字段加词/故事
3. Commit 到 `main` → 现有 `deploy.yml` 发布 Pages
4. 用户打开网站（或设置里点「刷新网站知识包」）即可，**不用改 TypeScript、不用等你本地 npm run build 才有内容**

说明：Pages 仍会跑一次静态导出，但你改的是 `public/` 里的 JSON，逻辑代码不用动。

### B. 本机即时加（不 push）

设置 → 知识库 → 导入文件或粘贴 JSON。只存在这台手机的浏览器里。可导出备份。

## 不采用的方案

| 方案 | 原因 |
|------|------|
| 改 `src/data/*.json` 再发版 | 内容进 bundle，必须重新编译，正是现在的痛点 |
| Decap / Sveltia CMS | 要 GitHub OAuth，家长端太重 |
| Gist / 外链 API | 多一个账号和限流 |
| IndexedDB 当「服务器」 | 无法多设备同步，也不如 JSON 好备份 |

## 包格式

见 `public/kb/template.json`。`version` 固定为 `1`。

## 自动化

现有 GitHub Actions 部署即可。需要时可再加一个 workflow：校验 `pack.json` 能 `JSON.parse` 且 `version === 1`（未强制，避免拦内容 PR）。
