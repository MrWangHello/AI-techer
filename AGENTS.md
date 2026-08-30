# 项目记忆

## 已完成

- ✅ 删除Flutter部署工作流，只保留 Next.js GitHub Pages 部署
- ✅ 3D 动画白猫（5 个表情视频）替换静态宠物图片
- ✅ Cat3D 组件 — CSS mask 羽化 + 背景色 `#f0ebe4` 匹配视频源
- ✅ 移除 Edge-TTS / Cloudflare Worker，改用 Web Speech API
- ✅ 语音：Chrome wake-up、音色缓存、STT 文字输入降级、voiceSpeed
- ✅ **修复首次语音 TTS 中断** — STT/TTS 抢音频，见 `SYSTEM_ARCHITECTURE.md` §11
- ✅ **Mock Agent + Skills 分层** — `handleUserMessage`、规则 Skill + Tier1 API Skill
- ✅ **词库 187 词 + 换一批** — 语音/按钮触发 `word.refresh`
- ✅ **每日英语多源降级** — 扇贝优先（CORS 可用）；词霸浏览器常失败
- ✅ **STT 稳定性** — 忽略主动 stop 的 aborted；软错误不切文字模式
- ✅ 开发文档索引见下表

## 待测试

- ⏳ **首次语音 TTS** — 手机 Chrome 验证修复是否生效
- ⏳ **内容 Skill** — 每日英语、古诗、天气、百科在国内网络实测
- ⏳ **TTS/STT** — 各浏览器手机端
- ⏳ **宠物 mood 切换** — 语音关键词 → 视频表情

## 架构决策（2026-08-30）

- **不用 ClawBot / 本地 OpenClaw** — 需常开机器 + 默认 LLM，不符合零成本 Web 优先
- **Mock Agent 现在** — 规则 Router 调各 Skill；**以后只换意图识别层**
- **微信通道** — 暂缓；若要做用云开发云函数 `/api/chat`，非 ClawBot
- **产品 IA v2** — 首页（功能集+历史）/ 宠物（不动）/ **学习分科** / 设置（用户属性）；见 [`APP_PRODUCT_PLAN.md`](ai-english-teacher/docs/APP_PRODUCT_PLAN.md)
- **语音 v2** — 按住说话 + 静音自动发送，替代单纯 12s 超时；见同上 §5
- **语音导航** — 意图识别自动切 Tab/子模块，见 [`VOICE_INTENT_NAV.md`](ai-english-teacher/docs/VOICE_INTENT_NAV.md)

## 已知限制

- MP4 自带实心背景，CSS 无法完全透明化
- STT 在荣耀/华为无 GMS、QQ/UC 浏览器常失败 → 文字输入降级
- 内容 API Skill 需联网；GitHub Pages 静态部署下由**浏览器直连** API
- `agentEmotion` 触发后保持，不会自动恢复 neutral

## 文档索引

| 文档 | 内容 |
|------|------|
| [`docs/SYSTEM_ARCHITECTURE.md`](ai-english-teacher/docs/SYSTEM_ARCHITECTURE.md) | 分层架构 §11 语音修复 §12 Skills |
| [`docs/VOICE_INTENT_NAV.md`](ai-english-teacher/docs/VOICE_INTENT_NAV.md) | **语音意图导航**：说「汉字/数学/1加1」自动切 Tab |
| [`docs/MODULE_FEASIBILITY.md`](ai-english-teacher/docs/MODULE_FEASIBILITY.md) | 入口门禁调研 |
| [`docs/APP_PRODUCT_PLAN.md`](ai-english-teacher/docs/APP_PRODUCT_PLAN.md) | **产品 IA v2**：学习分科、首页历史、语音按住说 |
| [`docs/CONTENT_UI_PLAN.md`](ai-english-teacher/docs/CONTENT_UI_PLAN.md) | 内容卡片模板（并入学习分科内） |
| [`docs/CONTENT_API_RESEARCH.md`](ai-english-teacher/docs/CONTENT_API_RESEARCH.md) | 故事机式内容 API 实测 |
| [`docs/BROWSER_COMPAT_PLAN.md`](ai-english-teacher/docs/BROWSER_COMPAT_PLAN.md) | 浏览器兼容 FAQ §11 |
| [`docs/ARCHITECTURE.md`](ai-english-teacher/docs/ARCHITECTURE.md) | 宠物 mood、部署、排错 |
| 本文件 | 项目记忆与变更摘要 |

## 宠物 mood 速查

5 个视频 = 5 种 mood：`neutral` `happy` `sad`(困倦) `surprised` `thinking`

触发：语音关键词 / 按钮 / 戳猫 → 详见 ARCHITECTURE.md §2.2
