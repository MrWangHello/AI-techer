# 学习模块可行性调研（入口门禁清单）

> 状态：**调研完成** — 未达门禁的功能 **不得** 在首页/学习 Tab 做正式入口  
> 关联：[APP_PRODUCT_PLAN.md](./APP_PRODUCT_PLAN.md) · [CONTENT_API_RESEARCH.md](./CONTENT_API_RESEARCH.md)  
> 实测日期：2026-08-30（Cloud Agent fetch + CORS 模拟 + 代码对照）

---

## 1. 调研方法

| 步骤 | 说明 |
|------|------|
| API 连通 | `fetch` / `curl` 200 且 JSON 可解析 |
| 浏览器 CORS | 带 `Origin: https://mrwanghello.github.io` 检查 `Access-Control-Allow-Origin` |
| 代码实现 | 仓库内是否已有 Skill + Provider |
| 内容量 | 内置 JSON 条数是否够「故事机」体验 |
| 入口门禁 | 🟢 可上入口 · 🟡 有限开放 · 🔴 暂不上入口 |

---

## 2. 总表（先看这个）

| 模块 | 子功能 | API/数据源 | CORS | 代码已有 | 内容量 | 门禁 |
|------|--------|------------|------|----------|--------|------|
| **英语** | 单词练习/测验 | 内置 `words.json` | — | ✅ StudyCards | 187 词 | 🟢 |
| **英语** | 每日一句 | 扇贝→一言→词霸→内置 | 扇贝⚠️ 其余✅ | ✅ Skill | 充足 | 🟢 |
| **英语** | 查单词 | 词霸移动词典 | ✅ | ✅ Skill | — | 🟢 |
| **语文** | 古诗词 | 诗泉 poetry.palemoky.com | ✅ `*` | ✅ Skill | 37 万首 | 🟢 |
| **语文** | 美句/摘录 | 一言 `?c=i` | ✅ `*` | ✅ Skill | 充足 | 🟢 |
| **语文** | 成语 | **内置 `idioms.json` 随机** + apihz 可选增强 | — | ❌ 未做 | 目标 **≥50 条** | 🟢 **必做（内置）** |
| **阅读** | 笑话 | 内置 `jokes.json` | — | ✅ Skill | **仅 5 条** → 目标 ≥30 | 🟢 必扩内容 |
| **阅读** | 短故事 | 内置 `stories.json` | — | ✅ Skill | **3 篇英文** → 目标 ≥20 中文 | 🟢 必扩内容 |
| **阅读** | 谜语 | 内置 `riddles.json`（规划） | — | ❌ | 目标 ≥20 | 🟡 Phase 2 |
| **探索** | 天气 | Open-Meteo | ✅ `*` | ✅ Skill | — | 🟢 |
| **探索** | 百科 | 维基 REST | ✅ `*` | ✅ Skill | — | 🟢 |
| **数学** | 口算练习 | **内置算法生成 + 语音/点选答题** | — | ❌ 未做 | 无限 | 🟢 **必做** |
| **数学** | 小计算器 | **内置 eval**（「1加1等于几」） | — | ❌ 未做 | 无限 | 🟢 **必做** |
| **数学** | 应用题 | 内置 `word-problems.json` + apihz 可选 | ✅ `*` | ❌ 未做 | 内置≥15 + API 2万 | 🟢 内置先做 |

---

## 3. 分模块详情

### 3.1 英语

#### 单词练习 / 测验 🟢

| 项 | 结论 |
|----|------|
| 数据 | `src/data/words.json` 187 词，`WordPoolService` 每批 20 |
| 入口 | 学习 Tab › 英语 › 单词练习（**现有主界面**） |
| 首页 | 可放「背单词」快捷入口 |

#### 每日一句 🟢

| 项 | 结论 |
|----|------|
| 现实现 | `providers/daily-english.ts` 多源降级 |
| 主源 | 扇贝 `apiv3.shanbay.com/weapps/dailyquote/quote` |
| CORS 注意 | 扇贝响应 **常无** `Access-Control-Allow-Origin`；浏览器可能偶发失败 → 已链式降级 |
| 降级链 | 扇贝 → 一言 → 词霸（词霸浏览器 CORS 也差）→ 内置 4 句 |
| 实测 | 服务端 200；手机端以降级链保证总有内容 |
| 入口 | 学习 › 英语 › 每日一句；首页可快捷 |

