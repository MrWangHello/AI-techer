# Bella 产品架构与语音交互方案（v2）

> 状态：**规划稿**（调研完成，评审后分阶段实现）  
> 关联：[GRADE1_3_CURRICULUM.md](./GRADE1_3_CURRICULUM.md) · [MODULE_FEASIBILITY.md](./MODULE_FEASIBILITY.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [VOICE_UX_PLAN.md](./VOICE_UX_PLAN.md) · [CONTENT_API_RESEARCH.md](./CONTENT_API_RESEARCH.md)  
> 日期：2026-08-30  
> 取代/补充：原 [CONTENT_UI_PLAN.md](./CONTENT_UI_PLAN.md) 中「全局浮层卡片」思路，改为 **Tab 内学科分区 + 首页聚合**

**年级定位：** 默认 **小学 1–3 年级**（从一年级起步），详见 [GRADE1_3_CURRICULUM.md](./GRADE1_3_CURRICULUM.md)。

**入口门禁：** 各模块能否上首页/学习 Tab，以 [MODULE_FEASIBILITY.md](./MODULE_FEASIBILITY.md) 总表为准 — **无 API 用内置，内容要丰富**。

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
| 拼音练习 | `pinyin.*` | **chinese** | drill | — | 语文 › 拼音 |
| 汉字认读 | `hanzi.*` | **chinese** | drill | — | 语文 › 汉字 |
| 句子跟读 | `sentence.*` | **chinese** | drill | — | 语文 › 句子 |
| 背古诗/诗词 | `poetry.random` | **chinese** | content | 语音 | 语文 › 拓展 › 古诗 |
| 一言美句 | `hitokoto.quote` | **chinese** | content | 语音 | 语文 › 拓展 › 美句 |
| 成语 | `idiom.random` | **chinese** | content | 语音/学习 | 语文 › 拓展 › 成语 |
| 单词卡片/测验 | `word.*` `study.quiz` | **english** | drill | 学习 Tab | 英语 › 单词 |
| 英语句子 | `english.sentence` | **english** | drill | — | 英语 › 句子 |
| 每日英语 | `english.daily` | **english** | content | 语音 | 英语 › 句子横幅 |
| 查单词 | `english.lookup` | **english** | query | 语音 | 英语 › 查词 |
| 口算练习 | `math.drill` | **math** | drill | 语音/学习 | 数学 › 口算 |
| 小计算器 | `math.calc` | **math** | query | 语音 | 数学 › 问 Bella |
| 应用题 | `word-problem.random` | **math** | content | 语音/学习 | 数学 › 应用题 |
| 讲故事 | `story.tell` | **reading** | content | 语音 | 阅读 › 短故事 |
| 讲笑话 | `joke.tell` | **reading** | content | 语音 | 阅读 › 趣味 |
| 百科 | `wiki.query` | **explore** | query | 语音 | 探索 › 百科 |
| 天气 | `weather.query` | **explore** | query | 语音 | 探索 › 天气 |
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
│  │ 探索  │ 数学  │ 宠物  │  ← 数学与各科同级，内置算法即可 │
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
[ 英语 ] [ 语文 ] [ 阅读 ] [ 探索 ] [ 数学 ]
────────────────────────────────────────
         （当前学科的内容区）
```

#### 英语

| 子模块 | 内容 | 说明 |
|--------|------|------|
| **单词** | StudyCards + emoji 插图 + 趣味例句 | 一年级 60 词起，见 GRADE1_3 |
| **句子** | 情景短句跟读 + 填空 | 「The apple is red!」 |
| **每日一句** | 扇贝/API 横幅 | 挂在句子 Tab 顶部 |
| **查单词** | 语音/输入查词 | 已有 Skill |

#### 语文（主线：拼音 · 汉字 · 句子）

| 子模块 | 内容 | 说明 |
|--------|------|------|
| **拼音** | 单韵母 a o e + 声母 b p m f… | 四线三格 + 跟读 + 拼读 |
| **汉字** | 天地人、金木水火土… | 象形图 + 组词 + 例句 |
| **句子** | 我是小学生。等 40 句 | 跟读 + 填空 + 排句 |
| **拓展** | 古诗 / 成语 / 美句 | 底部小入口，2–3 年级加重 |

> 完整例文与 UI 草图：[GRADE1_3_CURRICULUM.md §2](./GRADE1_3_CURRICULUM.md#2-语文--拼音--汉字--句子)

#### 阅读

| 子模块 | 内容 | 对应现有 |
|--------|------|----------|
| **短故事** | 内置 JSON（扩至 ≥20 中文） | Skill ✅；开发时同步扩内容 |
| **笑话** | 内置 JSON（扩至 ≥30） | Skill ✅ |
| **谜语** | 内置 `riddles.json`（规划） | Phase 2 |

#### 探索

| 子模块 | 内容 | 说明 |
|--------|------|------|
| **百科** | 维基摘要 | 偏查询 |
| **天气** | Open-Meteo | 偏查询 |

#### 数学（必做 — 一二年级以加减为主）

> 完整情境与例文：[GRADE1_3_CURRICULUM.md §4](./GRADE1_3_CURRICULUM.md#4-数学--加减法为主趣味口算)

| 子模块 | 内容 | 说明 |
|--------|------|------|
| **口算练习** | 20 以内加减（一年级默认） | 🐵摘桃 / 🎲骰子等情境 + emoji 计数图 |
| **应用题** | 内置 15 道图文题 | 「5 个苹果又给了 3 个…」 |
| **问 Bella** | 小计算器 | 「1 加 1 等于几」→ 语音答 |

**趣味要素：** 大字算式 + 水果动物插图 + Bella 读题 + 连对宠物 happy + 🪙奖励

**学习 Tab 内 UI 模板（3 种）：**

```
mode=drill   → 单词卡 / 测验 / 口算（交互+计分）
mode=content → 主题卡片（古诗卷轴、英语日签、故事页）
mode=query   → 搜索框 + 结果卡（查词、百科、天气）
```

**语音与学习 Tab 联动（说句话就到，详见 [VOICE_INTENT_NAV.md](./VOICE_INTENT_NAV.md)）：**

| 用户说 | 自动导航 |
|--------|----------|
| **语文** / **汉字** / **拼音** / **句子** | `study` → `chinese.*` 对应子页 + 出内容 |
| **英语** / **单词** / **句子** / 每日英语 | `study` → `english.*` |
| **数学** / **口算** / **1加1等于几** | `study` → `math` / `math.drill` / 当场计算 |
| 背古诗 / 讲成语 / 讲笑话 / 天气 | `study` → 对应 section + 执行 Skill |

Tab 分科栏保留作 **视觉兜底**；主路径是 **VoiceChatBar 意图导航**。

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

**语音导航第一：** 用户说「汉字」「1加1等于几」→ 意图识别 **自动切 Tab + 开子模块**，不必手动点卡片。完整映射见 [VOICE_INTENT_NAV.md](./VOICE_INTENT_NAV.md)。

```
Voice / 点击
    ↓
handleUserMessage()  ← 算式正则 / 关键词 / 上下文「换一个」
    ↓
Router → Skill（带 domain + mode + studySection）
    ↓
AgentResponse { reply, navigate, studySection, contentCard, sideEffect }
    ↓
page.tsx 分发：
  · navigate → 切 Tab（home/pet/study/settings）
  · studySection → 学习 Tab 切学科+子模块（如 chinese.hanzi）
  · contentCard → 直接渲染题面/字卡/诗卷（免再找入口）
  · 写入 history → 首页最近记录
```

**原则：一语直达 — 导航 + 开内容 + Bella 回复，三步合成一步。**

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
| **P0** | **语音意图导航** | studySection + 学科/子模块/算式路由 | 说「汉字」「1加1」自动到 |
| **P0** | 语音 V-1 | 按住说话 + 结束即发送 | 体验稳定 |
| **P1** | 学习 Tab 壳 | **五科全开** Segmented | 全部学科入口 |
| **P1** | **语文三线** | 拼音 + 汉字 + 句子 JSON & Card | 见 GRADE1_3 §2 |
| **P1** | **英语词/句** | emoji 插图 + 句子 Card | 见 GRADE1_3 §3 |
| **P1** | **数学** | 20 以内趣味口算 + 应用题 JSON | 见 GRADE1_3 §4 |
| **P1** | **成语 + 阅读** | idioms≥50、jokes≥30、stories 中文≥20 | 拓展内容 |
| **P2** | 卡片 UI | PoetryCard、DailyBanner、IdiomCard | 拓展阅读 |
| **P2** | 首页 | 六宫格 + 历史记录 | 首页增强 |
| **P2** | 语音 V-2 | 点按 + 1.5s 静音自动发送 | — |
| **P3** | 设置 | 年级、语音模式、可选 apihz Key | API 增强 |
| **P3** | 谜语 | `riddles.json`≥20 | 阅读扩展 |
| **P4** | 语音 V-3/V-4 | 上滑取消/锁定 | — |

---

## 7. 决策待确认

1. **学习 Tab 默认打开哪个学科？** 建议：英语（当前主路径），或记住上次学科。  
2. **按住说话是否作为默认？** 建议：是（国内习惯）；设置可改点按+静音。  
3. **探索（天气/百科）算学习还是首页快捷？** 建议：学习 Tab「探索」+ 首页入口镜像。  
4. **历史记录保留几条？** 建议：20 条，localStorage。  
5. **没 API 的模块做不做？** 建议：**都做** — 内置 JSON + 随机抽取；数学用内置算法。

确认后按 **P0 语音 → P1 并行（五科壳 + 数学 + 成语/应用题 JSON + 扩阅读）** 开发。
