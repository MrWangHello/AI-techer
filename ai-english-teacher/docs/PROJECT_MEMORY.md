# 项目问题沉淀库

> **维护规则**
> - Agent 修 bug 前先搜本文
> - 新问题：在对应章节**追加**一条（现象 → 根因 → 修复 → 状态）
> - 6 个月未复现：标 `[stable]`
> - 技术已废弃：移入 §7，勿再引用

**唯一活跃代码目录：** `ai-english-teacher/`  
**线上地址：** https://mrwanghello.github.io/AI-techer/

---

## 1. 语音（STT / TTS）

### 1.1 首次 TTS 无声音 / 被 STT 中断 `[stable]`

| 项 | 内容 |
|----|------|
| 现象 | 第一次点麦克风，TTS 不出声或被打断 |
| 根因 | STT 与 TTS 抢浏览器 audio session |
| 修复 | `speakAfterMic` 延迟朗读；Chrome 需用户手势唤醒 TTS |
| 文件 | `src/lib/speech.ts`, `VoiceChatBar.tsx` |

### 1.2 STT 误识别（美剧 → 美句）`[stable]`

| 项 | 内容 |
|----|------|
| 现象 | 说「美句」识别成「美剧」 |
| 根因 | 同音字 + 精确关键词匹配 |
| 修复 | `applySttCorrections` + `fuzzy-match` 变体组 |
| 文件 | `src/lib/core/normalize.ts`, `fuzzy-match.ts` |

### 1.3 荣耀 / 华为 / QQ 浏览器 STT 失败 `[known-limit]`

| 项 | 内容 |
|----|------|
| 现象 | 麦克风无反应或报错 |
| 根因 | 无 GMS、Web Speech API 不支持 |
| 修复 | 文字输入降级；高危机机会后台预取离线包，见 §1.8 |
| 文件 | `VoiceChatBar.tsx` |

### 1.4 口算中语音被导航规则抢走

| 项 | 内容 |
|----|------|
| 现象 | 口算时语音说答案，半天没反应或跳转到故事/英语 |
| 根因 | `orchestrator` 在 drill 答题失败后仍匹配 nav/async 规则 |
| 修复 | drill 模式守卫：非答题/帮助/停止 → 立刻给 hint |
| 状态 | PR #10 待合并 |
| 文件 | `orchestrator.ts`, `drill-hint.ts` |

### 1.5 Edge-TTS Worker 超时（已废弃）

见 §7.1 — 已改用 Web Speech API，勿再配置 Worker。

### 1.6 语速滑块听不出差别

| 项 | 内容 |
|----|------|
| 现象 | 设置里拖 1.2x/1.7x 感觉「假的」 |
| 根因 | 无试听；单词卡 `speakEnglish` 未传 `voiceSpeed`；部分手机 TTS 对 rate 支持弱 |
| 修复 | 滑块防抖自动试听 +「试听当前语速」；StudyCards 传入语速 |
| 文件 | `page.tsx`, `StudyCards.tsx` |

### 1.7 查词时整页黑屏 / 词典不可用

| 项 | 内容 |
|----|------|
| 现象 | 手机查词时黑屏或错误页；弱网下词典像「假功能」 |
| 根因 | 查词主路径依赖词霸外网 API（CORS/超时）；中文查词还会把汉字剥掉再请求 |
| 修复 | **本地词库优先**：`words.json` + 补充表同步命中，不发起网络请求；未收录立即说明，不卡住 |
| 文件 | `local-dictionary.ts`, `orchestrator.ts` |

### 1.8 离线语音包（探测后再下） `[preview]`

| 项 | 内容 |
|----|------|
| 探测 | `speech-probe.ts`：Chrome+GMS 不下包；无 API / 荣耀华为 QQ Firefox / 设置强制离线 → 后台预取 |
| 可跑包 | 本站 `public/models/whisper-tiny`（q8，约 42MB）+ `public/ort` WASM。Node 实测能 `pipeline` 起来 |
| 坑 | `hf-mirror.com` 对大文件 308 到 `huggingface.co`，再 302 到 `us.aws.cdn.hf.co`。国内手机 Failed to fetch 是这条链，不是进度条写错 |
| 158MB | SenseVoice 是 sherpa-onnx WASM，权重约 239MB，和 transformers.js 不是同一套管线，先不换 |
| 失败 | 有 Web Speech 就回退浏览器识别；设置里可再试一次 |
| 文件 | `speech-probe.ts`, `speech-local.ts`, `VoiceChatBar.tsx` |

### 1.9 荣耀 / 微信只能识别不能播报 `[preview]`

