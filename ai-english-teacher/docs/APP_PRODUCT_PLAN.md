# Bella 产品架构与语音交互方案（v2）

> 状态：**规划稿**（调研完成，评审后分阶段实现）  
> 关联：[MODULE_FEASIBILITY.md](./MODULE_FEASIBILITY.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [VOICE_UX_PLAN.md](./VOICE_UX_PLAN.md) · [CONTENT_API_RESEARCH.md](./CONTENT_API_RESEARCH.md)  
> 日期：2026-08-30  
> 取代/补充：原 [CONTENT_UI_PLAN.md](./CONTENT_UI_PLAN.md) 中「全局浮层卡片」思路，改为 **Tab 内学科分区 + 首页聚合**

**入口门禁：** 各模块能否上首页/学习 Tab，以 [MODULE_FEASIBILITY.md](./MODULE_FEASIBILITY.md) 总表为准 — **有内容、有代码、CORS 通，才开入口**。

---

## 1. 总体原则

| Tab | 定位 | 是否大改 |
|-----|------|----------|
| **首页** | 功能集 + 历史记录 + 快捷入口 | ✅ 增强，不动核心结构 |
| **宠物** | 卡通互动、情绪、成就 | ❌ **基本不动** |
| **学习** | **所有「学知识」能力的统一入口**，按学科/类型分区 | ✅ **重点改造** |
| **设置** | 用户属性、语音偏好、年级等 | 📋 后续扩展 |

**一句话：** 首页负责「总览与回顾」，宠物负责「陪玩」，学习负责「分科上课」，语音全局入口不变。

---

## 2. 四维属性模型（功能怎么归类）

每个 Skill / 功能用 **4 个维度** 描述，便于扩展和 UI 分区：

| 维度 | 枚举示例 | 用途 |
|------|----------|------|
| **domain 学科** | `english` `chinese` `math` `reading` `explore` | 学习 Tab 一级分区 |
| **mode 形态** | `drill` 练习 / `content` 内容消费 / `query` 问答 | 决定 UI 模板 |
| **channel 入口** | `voice` `tap` `home` `study` | 统计与历史 |
| **asset 呈现** | `card` `sheet` `list` `animation` | 页面组件选型 |

### 2.1 现有功能映射表

| 功能 | Skill ID | domain | mode | 现入口 | 目标 UI |
|------|----------|--------|------|--------|---------|
| 单词卡片/测验 | `word.*` `study.quiz` | **english** | drill | 学习 Tab | 英语 › 单词练习 |
| 每日英语 | `english.daily` | **english** | content | 语音 | 英语 › 每日一句 |
| 查单词 | `english.lookup` | **english** | query | 语音 | 英语 › 查词 |
| 背古诗/诗词 | `poetry.random` | **chinese** | content | 语音 | 语文 › 古诗词 |
| 一言美句 | `hitokoto.quote` | **chinese** | content | 语音 | 语文 › 美句 |
| 成语（待接 API） | `idiom.*` | **chinese** | content | — | 语文 › 成语 |
| 讲故事 | `story.tell` | **reading** | content | 语音 | 阅读 › 短故事 |
| 讲笑话 | `joke.tell` | **reading** | content | 语音 | 阅读 › 趣味 |
| 百科 | `wiki.query` | **explore** | query | 语音 | 探索 › 百科 |
| 天气 | `weather.query` | **explore** | query | 语音 | 探索 › 天气 |
| 数学练习（规划） | `math.*` | **math** | drill | — | 数学 › 口算/题库 |
| 导航/帮助 | `nav.*` `help.*` | — | — | 语音 | 不切 Tab，ReplyBar |
| 宠物动作 | `pet.*` | — | animation | 语音/宠物 Tab | **宠物 Tab** |

**不属于「学习」的：** 导航、宠物喂食/玩耍、签到（放首页）、设置。

---

## 3. 四个 Tab 详细设计

### 3.1 首页 — 功能集 + 历史（增强，结构保留）

```
┌─────────────────────────────────────┐
│  Bella  Lv.5  🪙88        [签到]    │
├─────────────────────────────────────┤
│  📊 今日概览                         │
│  已学 1 词 · 学习 101 分钟 · 连签 3 天 │
├─────────────────────────────────────┤
│  🚀 快捷入口（跳转学习 Tab 对应分区）  │
│  ┌──────┬──────┬──────┐             │
│  │ 英语  │ 语文  │ 阅读  │             │
│  ├──────┼──────┼──────┤             │
│  │ 探索  │ 数学  │ 宠物  │  ← 数学灰显「即将开放」│
│  └──────┴──────┴──────┘             │
├─────────────────────────────────────┤
│  📋 最近记录                         │
│  · 14:32 背古诗《静夜思》            │
│  · 14:28 每日英语 + 朗读             │
│  · 14:20 学习了 apple                │
│  · 14:15 和 Bella 聊天…             │
├─────────────────────────────────────┤
│  ⚡ 快捷操作（保留现有）              │
│  [喂食] [玩耍] [去学习]              │
└─────────────────────────────────────┘
```

**历史记录数据结构（localStorage）：**

```typescript
interface HistoryItem {
  id: string;
  ts: number;
  domain?: "english" | "chinese" | "math" | "reading" | "explore";
  skillId: string;
  title: string;       // 展示用，如「《静夜思》」
  preview: string;   // 摘要一行
  jump?: { tab: "study"; section: string }; // 点击跳回学习分区
}
```

**首页不做的事：** 不在首页展开完整背单词/背诗界面（避免与学习 Tab 重复）；只 **入口 + 摘要 + 历史**。

---

### 3.2 宠物 — 基本不动

保留现有：

- Cat3D 五 mood 视频、戳猫、喂食/玩耍/洗澡/睡觉
- 成就、等级、状态条
- 语音触发 `pet.*` 仍在这里表现动画

**可选小增强（非必须）：** 说「背古诗」时 Bella 切 `thinking` mood，但不强制跳 Tab。

---

### 3.3 学习 — 分科分区（重点改造）

学习 Tab 顶部 **学科 Segmented Control**（横向滑动）：

```
[ 英语 ] [ 语文 ] [ 阅读 ] [ 探索 ] [ 数学·Soon ]
────────────────────────────────────────
         （当前学科的内容区）
```

#### 英语

| 子模块 | 内容 | 对应现有 |
|--------|------|----------|
| **单词练习** | StudyCards + 换一批 + 测验 | ✅ 已有 |
| **每日一句** | 扇贝/API + 主题卡片 + 朗读 | Skill + 待做卡片 |
| **查单词** | 输入/语音查词 | Skill |

#### 语文

| 子模块 | 内容 | 对应现有 |
|--------|------|----------|
| **古诗词** | 诗泉随机 + 换一首 + 竖排卡片 | Skill + 待做卡片 |
| **美句摘录** | 一言 | Skill |
| **成语** | apihz / 内置 | 🔴 **暂不做 Tab**（API 有、代码无；需 `idioms.json`≥30 或 Key） |

#### 阅读

| 子模块 | 内容 | 对应现有 |
|--------|------|----------|
| **短故事** | 内置 JSON（现 3 篇英文） | Skill；🟡 **UI 暂缓**至中文≥20 篇 |
| **笑话** | 内置 JSON（现 5 条） | Skill；🟡 **宫格暂缓**至≥30 条 |

#### 探索

| 子模块 | 内容 | 说明 |
|--------|------|------|
| **百科** | 维基摘要 | 偏查询 |
| **天气** | Open-Meteo | 偏查询 |

#### 数学（预留）

| 子模块 | 内容 | 说明 |
|--------|------|------|
| **口算练习** | 客户端生成（推荐自写或 npm 库） | 🔴 **M1 做完前整栏不显示** |
| **应用题** | apihz `shuxuex.php`（CORS ✅，需 Key） | 🟡 M1 后可选子入口 |

**学习 Tab 内 UI 模板（3 种）：**

```
mode=drill   → 单词卡 / 测验 / 口算（交互+计分）
mode=content → 主题卡片（古诗卷轴、英语日签、故事页）
mode=query   → 搜索框 + 结果卡（查词、百科、天气）
```

**语音与学习 Tab 联动：**

- 说「背古诗」→ `navigate: study` + `studySection: chinese.poetry` + 打开古诗卡片
- 说「每日英语」→ `studySection: english.daily`
- 说「开始测验」→ `studySection: english.words` + quiz mode

```typescript
interface AgentResponse {
  navigate?: TabTarget;
  studySection?: string; // e.g. "chinese.poetry"
  contentCard?: ContentCard; // 可选，直接打开对应 mode=content 视图
}
```

---

### 3.4 设置 — 用户属性（规划）

| 分组 | 字段 | 用途 |
|------|------|------|
| **个人** | 昵称、年级（1–9 / 成人）、头像 | 内容难度、称呼 |
| **语音** | 语速、自动朗读、**输入模式**（见 §5） | 已有语速，扩展 |
| **学习偏好** | 默认学科、每日目标（词数/分钟） | 首页目标环 |
| **数据** | 清除缓存、导出（可选） | 已有重置 |

年级影响：词汇批次难度、古诗推荐朝代、数学题难度（将来）。

---

## 4. 与 Skill 架构的关系

```
Voice / 点击
    ↓
handleUserMessage()
    ↓
Router → Skill（带 domain + mode 元数据）
    ↓
AgentResponse { reply, navigate, studySection, contentCard, sideEffect }
    ↓
page.tsx 分发：
  · navigate → 切 Tab
  · studySection → 学习 Tab 切学科+子模块
  · contentCard → 渲染对应模板
  · 写入 history → 首页最近记录
```

**Skill 注册表扩展（规划）：**

```typescript
interface SkillMeta {
  id: string;
  domain: "english" | "chinese" | "math" | "reading" | "explore" | null;
  mode: "drill" | "content" | "query" | null;
  studySection?: string;
}
```

后续换 LLM Agent：**只改 Router 输出 skillId**，meta 与 UI 不变。

---

## 5. 语音交互方案 v2（对标成熟产品）

### 5.1 现状（已实现）

| 模式 | 行为 | 问题 |
|------|------|------|
| **点按** | 点一下 → 正在听 → 说一句 → STT 结束 → 自动发送 | 只能说一句；12s 无声音超时 |
| **文字** | 键盘切换 | 降级通路 ✅ |

### 5.2 成熟产品怎么做

| 产品 | 交互 | 适用场景 |
|------|------|----------|
| **微信** | **按住说话**；松手发送；上滑取消；上滑锁定后连续说再点发送 | 国内用户最熟悉 |
| **豆包 / 通义** | 点按开麦，**静音 ~1–2s 自动结束**并发送；可连续多句 | 对话式 Agent |
| **ChatGPT Voice** | 点按进入会话，**连续对话**，静音结束一轮 | 多轮 |
| **Siri / 小爱** | 唤醒词或按住，静音检测结束 | 系统级 |

**Web Speech API 可做：**

- `continuous: true` + `interimResults: true` → 边说边出字
- 客户端 **VAD（静音检测）**：interim 无更新超过 **1.5s** → 视为说完了，自动发送
- **按住模式**：`mousedown/touchstart` 开始，`mouseup/touchend` 结束并发送（类似微信）
- **点按模式（保留）**：`continuous: false`，说一句就停（现状）

### 5.3 推荐：双模式 VoiceChatBar

```
┌─────────────────────────────────────────────┐
│  ⌨️  │  🎤 按住说话 · 松手发送              │  ← 默认
│      │  或轻点一下 · 停顿后自动发送          │  ← 设置里可切换默认
└─────────────────────────────────────────────┘
```

| 模式 | 触发 | 结束条件 | 超时 |
|------|------|----------|------|
| **A. 按住说话**（推荐默认） | `touchstart` / `mousedown` | `touchend` 发送；上滑取消 | 最长 60s |
| **B. 点按 + 静音发送** | 点一下 | interim 停顿 **1.5s** 自动发送；再点停止 | 首包无语音 8s 提示 |
| **C. 文字** | 切键盘 | Enter 发送 | — |

**取消手势（Phase 2）：** 按住时上滑 > 40px → 红色「松开取消」，与微信一致。

**不再用「固定 12s 一刀切」：**

- 按住模式：仅 **60s 硬上限**（防挂死）
- 点按+静音模式：**1.5s 静音** 发送 + **8s 完全无识别** 提示「没听到」

### 5.4 技术要点

```typescript
// speech.ts 扩展
interface ListenOptions {
  mode: "tap" | "hold";
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  silenceMs?: number;  // 默认 1500
  maxMs?: number;      // hold 60000, tap 8000
}

// continuous + interimResults
recognition.continuous = mode !== "tap-single";
recognition.interimResults = true;
```

**注意：** 浏览器 STT 质量因机型差异大；设置里提供 **默认模式** + **静音灵敏度**（1s / 1.5s / 2s）。

### 5.5 实施阶段

| 阶段 | 内容 |
|------|------|
| **V-1** | 按住说话（hold release send）；去掉 12s 误伤 |
| **V-2** | 点按 + interim + 1.5s 静音自动发送 |
| **V-3** | 上滑取消；设置里切换默认模式 |
| **V-4** | 按住上滑锁定（微信式，可选） |

---

## 6. 实施路线图（汇总）

> 详细门禁与 API 结论见 [MODULE_FEASIBILITY.md §7](./MODULE_FEASIBILITY.md#7-修订后的实施顺序有内容再开入口)

| 优先级 | 模块 | 内容 | 解锁入口 |
|--------|------|------|----------|
| **P0** | 语音 V-1 | 按住说话 + 结束即发送 | 体验稳定 |
| **P1** | 学习 Tab 壳 | 分科 Segmented：**英语 / 语文 / 探索**（三栏先上） | 见 MODULE_FEASIBILITY §4.2 |
| **P1** | 英语/语文卡片 | 单词区保留 + PoetryCard + DailyEnglishCard | 古诗、每日一句 |
| **P2** | 首页 | 宫格（按门禁）+ 历史记录 | 英语/语文/探索 🟢；数学/阅读 🟡🔴 |
| **P2** | 语音 V-2 | 点按 + 1.5s 静音自动发送 | — |
| **P2** | 内置扩容 | `jokes.json`≥30、`stories.json` 中文≥20 | 阅读 Tab / 宫格 |
| **P3** | MathDrill | 口算生成器（自写或 npm） | **数学 Tab + 首页数学** |
| **P3** | 成语 | `idioms.json`≥30 或 apihz Key 设置项 | 语文 › 成语 |
| **P3** | 设置 | 年级、默认语音模式、可选 apihz Key | 应用题/成语增强 |
| **P4** | 语音 V-3/V-4 | 上滑取消/锁定 | — |
| **P4** | 数学应用题 | apihz `shuxuex` Skill（可选 Key） | 数学 › 应用题 |

---

## 7. 决策待确认

1. **学习 Tab 默认打开哪个学科？** 建议：英语（当前主路径），或记住上次学科。  
2. **按住说话是否作为默认？** 建议：是（国内习惯）；设置可改点按+静音。  
3. **探索（天气/百科）算学习还是首页快捷？** 建议：学习 Tab「探索」+ 首页入口镜像。  
4. **历史记录保留几条？** 建议：20 条，localStorage。

确认后按 **P0 语音 → P1 学习分科** 顺序开发。
