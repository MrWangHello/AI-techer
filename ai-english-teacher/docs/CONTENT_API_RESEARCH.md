# 故事机式内容 API 实测清单（国内可用性）

> 状态：**调研完成，待评审后开发**
> 关联：[OPEN_QA_PLAN.md](./OPEN_QA_PLAN.md) · [BROWSER_COMPAT_PLAN.md](./BROWSER_COMPAT_PLAN.md)
> 实测日期：2026-08-30
> 测试环境：Cloud Agent 美国节点 curl/fetch + GreatFire 交叉参考

---

## 1. 目标：像「儿童故事机」一样能聊

不限于「搜索」，而是 **语音/文字触发 → 有内容回应 → TTS 朗读**，覆盖：

| 故事机常见功能 | 本项目映射 |
|----------------|------------|
| 每日英语 / 口语 | 词霸、扇贝每日一句 |
| 背古诗 | 诗泉、今日诗词 |
| 讲笑话 | 接口盒子（需 key）或 **内置笑话库** |
| 讲童话 / 睡前故事 | **内置故事库**（无稳定免费 API） |
| 成语故事 | 接口盒子随机成语（需 key） |
| 谜语 / 脑筋急转弯 | **内置库** 或 接口盒子 |
| 绕口令 | **内置库** |
| 点歌 / 儿歌 | 酷狗搜索（报歌名） |
| 十万个为什么 | 维基百科 + 词霸查词 |
| 今天天气 | Open-Meteo |
| 百科解说 | 维基中文 |

---

## 2. 实测结论总表

图例：**✅ 直接用** · **⚠️ 部分可用/需注册** · **❌ 不可用** · **📦 建议内置**

