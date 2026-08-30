# Bella 功能说明书

> 评测与 AI 开发的人类可读清单。机器可读源：[`src/lib/eval/feature-catalog.ts`](../src/lib/eval/feature-catalog.ts)  
> 评测方法与分数：[`EVALUATION.md`](./EVALUATION.md)  
> 用例与代码映射：[`TEST_CASES.md`](./TEST_CASES.md)

**产品：** AI-techer / Bella（1–3 年级 Web 学习助手）  
**线上：** https://mrwanghello.github.io/AI-techer/  
**原则：** 语音优先 · 点击兜底 · 零后端 · 规则 Router + Skills

---

## 1. 产品结构

```
首页  宠物  学习  设置
              │
     英语 / 语文 / 数学 / 阅读 / 探索
```

全局底部：`VoiceChatBar`（轻点说话 / 长按连说 / 键盘文字）

管道：`语音/文字 → orchestrator → Skill → 回复 + 导航 + TTS`

---

## 2. 功能一览（按评测状态）

状态：`ok` 可用 · `partial` 半成品 · `broken` 承诺与行为不符 · `placeholder` 仅占位

| ID | 功能 | 语音说法（示例） | 点击兜底 | 离线 | 状态 |
|----|------|------------------|----------|------|------|
| help.list | 帮助 | 帮助、你能做什么 | 否 | 是 | ok |
| nav.home / pet / study / settings | Tab 导航 | 回首页、看宠物、开始学习、打开设置 | 是 | 是 | ok |
| english.words | 学英语单词 | 学英语 | 是 | 是 | ok |
| dict.en / dict.zh | 词典 | apple什么意思、书本用英语怎么说 | 是 | 是 | ok |
| english.daily | 每日英语 | 每日英语 | 是 | 部分 | partial |
| study.quiz | 单词测验 | 测验、考我 | 是（按钮） | 是 | partial |
| chinese.hanzi / pinyin / sentence | 汉字拼音句子 | 汉字、拼音、读句子 | 是 | 是 | ok |
| chinese.poetry | 古诗 | 背古诗 | 是 | 是 | ok |
| chinese.idiom | 成语 | 成语 | 是 | 是 | ok |
| chinese.quote | 美句 | 美句 | 是 | 是 | ok |
| math.drill | 口算 | 口算；说数字答题 | 是 | 是 | ok |
| math.calc | 自由计算 | 1加1等于几 | 否 | 是 | ok |
| math.word-problem | 应用题 | 应用题 | 是 | 是 | **broken** |
| reading.story / joke | 故事笑话 | 讲故事、讲笑话 | 是 | 是 | ok |
| explore.weather | 天气 | 北京天气 | 提示文案 | 否 | partial |
| explore.wiki | 百科 | 猫是什么 | 提示文案 | 是（snippets） | ok |
| pet.* | 喂食玩耍洗澡睡觉 | 喂食、陪我玩… | 是 | 是 | ok |
| study.checkin | 签到 | 签到 | 是 | 是 | ok |
| pet.dressup | 装扮 | 装扮 | 否 | 是 | placeholder |
| chat.greeting | 打招呼 | 你好 | 否 | 是 | ok |
| kb.manage | 知识库 | 知识库、打开知识库 | 是（设置来源 + /kb + 邮箱口令入库） | 是 | **partial** |

完整短语与期望 intent 以 `feature-catalog.ts` 为准。

---

## 3. 模块说明（学习）

### 3.1 英语

- **单词卡**：`StudyCards`，词库 `words.json`（187）+ 换一批；朗读走 `voiceSpeed`
- **词典**：本地同步查词，不请求外网；未收录立即 miss 提示  
- **知识库**：设置勾数据来源；`/kb/new` 粘贴预览；口令用家长邮箱后写入 Supabase。见 `KB_DESIGN.md` / `KB_SETUP.md`。
- **句子**：语音「每日英语」可走 API；点击子 Tab 用 `english-sentences/grade1.json`

### 3.2 语文

拼音 / 汉字 / 句子 / 古诗 / 成语 / 美句 / 故事（子 Tab）。  
注意：语音「讲故事」进 **阅读.故事**，不是语文.故事。

### 3.3 数学

- **口算**：键盘缓冲 + 确定；语音数字 /「答案是8」/「10个」；口算中屏蔽导航
- **自由计算**：非口算模式下「1加1等于几」
- **应用题**：能出题，**不能判答案**（评测记 broken）

### 3.4 阅读 / 探索

故事、笑话本地 JSON。天气需联网。百科在线失败用 `wiki-snippets.json`。

---

## 4. 宠物与设置

- 5 个 MP4 mood；戳猫 TTS
- 饱腹/心情无时间衰减
- 成就 10 项，阈值与词库规模不完全一致
- 设置：改名、语速滑块 + 试听、清数据（不清 `bella_word_batch`）

---

## 5. 数据资产

| 文件 | 用途 | 量级 |
|------|------|------|
| words.json | 英汉词 | 187 |
| hanzi/pinyin/sentences grade1 | 语文卡 | 15–20 |
| short-poems.json | 短诗 | 8 |
| chinese-stories.json | 中文故事 | ~6 |
| idioms.json | 成语 | 22 |
| jokes.json | 笑话 | 7 |
| wiki-snippets.json | 离线百科 | ~10 |
| stories.json | 英文故事 | **未接入 UI** |

---

## 6. 维护约定（给后续 AI）

1. 新功能先改 `feature-catalog.ts`，再写 `feature-catalog.test.ts` 会自动覆盖语音短语
2. 修 bug 写 `PROJECT_MEMORY.md`
3. 承诺给用户的语音能力必须 `status=ok`，否则标 `broken`/`partial`