| 项 | 内容 |
|----|------|
| 现象 | 离线耳朵能听，Bella 不说话。设置里「语音合成：不支持」。荣耀浏览器、微信浏览器都这样，不是手机型号问题 |
| 根因 | Whisper 包只做 STT。嘴巴仍绑 `speechSynthesis`。这些内核经常没有系统 TTS，`speak()` 直接跳过 |
| 修复 | 本站再放 Piper 华研 x_low（约 20MB）。探测：Chrome 能播就不下；没有 `speechSynthesis` 或高危 UA 则装包，Web Audio 播 PCM |
| 品质 | 短中文能听懂，不如 Chrome 系统声；英语带口音。故事按句切开 |
| 文件 | `speech-local-tts.ts`, `tts-phonemes.ts`, `speech.ts`, `VoiceChatBar.tsx` |

---

## 2. 意图路由 / Skills

### 2.1 「故事」只导航不朗读 `[stable]`（PR #10）

| 项 | 内容 |
|----|------|
| 现象 | 说「故事」跳到阅读 Tab，但不读内容 |
| 根因 | `nav.reading` 只有短 reply，无 `contentCard` |
| 修复 | `matchShortcutContent` + `enrichNavWithContent` 自动加载并朗读 |
| 文件 | `nav-content.ts`, `orchestrator.ts` |

### 2.2 「书本用英语怎么说」查不到词 `[stable]`（PR #10）

| 项 | 内容 |
|----|------|
| 现象 | 说查词，却回复「来学英语单词」 |
| 根因 | `nav.english` 关键词「英语」抢先匹配；async lookup 只查英文 |
| 修复 | `tryChineseToEnglishLookup` 优先；收窄 nav 关键词为「学英语」 |
| 文件 | `english-lookup.ts`, `orchestrator.ts`, `nav-skills.ts` |

### 2.3 意图太死板 / 口语变体 `[stable]`

| 项 | 内容 |
|----|------|
| 现象 | 必须说固定句式才触发 |
| 根因 | 纯 `includes` 匹配 |
| 修复 | `fuzzy-match.ts` 编辑距离 + 变体组 |
| 文件 | `normalize.ts`, `fuzzy-match.ts` |

### 2.4 「换一篇 / 换一个」不识别 `[stable]`

| 项 | 内容 |
|----|------|
| 根因 | 缺 refresh intent |
| 修复 | `matchFuzzyRefresh` + `word.refresh` sideEffect |
| 文件 | `orchestrator.ts` |

---

## 3. 内容与 API

### 3.1 百科超时 / 国内网络慢 `[stable]`

| 项 | 内容 |
|----|------|
| 修复 | `wiki-snippets.json` 离线兜底 + 超时缩短 |
| 文件 | `providers/wiki.ts`, `data/wiki-snippets.json` |

### 3.2 每日英语拉不到 `[stable]`

| 项 | 内容 |
|----|------|
| 根因 | 词霸 CORS 在浏览器失败 |
| 修复 | 扇贝 API 优先，内置句库兜底 |
| 文件 | `providers/daily-english.ts` |

### 3.3 古诗过长 / API 不稳定 `[stable]`

| 项 | 内容 |
|----|------|
| 修复 | `short-poems.json` 本地 1–3 年级短诗 |
| 文件 | `providers/poetry.ts`, `data/short-poems.json` |

### 3.4 故事为英文 `[stable]`

| 项 | 内容 |
|----|------|
| 修复 | `chinese-stories.json` 中文故事 |
| 文件 | `providers/local-content.ts` |

---

## 4. 数学口算

### 4.1 键盘多 digit 输入（1→0 变 0）`[stable]`

| 项 | 内容 |
|----|------|
| 根因 | 每按一位立即提交 |
| 修复 | `MathDrill` digit 缓冲 +「确定」按钮 |
| 文件 | `MathDrill.tsx`, `page.tsx` → `submitDrillAnswer` |

### 4.2 语音「10个」等量词 `[stable]`

| 项 | 内容 |
|----|------|
| 修复 | `extractDrillAnswer` 剥离量词；`mergeVoiceDrillDigit` 合并 1+0 |
| 文件 | `math/drill-answer.ts` |

### 4.3 口算语音 vs 键盘路径不一致

| 项 | 内容 |
|----|------|
| 说明 | 键盘走 `submitDrillAnswer` 直连；语音走 `matchMathDrillAnswer` |
| 注意 | 两者应共用 `buildDrillResult`，改逻辑时需测双路径 |

---

## 5. UI / UX

### 5.1 学习 Tab 切换后空白 `[stable]`

| 项 | 内容 |
|----|------|
| 修复 | `study-content-loader.ts` 按 section 加载默认内容 |
| 文件 | `StudyPanel.tsx`, `page.tsx` |

### 5.2 语音入口只在宠物页 `[stable]`

| 项 | 内容 |
|----|------|
| 修复 | 全局 `VoiceChatBar` + `VoiceReplyBar` |
| 废弃 | `VoiceController.tsx`（已删除） |