#### 查单词 🟢

| 项 | 结论 |
|----|------|
| API | `dict-mobile.iciba.com/.../getsuggest` |
| 代码 | `english.lookup` Skill + 纯英文输入兜底 |
| 入口 | 语音为主；学习 › 英语可加查词框（Phase 2 UI） |

---

### 3.2 语文

#### 古诗词 🟢 **已具备，可规划入口**

| 项 | 结论 |
|----|------|
| API | `GET https://poetry.palemoky.com/api/poems/random` |
| 返回 | `title`, `author.name`, `content[]` |
| CORS | ✅ `access-control-allow-origin: *` |
| 代码 | ✅ `poetry.random` Skill，`providers/poetry.ts` |
| 备用 | 今日诗词 `v1.jinrishici.com/all`（CORS ✅，**代码未接**，可作 fallback） |
| 入口 | **可**做学习 › 语文 › 古诗词 + 诗卷卡片 UI |

#### 美句 🟢 **已具备，可规划入口**

| 项 | 结论 |
|----|------|
| API | `GET https://v1.hitokoto.cn/?c=i`（诗词类） |
| CORS | ✅ `*` |
| 代码 | ✅ `hitokoto.quote` Skill（关键词：一言、美句、名言） |
| 说明 | 与「古诗词」不同源：一言偏短句摘录，诗泉偏完整诗词 |
| 入口 | 学习 › 语文 › 美句 |

#### 成语 🟢 **必做 — 内置 JSON 为主，API 为辅**

| 项 | 结论 |
|----|------|
| **原则** | **没有稳定 API 也要做** → 内置成语库随机抽取，与笑话/故事同一套路 |
| 主方案 | `src/data/idioms.json` **≥50 条**：`word`, `pinyin`, `meaning`, `origin`, `example` |
| 代码 | 规划 `idiom.random` Skill + `pickRandomIdiom()`（仿 `joke.tell`） |
| 语音 | 「讲个成语」「换一个成语」「什么意思」→ 读成语+解释+例句 |
| API 增强 | apihz `sjcy.php`（CORS ✅）— **可选**，设置页填 Key 后无限扩充 |
| 入口 | 学习 › 语文 › 成语 — **与古诗/美句并列，开发时同步写 JSON** |

**idioms.json 单条结构（规划）：**

```json
{
  "word": "守株待兔",
  "pinyin": "shǒu zhū dài tù",
  "meaning": "比喻不主动努力，而存万一的侥幸心理。",
  "origin": "《韩非子·五蠹》",
  "example": "学习不能守株待兔，要主动练习。"
}
```

> 公共 apihz Key 会限频 → **不依赖 API 也能上线**；有 Key 时再叠加在线随机。

---

### 3.3 阅读

#### 笑话 🟡 **能讲，内容太少**

| 项 | 结论 |
|----|------|
| 数据 | `src/data/jokes.json` — **仅 5 条** |
| 代码 | ✅ `joke.tell` Skill |
| API 备选 | apihz `xiaohua.php`（需 Key，同成语） |
| 门禁 | 语音可说「讲笑话」；**首页宫格暂缓**，扩到 **≥30 条** 再开放 |

#### 短故事 🟡 **能讲，偏英文且太少**

| 项 | 结论 |
|----|------|
| 数据 | `src/data/stories.json` — **3 篇英文** |
| 代码 | ✅ `story.tell` Skill |
| API | **无**稳定免费童话 API（见 CONTENT_API_RESEARCH Tier 3） |
| 门禁 | 扩 **中文短故事 20+ 篇** 后再做「阅读 › 故事」入口 |

---

### 3.4 探索

#### 天气 🟢

| 项 | 结论 |
|----|------|
| API | Open-Meteo 地理编码 + forecast |
| CORS | ✅ `*` |
| 代码 | ✅ `weather.query` Skill |
| 入口 | 学习 › 探索 › 天气；首页可镜像快捷 |

