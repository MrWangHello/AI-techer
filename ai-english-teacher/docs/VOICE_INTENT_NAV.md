# 语音意图导航方案（说句话就到，少点 Tab）

> 状态：**规划稿** — 与 [APP_PRODUCT_PLAN.md](./APP_PRODUCT_PLAN.md) · [GRADE1_3_CURRICULUM.md](./GRADE1_3_CURRICULUM.md) 配套  
> 原则：**意图识别 = 自动导航 + 直接开内容**，用户尽量不用一个个点 Tab、找卡片  
> 日期：2026-08-30

---

## 1. 核心原则

| 原则 | 说明 |
|------|------|
| **语音优先** | 说「汉字」「1加1等于几」→ 自动切 Tab + 开对应子页 + 执行动作 |
| **一语直达** | 一条语音同时完成：**导航 + 开卡片/出题 + Bella 回复** |
| **Tab 是兜底** | 学习 Tab 分科栏给「想看一眼 UI 的人」；主路径是说话 |
| **全局入口** | 首页 / 宠物 / 学习 底部 **VoiceChatBar 始终可用**，在哪都能说 |

**用户不应该这样：**

```
首页 → 点学习 → 滑到语文 → 点汉字 → 再找卡片   ❌ 太多步
```

**应该这样：**

```
任意页 → 按住说「汉字」→ 自动到 学习›语文›汉字 并开始认字   ✅
任意页 → 说「1加1等于几」→ 自动到 数学 并朗读答案           ✅
```

---

## 2. 响应结构（规划扩展）

现有 `AgentResponse` 只有 `navigate?: TabTarget`，需扩展：

```typescript
interface AgentResponse {
  intent: string;
  emotion: AgentEmotion;
  action: AgentAction;
  reply: string;

  /** 切 Tab：home | pet | study | settings */
  navigate?: TabTarget;

  /** 学习 Tab 内定位：学科.子模块 */
  studySection?: string;

  /** 直接打开内容视图（可选，与 studySection 二选一或并用） */
  contentCard?: { type: string; payload?: unknown };

  sideEffect?: "word.refresh" | "math.drill.start" | string;
}
```

**page.tsx 分发（规划）：**

```typescript
if (response.navigate) setActiveTab(response.navigate);
if (response.studySection) setStudySection(response.studySection);
if (response.contentCard) setContentCard(response.contentCard);
// reply → ReplyBar + TTS
```

---

## 3. 意图 → 导航映射总表

### 3.1 Tab 级（大导航）

| 用户说法示例 | Skill | navigate | studySection | 动作 |
|-------------|-------|----------|--------------|------|
| 回首页 / 主页 | `nav.home` | `home` | — | — |
| 看宠物 / 看 Bella | `nav.pet` | `pet` | — | — |
| 打开设置 | `nav.settings` | `settings` | — | — |
| 去学习 / 学习 | `nav.study` | `study` | 上次学科或 `english.words` | — |

### 3.2 学科级（说学科名就到）

| 用户说法 | Skill | navigate | studySection |
|---------|-------|----------|--------------|
| **语文** / 学语文 / 国语 | `nav.chinese` | `study` | `chinese` |
| **英语** / 学英语 / 单词 | `nav.english` | `study` | `english.words` |
| **数学** / 算数 / 算术 | `nav.math` | `study` | `math` |
| **阅读** / 看书 / 故事 | `nav.reading` | `study` | `reading` |
| **探索** / 查一查 | `nav.explore` | `study` | `explore` |

### 3.3 子模块级（说具体名直达 — **重点**）

#### 语文

| 用户说法 | Skill | studySection | 同时执行 |
|---------|-------|--------------|----------|
| **拼音** / 学拼音 / 读拼音 | `nav.pinyin` | `chinese.pinyin` | 出第一个韵母 a |
| **汉字** / 认字 / 识字 / 学汉字 | `nav.hanzi` | `chinese.hanzi` | 出「天」或下一字 |
| **句子** / 读句子 / 学句子 | `nav.sentence` | `chinese.sentence` | 出「我是小学生。」 |
| 背古诗 / 诗词 / 来首诗 | `poetry.random` | `chinese.poetry` | API 随机一首 |
| 讲成语 / 来个成语 | `idiom.random` | `chinese.idiom` | 随机成语 |
| 美句 / 一言 | `hitokoto.quote` | `chinese.quote` | 一言 API |