### 5.3 缺朗读按钮与语音提示（PR #10）

| 项 | 内容 |
|----|------|
| 修复 | `SpeakAloudButton` + 分区 `SECTION_VOICE_HINTS` |
| 文件 | `StudyPanel.tsx`, `SpeakAloudButton.tsx` |

### 5.4 agentEmotion 不自动恢复 `[known-limit]`

| 项 | 内容 |
|----|------|
| 现象 | 触发 happy/sad 后一直保持 |
| 状态 | 未修，可规划 3–5s 回 neutral |

### 5.5 MP4 宠物视频背景不透明 `[known-limit]`

| 项 | 内容 |
|----|------|
| 修复 | CSS mask 羽化 + 背景色 `#f0ebe4` 匹配 |
| 限制 | 视频源自带实心底，无法完全透明 |

### 5.6 宠物主屏固定 + 旧 mood 片 `[preview]`

| 项 | 内容 |
|----|------|
| 还原 | 喂/玩/洗/睡直接播旧 5 段 mood MP4，禁止用 `white-cat.jpg` 海报盖住 |
| 坑 | 双缓冲 + blob 预载时，手机 canplay 不触发就一直显示写真静帧 |
| 贴图 | 闲着 ✨🌸⭐ 来回滚；喂/玩/洗/睡换对应贴图 |
| 主屏 | 宠物 Tab 不再上下滑；猫固定占满舞台，动作在右侧 |

---

## 6. 部署与 CI

### 6.1 GitHub Pages basePath `[stable]`

| 项 | 内容 |
|----|------|
| 配置 | `DEPLOY_TARGET=github-pages` → `basePath: /AI-techer` |
| 文件 | `next.config.ts`, `.github/workflows/deploy.yml` |

### 6.2 仅保留 Next.js 部署

| 项 | 内容 |
|----|------|
| 说明 | 已删除 Flutter 部署工作流；唯一 workflow 为 `deploy.yml` |

---

## 7. 已废弃（勿再引用）

### 7.1 Edge-TTS + Cloudflare Worker

- 国内 403；`NEXT_PUBLIC_TTS_WORKER_URL` 已移除
- **现方案：** Web Speech API（`speech.ts`）

### 7.2 Flutter / HTML 原型 / Three.js 3D

- 目录 `ai_english_teacher/`、`ai_english_teacher_flutter/` 已删除
- **现方案：** Next.js + MP4 视频猫（`Cat3D.tsx`）

### 7.3 model-viewer ES Module 不兼容

- 360/QQ 浏览器无法加载；见旧 `ai_english_teacher_flutter/PROJECT_MEMORY.md`（已归档删除）

### 7.4 VoiceController 卸载 setState（React #418）

- 组件已删除；逻辑由 `VoiceChatBar` 接管

### 7.6 Live2D / Pixi 遗留（已清理 2026-08-30）

| 项 | 处理 |
|----|------|
| `public/live2d.min.js` | 已删除 |
| `pixi-live2d-display` / `pixi.js` | 已从 package.json 移除（-82 npm 包） |
| `global.d.ts` Live2D/PIXI | 已删除，保留 SpeechRecognition 声明 |

---

## 8. 变更日志（摘要）

| 日期 | 变更 |
|------|------|
| 2026-08-30 | Mock Agent + Skills 分层；词库 187 词 |
| 2026-08-30 | 全局 VoiceChatBar；学习分科 StudyPanel |
| 2026-08-30 | wiki 离线、口算多 digit、STT 美句修正 |
| 2026-08-30 | 中文故事、本地短诗、fuzzy intent |
| 2026-08-30 | 口算守卫、中译英查词、🔊 朗读（PR #10） |
| 2026-08-30 | 仓库清理：删 Flutter 遗留、建立本记忆库 |
| 2026-08-30 | 功能目录 + 评测方案固化（FEATURES / EVALUATION / feature-catalog） |
| 2026-08-30 | 知识库：public/kb/pack.json + 设置导入；查词/故事运行时合并 |
| 2026-08-30 | 知识库方案改定为：Postgres 分批粘贴入库、存啥读啥（见 KB_DESIGN） |
| 2026-08-30 | 知识库：先写死模板；外部 AI 只在入库前填模板；朗读有条件谨慎扩展 |
| 2026-08-30 | 知识库：设置双勾数据来源（内置/库/都勾则库优先）；复盘写入权限与空 URL |
| 2026-08-30 | 知识库 UI：删 JSON 导入；设置来源勾选 + /kb 粘贴预览；未配云库不入库 |
| 2026-08-30 | 知识库开库清单 KB_SETUP.md（Supabase 申请 / SQL / Secrets） |
| 2026-08-30 | 知识库接 Supabase：邮箱口令写入，不做 Auth 登录；deploy 注入 secrets |