#### 百科 🟢

| 项 | 结论 |
|----|------|
| API | `zh.wikipedia.org/api/rest_v1/page/summary/{title}` |
| CORS | ✅ `*`；请求需合理 `User-Agent`（已实现） |
| 代码 | ✅ `wiki.query` Skill |
| 限制 | 词条需用户说得较标准；404 走兜底 |
| 入口 | 学习 › 探索 › 百科 |

---

### 3.5 数学（必做模块 — 不依赖外部 API）

> **「口算」是什么？** 见下 §3.5.1。数学 **一定要做**，用内置算法即可，开发量约 1–2 天。

#### 3.5.1 「口算」产品定义（回答：是不是 1+1=2 那种？）

**是的，主要就是这种。** 分两种交互，都要支持：

| 模式 | 谁出题 | 示例 | 怎么答 | 用途 |
|------|--------|------|--------|------|
| **A. 出题练（主模式）** | App / Bella | 「3 加 5 等于几？」「6 乘 7 等于几？」 | 用户 **语音说「8」** 或 **点数字键** | 练习、计分、连对奖励 |
| **B. 问算式（辅模式）** | 用户 | 「1 加 1 等于几」「23 减 17」 | App **内置算出并朗读**「等于 2」 | 小计算器、查答案 |

**模式 A 完整流程（口算练习）：**

```
用户：「口算练习」/ 点「开始口算」
  ↓
Bella：「3 加 5 等于几？」（屏幕大字显示 3 + 5 = ?）
  ↓
用户：语音「8」或点 [8]
  ↓
Bella：「对了！真棒！」+ 宠物 happy；连对 +1 金币
  ↓
自动下一题：「9 减 4 等于几？」…
```

**模式 B 完整流程（小计算器）：**

```
用户：「1 加 1 等于几」
  ↓
内置 parser：识别「加/减/乘/除」+ 数字 → eval
  ↓
Bella：「1 加 1 等于 2」+ TTS 朗读
```

**与「应用题」的区别：**

| 类型 | 形式 | 例子 |
|------|------|------|
| **口算** | 纯算式，无文字情境 | `3 + 5 = ?` |
| **应用题** | 文字描述 + 计算 | 「小明有 10 个球，5 个红的，几个蓝的？」 |

#### 3.5.2 口算练习 — 内置生成 🟢 必做

| 项 | 结论 |
|----|------|
| 外部 API | **不需要** |
| 实现 | `lib/math/generator.ts` — 按年级随机 `a op b = ?` |
| UI | `MathDrill` 组件：大题面 + 数字键盘 + 连对计数 |
| Skill | `math.drill.start` / `math.drill.answer`；语音「口算」「下一题」 |
| 年级规则 | 一：±10；二：±100、表内乘除；三–四：混合 |
| 优点 | 零成本、离线、无限题、GitHub Pages 100% 可用 |

```typescript
// 一年级：3 + 5 = ?  9 - 4 = ?
// 二年级：23 + 17 = ?  6 × 7 = ?
// 可选：限时、连对奖励（接宠物金币）
```

#### 3.5.3 小计算器 — 内置 eval 🟢 必做

| 项 | 结论 |
|----|------|
| 实现 | `lib/math/evaluate.ts` — 解析「三加五」「1加1等于几」 |
| Skill | `math.calc` — 关键词：等于几、加、减、乘、除 |
| 安全 | 仅允许整数 + 四则运算，拒绝其它字符 |

#### 3.5.4 应用题 — 内置模板优先 🟢

| 项 | 结论 |
|----|------|
| **主方案** | `data/word-problems.json` **≥15 道** 低年级应用题（含答案、解析） |
| 代码 | `word-problem.random` Skill，随机抽题 + 语音读题 |
| API 增强 | apihz `shuxuex.php`（CORS ✅，需 Key）— 有 Key 时无限扩充 |
| 与口算 | 数学 Tab 下两个子页：**口算** + **应用题** |

#### npm 口算库调研（2026-08-30）