| 分类 | 推荐来源 | 国内 | 免费 | 前端直连 | 实测摘要 |
|------|----------|------|------|----------|----------|
| **每日英语** | 词霸 `open.iciba.com/dsapi/` | ✅ | ✅ | ⚠️ | EN+中文+mp3；**浏览器缺 CORS Allow-Origin，GitHub Pages 常失败** → 已改扇贝优先 |
| **每日英语** | 扇贝 `apiv3.shanbay.com/.../quote` | ✅ | ✅ | ✅ | **现主源**；EN + translation + 作者 |
| **查单词** | 词霸移动词典 | ✅ | ✅ | ✅ | `apple` → 释义/词性 |
| **古诗 / 诗词** | [诗泉 poetry.palemoky.com](https://poetry.palemoky.com/) | ✅ | ✅ | ✅ | **37 万首**，随机/按朝代；无需 Key |
| **古诗 / 诗词** | 今日诗词 `v1.jinrishici.com` | ✅ | ✅ | ✅ | 随机一首 + 作者 |
| **美句 / 文学** | 一言 `v1.hitokoto.cn` | ✅ | ✅ | ✅ | 多分类（诗词/文学/哲学/抖机灵等） |
| **天气** | Open-Meteo | ✅ | ✅ | ✅ | 北京实测 31.1°C |
| **百科 / 是谁** | 维基中文 API | ✅ | ✅ | ✅ | 需 User-Agent；`origin=*` |
| **儿歌 / 歌词搜索** | 酷狗 mobile 搜索 | ✅ | ✅ | ✅ | 「小星星」「ABC」可搜到；**播放 URL 未打通** |
| **随机成语** | 接口盒子 `cn.apihz.cn` | ✅ | ✅ 注册 | ✅ | 含解释/出处/英文；**需 id+key**；公共 key 高频限流 |
| **随机笑话** | 接口盒子 `xiaohua.php` | ✅ | ✅ 注册 | ✅ | 20 万笑话库；**需 id+key**；公共 key 限流 |
| **随机谚语** | 接口盒子（同平台） | ✅ | ✅ 注册 | ✅ | 文档有；未单独测通 |
| **小学数学题** | 接口盒子 API ID 2244 | ✅ | ✅ 注册 | ✅ | 文档有；需 id+key |
| **童话 / 睡前故事** | 天聚 TianAPI 等 | ⚠️ | 试用 | ❌ | 需 API Key；demo 无效 |
| **童话 / 睡前故事** | xxapi / vvhan / pearktrue | ❌ | — | — | 接口不存在、512、要 Key |
| **冷笑话 API** | laifudao | ❌ | — | — | SSL/500 错误 |
| **全网搜索** | Worker + DDG | ❌ | — | — | 见 OPEN_QA_PLAN §10 |
| **新闻热榜** | pearktrue / vvhan | ❌ | 要 Key | — | 512 或域名不可用 |

---

## 3. 分级实施方案（确定后再写代码）

### Tier 1 — 零配置，纯前端直连（优先做）

| 意图关键词示例 | 调用 | 回复示例 |
|----------------|------|----------|
| 每日英语 / 来句英语 / 十二英语 | 词霸 dsapi | 读英文 + 中文 + 播 mp3 |
| 英语名言 | 扇贝 dailyquote | 读 EN + 中文翻译 |
| 背诗 / 古诗 / 诗词 | 诗泉 random | 读标题+作者+全诗 |
| 诗句 / .today 诗 | 今日诗词 | 读一首 |
| 一句话 / 名言 | 一言 hitokoto | 随机美句 |
| 查单词 XX / XX 什么意思 | 词霸词典 | 释义 + 可 TTS 英文词 |
| 天气 | Open-Meteo | 真气温 |
| XX 是谁 / 什么是 | 维基 search | 读摘要 |
| 唱儿歌 / 搜歌 XX | 酷狗搜索 | 「找到《小星星》~」（暂只报名） |

**预计改动：** `tools/` 多模块 + `agent-router` 意图正则 + `processUserInputAsync`

### Tier 2 — 免费注册一次（可选增强）

[接口盒子 apihz.cn](https://www.apihz.cn/) 注册得 **id + key**（免费，约 10 次/分钟）：

| 功能 | 接口 |
|------|------|
| 讲笑话 | `xiaohua.php` |
| 成语 / 成语故事 | `sjcy.php`（含出处、例句、英文） |
| 随机谚语 | 随机谚语 API |
| 脑筋急转弯 | 平台有相关接口，需查文档选 ID |
| 小学数学题 | API ID 2244 |

> **不要**用公共 `88888888/88888888`：实测永久「调用频次过快」。

配置方式：设置页填 `apihzId` / `apihzKey` 存 localStorage，或部署时 `NEXT_PUBLIC_APIHZ_ID`（Key 放前端有泄露风险，个人项目可接受）。

### Tier 3 — 内置内容库（故事机核心补位）

以下 **没有** 稳定、免 Key、可前端直连的免费 API，建议仓库内置 JSON（公有领域 / 自编短内容）：

| 内容 | 文件建议 | 条数建议 |
|------|----------|----------|
| 睡前故事 / 童话 | `data/stories.json` | 20–50 篇短故事 |
| 笑话 | `data/jokes.json` | 100+ 条 |
| 谜语 / 脑筋急转弯 | `data/riddles.json` | 50+ |
| 绕口令 | `data/tongue-twisters.json` | 20+ |
| 英语启蒙短句 | `data/english-kids.json` | 与词霸互补 |

**优点：** 国内 100% 可用、零依赖、可离线、可控版权。  
**缺点：** 需人工整理或采公有领域文本（如《伊索寓言》节选）。

---

## 4. 故事机功能映射（发散清单）

```
Bella 故事机模式
├── 英语
│   ├── 每日一句（词霸 ✅ / 扇贝 ✅）
│   ├── 查单词（词霸 ✅）
│   └── 英文儿歌（酷狗搜 ⚠️）
├── 语文
│   ├── 古诗（诗泉 ✅ / 今日诗词 ✅）
│   ├── 成语（apihz ⚠️ / 内置 📦）
│   ├── 谚语（apihz ⚠️）
│   ├── 美句（一言 ✅）
│   └── 抖机灵/轻幽默（一言[l] ✅ 质量一般）
├── 娱乐
│   ├── 笑话（apihz ⚠️ / 内置 📦）
│   ├── 谜语（内置 📦）
│   └── 绕口令（内置 📦）
├── 故事
│   ├── 童话 / 睡前（内置 📦）
│   ├── 寓言（内置 📦）
│   └── 成语故事（apihz 成语出处 ✅）
├── 知识
│   ├── 百科（维基 ✅）
│   ├── 天气（Open-Meteo ✅）
│   └── 哲学/科普句（一言[k] ✅）
└── 控制（已有）
    ├── 导航 / 喂食 / 学习 …
    └── 帮助
```

---

## 5. 关键 API 调用示例（已实测）

### 5.1 词霸每日英语 + mp3

```
GET https://open.iciba.com/dsapi/
→ content, note(中文), tts(mp3 URL 可 <audio> 播放)
```

### 5.2 诗泉随机诗词（无需 Key）

```
GET https://poetry.palemoky.com/api/poems/random
GET https://poetry.palemoky.com/api/poems/random?dynasty=唐
→ data.title, data.author.name, data.content[]
```

### 5.3 扇贝每日一句

```
GET https://apiv3.shanbay.com/weapps/dailyquote/quote
→ content, translation, author
```

### 5.4 一言

```
GET https://v1.hitokoto.cn/?c=i   # 诗词
GET https://v1.hitokoto.cn/?c=k   # 哲学
GET https://v1.hitokoto.cn/?c=l   # 抖机灵
```

### 5.5 酷狗搜儿歌

```
GET https://mobiles.kugou.com/api/v3/search/song?format=json&keyword=小星星&page=1&pagesize=3&showtype=1
→ data.info[].songname, album_name
```

### 5.6 接口盒子成语（需 id+key）

```
GET https://cn.apihz.cn/api/zici/sjcy.php?id=YOUR_ID&key=YOUR_KEY
→ words, jieshi, chuchu, en, liju
```

---

## 6. 不推荐 / 已排除

| 来源 | 原因 |
|------|------|
| Cloudflare Worker + DuckDuckGo | 国内被墙，见 OPEN_QA_PLAN §10 |
| xxapi.cn 多数路径 | 返回「未查询到该接口」 |
| vvhan.com | 域名解析失败 |
| pearktrue.cn | HTTP 512，且需 Key |
| laifudao 笑话 | 500 / SSL 错误 |
| 古诗文网 gushiwen.cn API | 404 |
| 公共 apihz 88888888 | 永久频次过快，不可用 |

---

## 7. 决策记录

| 问题 | 结论 |
|------|------|
| 每日英语类免费能用吗？ | ✅ 词霸（带 mp3）+ 扇贝 |
| 诗词 / 语文类？ | ✅ 诗泉 37 万首 + 今日诗词 + 一言 |
| 笑话 / 故事？ | 笑话：apihz 或内置；**故事：必须内置** |
| 歌词 / 音乐？ | 酷狗可搜；播放后续研究 |
| 普世解说？ | 维基 + 词霸查词 + 一言哲学类 |
| 全部免费零配置？ | **不行**；笑话/成语/故事需 Tier2 注册或 Tier3 内置 |
| 下一步开发？ | **Tier 1 八项** → Tier 3 故事/笑话 JSON → Tier 2 可选 |

---

## 8. 建议开发顺序

1. **Tier 1**：词霸每日英语 + 诗泉随机诗 + 天气 + 维基 + 意图路由
2. **Tier 3**：内置 `jokes.json` + `stories.json`（各 30 条起）
3. **Tier 1 续**：扇贝/一言/词霸查词/酷狗搜歌
4. **Tier 2**：设置页配置 apihz id/key → 笑话/成语

确认本清单后再动代码，避免重复踩「文档写了国内用不了」的坑。