#### 英语

| 用户说法 | Skill | studySection | 同时执行 |
|---------|-------|--------------|----------|
| 单词 / 背单词 / 换一批 | `nav.english.words` | `english.words` | 单词卡 / refresh |
| **句子** / 英语句子 | `nav.english.sentence` | `english.sentence` | 出情景句 |
| 每日英语 / 来句英语 | `english.daily` | `english.sentence` | API + 横幅 |
| apple 什么意思 / 纯英文 | `english.lookup` | `english.words` | 查词结果 |
| 测验 / 考我 | `study.quiz` | `english.words` | 进入测验模式 |

#### 数学

| 用户说法 | Skill | studySection | 同时执行 |
|---------|-------|--------------|----------|
| **口算** / 算一算 / 练口算 / 出题 | `math.drill` | `math.drill` | **立即出第一题** |
| **应用题** / 数学题 | `word-problem.random` | `math.word-problem` | 读一道应用题 |
| **1加1等于几** / **3加5** / **9减4** | `math.calc` | `math` | **当场算出并朗读** |
| 数学 / 算数 | `nav.math` | `math.drill` | 默认入口=口算 |

**数学算式自动识别（正则，优先于泛匹配）：**

```typescript
// 命中则 math.calc 或 math.drill.answer
/(\d+|一|二|三|四|五|六|七|八|九|十)\s*(加|减|乘|除以?|\+|\-|\*|\/|×|÷)\s*(\d+|一|…)/ 
/等于几|是多少|多少/
```

示例：

| 输入 | 路由 |
|------|------|
| 「1加1等于几」 | `math.calc` → navigate study, math, reply「等于2」 |
| 「3加5呢」 | 同上 → 「等于8」 |
| 「口算」 | `math.drill.start` → 出「3+5=?」 |
| 「8」 （口算进行中） | `math.drill.answer` → 判题 |

#### 阅读

| 用户说法 | Skill | studySection | 同时执行 |
|---------|-------|--------------|----------|
| 讲笑话 / 笑话 | `joke.tell` | `reading.joke` | 随机笑话 |
| 讲故事 / 故事 | `story.tell` | `reading.story` | 随机故事 |
| 谜语 / 猜谜 | `riddle.ask` | `reading.riddle` | 随机谜语 |

#### 探索

| 用户说法 | Skill | studySection | 同时执行 |
|---------|-------|--------------|----------|
| 北京天气 / 天气 | `weather.query` | `explore.weather` | 查天气 |
| 猫是什么 / 百科 | `wiki.query` | `explore.wiki` | 维基摘要 |

---

## 4. 路由优先级（Orchestrator）

**先匹配「更具体」的意图，避免「学习」误抢「背古诗」：**

```
1. 数学算式正则          → math.calc / math.drill.answer（口算进行中）
2. 纯英文查词            → english.lookup
3. 内容 Skill 关键词     → poetry / joke / weather / … + navigate + studySection
4. 子模块导航关键词      → nav.hanzi / nav.pinyin / math.drill / …
5. 学科导航关键词        → nav.chinese / nav.math / …
6. Tab 导航              → nav.home / nav.pet / …
7. 宠物/闲聊规则         → pet.* / greeting / …
8. Fallback              → 「你可以说：语文、汉字、口算、1加1等于几…」
```

**关键改动（相对现状）：**

| 现状 | 目标 |
|------|------|
| `poetry.random` 只回文字，不切 Tab | 回诗 **+** `navigate: study` **+** `studySection: chinese.poetry` |
| `nav.study` 固定英语单词 | 「语文」→ `chinese`；「数学」→ `math.drill` |
| 无 `studySection` 字段 | types + page.tsx 实现分区状态 |
| 「1加1等于几」无路由 | 新增 `math.calc` Skill |

---

## 5. 交互流程示例

### 5.1 「汉字」

