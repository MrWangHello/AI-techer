# 多主题内容卡片 UI 方案

> 状态：**规划稿**（评审后分阶段实现）  
> 关联：[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [CONTENT_API_RESEARCH.md](./CONTENT_API_RESEARCH.md)  
> 日期：2026-08-30

---

## 1. 现状问题

| 现状 | 问题 |
|------|------|
| 学习 Tab 固定「单词卡片」布局 | 背古诗、每日英语、笑话也在 ReplyBar 里挤一行字，**体验像聊天机器人，不像故事机** |
| 主界面 = 英语单词 | 功能已扩展到中英诗词、天气、百科，**页面仍局限在「学英语 App」** |
| 语音只改 ReplyBar 文字 | 没有**可视化主题**，用户不知道「现在在背诗还是在学英语」 |

**目标：** 语音/文字触发 Skill 后，除 ReplyBar 外，弹出**对应主题的半屏/全屏卡片**，像儿童故事机换「频道」。

---

## 2. 设计原则

1. **一个入口，多种频道** — 底部 VoiceChatBar 不变；内容用**浮层卡片**展示  
2. **Skill 决定卡片类型** — Router 返回 `contentCard.type`，UI 自动换肤  
3. **不增加 Tab 数量** — 避免 8 个 Tab；用**临时浮层**代替新页面  
4. **零成本** — 卡片内容仍来自现有 API / 本地 JSON  
5. **渐进实现** — Phase UI-1 只做 3 种卡片，其余仍走 ReplyBar

---

## 3. 信息架构

```
┌─────────────────────────────────────┐
│  现有 Tab：首页 | 宠物 | 学习 | 设置   │  ← 不变
├─────────────────────────────────────┤
│  主内容区（Tab 原生内容）              │
│  · 学习 Tab = 单词卡片（保留）         │
│  · 首页 = 快捷入口宫格（新增）         │
├─────────────────────────────────────┤
│  VoiceReplyBar（对话摘要，可保留）     │
├─────────────────────────────────────┤
│  VoiceChatBar（全局输入）              │
└─────────────────────────────────────┘
          ↑ Skill 命中时叠加
┌─────────────────────────────────────┐
│  ContentSheet 浮层（按 type 换肤）    │
│  [关闭]  [朗读]  [换一首/换一批]      │
└─────────────────────────────────────┘
```

---

## 4. 卡片类型（频道）

| type | 触发示例 | 视觉风格 | 卡片内容 |
|------|----------|----------|----------|
| `daily_english` | 每日英语 | 蓝白渐变、英文字体偏大 | EN 句 + 中文 + 可选朗读 |
| `poetry` | 背古诗、换一首 | 宣纸米色、竖排可选 | 诗名、作者、正文 |
| `joke` | 讲笑话 | 明亮黄、气泡 | 一问一答 |
| `story` | 讲故事 | 暖色插画框（静态图） | 标题 + 段落 |
| `weather` | 北京天气 | 天空蓝/灰动态图标 | 城市、温度、描述 |
| `wiki` | XX是什么 | 百科书页风 | 摘要 + 「了解更多」链到维基 |
| `word` | 换一批单词 | **沿用现有 StudyCards** | 不重复做浮层 |

**学习 Tab** 专用于**系统背单词**；语音说「背古诗」→ 弹出 poetry 卡片，**不必切 Tab**。

---

## 5. 数据流（与 Skill 对接）

```typescript
interface ContentCard {
  type: "daily_english" | "poetry" | "joke" | "story" | "weather" | "wiki";
  title?: string;
  body: string;
  subtitle?: string;      // 作者、出处
  meta?: Record<string, string>; // 温度、城市等
  ttsText?: string;       // 朗读用
  action?: "refresh" | "close"; // 卡片内「换一首」
}

interface AgentResponse {
  // ...现有字段
  contentCard?: ContentCard;
}
```

**Skill 改造（小步）：**

- `english.daily` → 返回 `contentCard: { type: 'daily_english', body, subtitle }`
- `poetry.random` → `type: 'poetry'`
- `joke.tell` / `story.tell` → 对应 type  
- `page.tsx`：`if (response.contentCard) setActiveCard(response.contentCard)`

---

## 6. 组件拆分

| 组件 | 职责 |
|------|------|
| `ContentSheet` | 底部滑出容器、关闭、遮罩 |
| `DailyEnglishCard` | 每日英语样式 |
| `PoetryCard` | 古诗样式（可竖排 CSS `writing-mode: vertical-rl`） |
| `JokeCard` | 笑话 Q/A |
| `StoryCard` | 故事段落 + 滚动 |
| `WeatherCard` | 图标 + 数字 |
| `WikiCard` | 摘要 + 外链 |

**目录建议：**

```
src/components/content/
  ContentSheet.tsx
  DailyEnglishCard.tsx
  PoetryCard.tsx
  ...
```

---

## 7. 首页宫格（可选 Phase UI-2）

在学习 Tab 之外，**首页增加「故事机宫格」**，降低 discover 成本：

```
┌────────┬────────┬────────┐
│ 每日英语 │ 背古诗  │ 讲笑话  │
├────────┼────────┼────────┤
│ 查天气  │ 背单词  │ 看宠物  │
└────────┴────────┴────────┘
```

点击 = 直接调对应 Skill + 弹卡片（与语音等价）。

---

## 8. 实施阶段

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| **UI-1** | `ContentSheet` + `PoetryCard` + `DailyEnglishCard`；2 个 Skill 返回 `contentCard` | 小 |
| **UI-2** | Joke / Story / Weather 卡片 + 首页宫格 | 中 |
| **UI-3** | 卡片内「换一首」按钮直连 Skill；TTS 朗读卡片正文 | 中 |
| **UI-4** | 古诗竖排、背景图、简单动效 | 可选 |

**建议顺序：** 先 **UI-1**（用户最能感知「背诗不是背单词界面」），再 UI-2。

---

## 9. 与「不要局限英语」的关系

| 维度 | 现在 | UI-1 之后 |
|------|------|-----------|
| 品牌感知 | 英语学习 App | **Bella 故事机 / 陪伴学习** |
| 背古诗 | 一行字 ReplyBar | **诗卷浮层** |
| 每日英语 | 一行字 | **日签卡片** |
| 单词学习 | Study Tab | **不变，仍是主学习路径** |

英语仍是**核心能力之一**，但 UI 按**内容类型**分频道，不再所有回答都挤在同一个单词卡片语境里。

---

## 10. 决策待确认

1. 卡片从**底部滑出**还是**居中 Modal**？（推荐底部 sheet，与 VoiceChatBar 同区）  
2. 弹出卡片时是否**自动 TTS 朗读**？（推荐：设置里可关）  
3. 首页宫格是否 Phase UI-1 一起做？（推荐 UI-2，先验证浮层）

确认后可从 `PoetryCard` + `DailyEnglishCard` 开始编码。