| 包名 | 适用 | 结论 |
|------|------|------|
| [`primaryoralmathpack`](https://github.com/bosichong/primaryoralmathpack) | 中国小学口算 | 支持加减乘除、进位退位、步数、范围；**中文文档**，但包较老、维护少 |
| [`maths-game-problem-generator`](https://github.com/RobinL/maths-game-problem-generator) | 英国小学 Year1–6 | 零依赖、TypeScript 友好；**按 yearLevel 分级**，与国标需映射 |
| [`samathgen`](https://github.com/Sadykhzadeh/samathgen) | 通用表达式 | 轻量，可出选择题选项 |
| [`math-tasks-generator`](https://github.com/ArtemZhyto/math-tasks-generator) | 应用题模板 | 可配变量/约束生成文字题，偏复杂 |

**推荐：**

- **口算**：自写 ~50 行生成器（最简单、零依赖、完全可控年级）**或** 引入 `maths-game-problem-generator` 做 yearLevel 映射
- **应用题**：优先 apihz `shuxuex.php`（已实测返回完整 `timu/daan/jiexi`）；备选 `math-tasks-generator` 内置 5–10 个中文模板

**apihz 应用题实测样例（公共 Key 冷却后可 200）：**

```json
{
  "code": 200,
  "timu": "小明手上有一些红球和一些蓝球，他数了数一共有10个球。如果小明手上有5个红球，那么他手上有几个蓝球？",
  "daan": "小明手上有5个蓝球。",
  "jiexi": "首先知道小明手上一共有10个球，其中5个是红球，那么剩下的就是蓝球。所以，手上有10 - 5 = 5个蓝球。"
}
```

**apihz 成语实测样例：**

```json
{
  "code": 200,
  "words": "掩其无备",
  "jieshi": "掩：掩袭；备：防备。称乘敌方毫无防备时进行突袭。",
  "chuchu": "《孙子·计篇》：「攻其无备，出其不意。」",
  "liju": "若经城勿攻，西入长安，～，天子虽还，失其襟带。",
  "en": "..."
}
```

> 公共 `88888888/88888888`：**CORS ✅**，但连续调用会 400 频次限制；生产需用户自注册 Key 或走内置 JSON。

#### 其他数学 API（已排除）

| 来源 | 结论 |
|------|------|
| 天聚/xxapi 数学 | demo 无效或要 Key |
| AI 批改 `aishuxue` | 要上传图片，不适合语音故事机 |

**数学模块结论：**

```
必做（不依赖 API）：
  M1  math/generator.ts + math/evaluate.ts   — 出题 + 小计算器
  M2  MathDrill UI + math.drill / math.calc Skill
  M3  word-problems.json ≥15 + word-problem Skill

可选增强：
  M4  apihz shuxuex（设置页 Key）— 应用题无限库
  M5  npm 口算库 — 仅当自写规则不够用再引

数学 Tab + 首页宫格：M2 完成即 🟢 开放（与扩 JSON 并行，不灰显等 API）
```

---

## 4. 首页 / 学习 Tab 入口门禁（修订）

### 4.1 首页宫格 — 什么能放

| 宫格 | 门禁 | 条件 |
|------|------|------|
| **英语** | 🟢 现在可放 | 单词+每日一句+查词均已实现 |
| **语文** | 🟢 现在可放 | **古诗词 + 美句 + 成语**（成语同步写内置 JSON） |
| **阅读** | 🟢 可放 | 笑话/故事 Skill 已有；**同步扩 JSON**，UI 可先做列表 |
| **探索** | 🟢 现在可放 | 天气+百科 |
| **数学** | 🟢 **必做** | M2（口算 UI + 计算器 Skill）完成即亮，**不等 API** |
| **宠物** | 🟢 | 跳转宠物 Tab |

### 4.2 学习 Tab 学科栏 — 什么能放

| 学科 | 子页 | 门禁 |
|------|------|------|
| **英语** | 单词练习 / 每日一句 / 查词 | 🟢 单词现成；后两个可先语音+简易卡片 |
| **语文** | 古诗词 / 美句 / 成语 | 🟢🟢🟢 成语 **必做**，内置 JSON + Skill |
| **阅读** | 笑话 / 故事 / 谜语 | 🟢 笑话故事必扩 JSON；谜语 Phase 2 |
| **探索** | 天气 / 百科 | 🟢 |
| **数学** | 口算 / 小计算器 / 应用题 | 🟢🟢🟢 **整栏必做** |

---

## 5. 内置内容必做清单（Tier 3 — 无 API 也要丰富）

> **原则：没有灵活 API → 内置 JSON + 随机抽取。** 开发与扩内容 **并行**，不因条数少就不做模块。

| 文件 | 现条数 | **必做目标** | 对应 Skill | 优先级 |
|------|--------|-------------|------------|--------|
| `idioms.json` | 0 | **≥50** | `idiom.random` | **P1 必做** |
| `word-problems.json` | 0 | **≥15** | `word-problem.random` | **P1 必做** |
| `jokes.json` | 5 | **≥30** | `joke.tell` ✅ | P1 扩内容 |
| `stories.json` | 3（英文） | **≥20 中文** | `story.tell` ✅ | P1 扩内容 |
| `riddles.json` | 0 | **≥20** | `riddle.ask` | P2 |
| `tongue-twisters.json` | 0 | **≥10** | `tongue-twister.say` | P3 可选 |
| `proverbs.json` | 0 | **≥20** | `proverb.say` | P3 可选 |
| `daily-english` 内置 | 4 | 20 | 降级链 | P2 |
| 口算/计算器 | 0 | 算法文件 | `math.drill` `math.calc` | **P1 必做** |

**成语 / 笑话 / 故事 / 应用题 — 同一实现模式：**

```
data/*.json  →  pickRandom()  →  Skill  →  TTS 朗读  →  「换一个」再抽
```

---

## 6. 语音交互（已确认，调研不涉及 API）

按 [APP_PRODUCT_PLAN.md §5](./APP_PRODUCT_PLAN.md) 执行，与内容模块 **并行**：

1. **V-1** 按住说话  
2. **V-2** 点按 + 1.5s 静音发送  
3. **V-3** 上滑取消 + 设置默认模式  

---

## 7. 修订后的实施顺序

| 顺序 | 任务 | 说明 |
|------|------|------|
| **0** | 语音 V-1 按住说 | 体验稳定 |
| **1a** | 学习 Tab 分科壳 | **五科都显示**：英语/语文/阅读/探索/数学 |
| **1b** | **数学 M1–M2** | `generator` + `evaluate` + MathDrill UI + Skill |
| **1c** | **成语 + 应用题 JSON** | `idioms.json`≥50、`word-problems.json`≥15 + Skill |
| **1d** | 扩 `jokes`/`stories` | ≥30 笑话、≥20 中文故事（可与 1c 并行） |
| **2** | PoetryCard + DailyEnglishCard + IdiomCard | 学科内卡片 UI |
| **3** | 首页历史 + 宫格 | 六格全开（数学不再灰显） |
| **4** | apihz Key 设置（可选） | 成语/应用题/笑话在线增强 |
| **5** | 谜语 `riddles.json` | 阅读子页扩展 |
| **6** | 语音 V-2/V-3 | 静音发送、上滑取消 |

---

## 8. 决策记录

| 问题 | 结论 |
|------|------|
| **口算是什么？** | **App 出题 → 用户语音/点选答**（主）；用户问算式 → App 算出朗读（辅） |
| 数学做不做？ | **必做** — 内置算法，1–2 天量级，不依赖 API |
| 数学有没有 API？ | 应用题 apihz 可选；**口算/计算器不需要 API** |
| 成语做不做？ | **必做** — 内置 `idioms.json`≥50 + 随机 Skill；apihz 仅增强 |
| 没 API 就不做？ | **否** — 笑话/故事/成语/应用题/谜语都走内置 JSON |
| 古诗/美句/探索？ | ✅ 已有 API + Skill |
| 还缺什么？ | 见 §5 必做清单：idioms、word-problems、扩 jokes/stories、math 算法 |
| 先做什么？ | V-1 语音 → **并行**：学习五科壳 + 数学 + 成语 JSON + 扩阅读内容 |