```
用户（在宠物页）：「汉字」
  ↓
Router → nav.hanzi
  ↓
AgentResponse {
  navigate: "study",
  studySection: "chinese.hanzi",
  reply: "好呀！我们来认字~ 这是『天』，天空的天！",
  contentCard: { type: "hanzi", id: "tian" }
}
  ↓
UI：切到学习 Tab → 语文 Segmented → 汉字子页 → 显示「天」+ ☁️ 图
TTS：朗读 reply
```

### 5.2 「1加1等于几」

```
用户：「1加1等于几」
  ↓
Router → math.calc（正则优先）
  ↓
AgentResponse {
  navigate: "study",
  studySection: "math",
  reply: "1 加 1 等于 2！",
  emotion: "happy"
}
  ↓
UI：切到数学 Tab，ReplyBar 显示算式与答案（可选小算式动画）
TTS：朗读
```

### 5.3 「口算」

```
用户：「口算练习」
  ↓
Router → math.drill.start
  ↓
AgentResponse {
  navigate: "study",
  studySection: "math.drill",
  sideEffect: "math.drill.start",
  reply: "小猴子摘桃啦！4 加 3 等于几？",
  contentCard: { type: "math-drill", a: 4, b: 3, op: "+" }
}
  ↓
UI：数学口算全屏，🍑🍑🍑🍑 + 🍑🍑🍑 = ?
用户说「7」或点 [7] → math.drill.answer → 判对错 → 自动下一题
```

### 5.4 「背古诗」（已有 Skill，补导航）

```
用户：「背古诗」
  ↓
poetry.random + navigate + studySection
  ↓
UI：语文 › 拓展 › 古诗卷轴卡片 + 朗读全诗
```

---

## 6. 「换一个」上下文续接

| 当前 studySection | 用户说「换一个/换一篇/再来一个」 |
|-------------------|--------------------------------|
| `chinese.poetry` | 再抽一首古诗 |
| `chinese.idiom` | 再抽成语 |
| `reading.joke` | 再讲笑话 |
| `english.words` | word.refresh |
| `math.drill` | 下一道口算 |
| `chinese.hanzi` | 下一个汉字 |

Orchestrator 需 **SessionContext 记 lastStudySection**，泛化「换一个」不总是换单词。

---

## 7. 帮助话术（help.list 更新）

```
你可以直接说：
· 学科：语文、英语、数学、阅读
· 语文：拼音、汉字、句子、背古诗、讲成语
· 英语：单词、句子、每日英语
· 数学：口算、应用题、1加1等于几
· 阅读：讲笑话、讲故事
· 探索：北京天气、猫是什么
· 导航：回首页、看宠物、打开设置
不用点 Tab，说出来我就带你去！
```

---

## 8. 实施清单（P0 与语音 V-1 并行）

| # | 任务 | 文件 |
|---|------|------|
| 1 | `AgentResponse` 加 `studySection` | `core/types.ts` |
| 2 | page 状态 `studySection` + 分科 UI | `page.tsx` |
| 3 | 学科/子模块 nav 规则 | `skills/rule-skills.ts` 或 `nav-skills.ts` |
| 4 | `math.calc` + 算式正则 | `skills/math-skills.ts` |
| 5 | 所有 content Skill 返回 navigate+studySection | `content-skills.ts` |
| 6 | 「换一个」上下文 | `orchestrator.ts` + SessionContext |
| 7 | help.list 更新 | `rule-skills.ts` |

---

## 9. 决策记录

| 问题 | 结论 |
|------|------|
| 还要不要 Tab 分科？ | **要**，但作视觉兜底；主路径是语音导航 |
| 说「语文」去哪？ | `study` + `chinese`（默认汉字或上次子页） |
| 说「1加1等于几」去哪？ | `study` + `math`，当场算，不必先进口算练习 |
| 说「汉字」去哪？ | `study` + `chinese.hanzi`，直接出字 |
| 内容 Skill 切不切 Tab？ | **切**，ReplyBar 单独回复不够，要看到卡片/题面 |
| 实现层？ | 规则 Router 先上；以后 LLM 只换意图层，studySection 不变 |
