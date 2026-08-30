# AI英语教师 — 移动端技术方案（混合架构版）

> 面向一年级小学生的 AI 英语学习 App，支持语音交互、AI 教学、宠物养成游戏化学习  
> 目标平台：Android / HarmonyOS（鸿蒙）/ iPadOS  
> **核心原则：语音免费化 + AI 按需配置（云端API优先 / 本地模型兜底）**

---

## 一、总体架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          AI英语教师 App                                   │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │    语音模块        │  │    AI 引擎         │  │    宠物养成        │      │
│  │  ┌──────────────┐│  │  ┌──────────────┐│  │  ┌──────────────┐│      │
│  │  │ STT (免费)    ││  │  │ 云端 API (主) ││  │  │ 宠物状态机    ││      │
│  │  │ · 系统原生✓   ││  │  │ · DeepSeek   ││  │  │ 等级/经验/进化││      │
│  │  │ · 微信语音✓  ││  │  │ · 通义千问   ││  │  └──────────────┘│      │
│  │  │ · 豆包语音✓  ││  │  │ · OpenAI    ││  │  ┌──────────────┐│      │
│  │  │ · 百度语音✓  ││  │  └──────────────┘│  │  │ 小游戏(Flame) ││      │
│  │  └──────────────┘│  │  ┌──────────────┐│  │  │ 配对/拼图/选择││      │
│  │  ┌──────────────┐│  │  │ 本地模型(备)  ││  │  └──────────────┘│      │
│  │  │ TTS (免费)    ││  │  │ Qwen2-0.5B  ││  │  ┌──────────────┐│      │
│  │  │ · 系统原生✓   ││  │  │ 无网时兜底   ││  │  │ Lottie动画   ││      │
│  │  │ · 豆包语音✓  ││  │  └──────────────┘│  │  │ 宠物体态/表情 ││      │
│  │  └──────────────┘│  └──────────────────┘  │  └──────────────┘│      │
│  └────────┬─────────┘                        └────────┬─────────┘      │
│           │                                           │                 │
│  ┌────────┴───────────────────────────────────────────┴───────────────┐│
│  │                 跨平台框架 Flutter 3.x                              ││
│  │         Android / HarmonyOS / iPadOS / iOS                        ││
│  └───────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ 配置管理模块   │  │ 网络状态检测   │  │ 本地数据库     │  │ 课程内容资产  ││
│  │ API-KEY管理   │  │ 在线/离线切换  │  │ Isar / Hive  │  │ JSON 打包    ││
│  │ 模型切换      │  │ 自动降级      │  │ 宠物/进度     │  │ 图片/音频    ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

**核心策略**：
- **语音模块**：优先使用免费语音 API（微信/豆包/百度等），系统原生 STT/TTS 兜底，**语音零成本**
- **AI 引擎**：用户自配云端 API Key（DeepSeek/通义千问 ≈ 2元/百万token），未配置或无网络时自动降级到本地 Qwen2-0.5B 小模型
- **其他所有模块**：纯本地运行，零云服务费用

---

## 二、跨平台技术选型

### 2.1 框架选择

| 框架 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| **Flutter 3.x** | 单代码库覆盖多端；性能接近原生；鸿蒙有适配方案 | 包体积偏大 | ⭐⭐⭐⭐⭐ |
| React Native | 生态成熟 | 游戏化场景需原生桥接 | ⭐⭐⭐ |
| Uni-app | 国内生态 | 性能上限低 | ⭐⭐⭐ |

**确定方案：Flutter 3.x + Dart**

### 2.2 各平台打包

| 平台 | 打包方式 | 备注 |
|------|---------|------|
| **Android** | `flutter build apk` / appbundle | 最低 API 26，支持 64 位；可直接分发 |
| **HarmonyOS NEXT** | [flutter_flutter_ohos](https://gitcode.com/openharmony-sig/flutter_flutter) 官方分支适配 | ⚠️ HarmonyOS NEXT **不兼容 Android APK**，必须用鸿蒙原生分支重新打包 |
| **iPadOS** | `flutter build ipa` | 需 App Store / TestFlight 分发；支持自适应布局 + 分屏 |
| **后续扩展** | Web / Windows | 一套代码可扩展 |

> **鸿蒙关键说明**：
> - HarmonyOS 4.x 及以下（基于 AOSP）可兼容 APK；
> - **HarmonyOS NEXT（5.0+，纯血鸿蒙）彻底去除 AOSP，无法安装 APK**；
> - MVP 阶段建议先只支持 Android，鸿蒙适配放到第二阶段（使用 `flutter_flutter_ohos` 官方分支）。

---

## 三、核心模块设计（混合架构）

### 3.1 语音模块 — 免费优先 + 本地兜底

#### 设计思路

> 语音模块全部使用**免费方案**，优先调用第三方免费语音 API（精度更高），无网络时降级到系统原生语音（完全离线）。

#### 免费语音 API 来源对比

| 来源 | STT 语音转文字 | TTS 语音合成 | 免费额度 | 接入方式 | 推荐度 |
|------|:------------:|:----------:|---------|---------|--------|
| **系统原生** | ✅ Android SpeechRecognizer<br>✅ iOS SFSpeechRecognizer | ✅ Android TextToSpeech<br>✅ iOS AVSpeechSynthesizer | **完全免费** | `speech_to_text` 插件<br>`flutter_tts` 插件 | ⭐⭐⭐⭐⭐ |
| **微信语音** | ✅ 微信智聆语音识别 | ❌ 不支持 | **免费** | 微信 SDK / HTTP API | ⭐⭐⭐⭐ |
| **豆包语音** | ✅ 豆包语音识别 | ✅ 豆包语音合成 | **免费额度 100万次/月** | HTTP API | ⭐⭐⭐⭐⭐ |
| **百度语音** | ✅ 短语音识别 | ✅ 在线合成 | **免费 5万次/天** | Flutter 插件 | ⭐⭐⭐⭐⭐ |
| **讯飞语音** | ✅ 语音听写 | ✅ 在线合成 | **免费 5万次/天** | Flutter 插件 | ⭐⭐⭐⭐ |
| **阿里云语音** | ✅ 语音识别 | ✅ 语音合成 | **免费 2万次/月** | HTTP API | ⭐⭐⭐ |

#### 语音模块优先级策略

```
用户说话
    │
    ├── 有网络 ──► 尝试免费云端 API (精度更高)
    │                 ├── 豆包语音 (优先，免费额度高)
    │                 ├── 百度语音 (备选)
    │                 └── 讯飞语音 (备选)
    │
    └── 无网络 ──► 系统原生语音 (完全离线，零费用)
                    ├── STT: speech_to_text 插件
                    └── TTS: flutter_tts 插件
```

#### 整体架构

```
┌───────────────────────────────────────────────────────────────┐
│                    语音模块                                    │
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │        AudioManager (录音/播放控制)                        ││
│  │  ┌───────────────┐    ┌───────────────────────────────┐  ││
│  │  │ record (录音)  │    │ play (播放)                   │  ││
│  │  │ flutter_sound  │    │ audioplayers                 │  ││
│  │  └───────────────┘    └───────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │         STT Service (语音识别 → 文字)                      ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  Level 1: 免费云端 API (有网络时)                     │  ││
│  │  │  ├── 豆包语音 API (推荐，百万次免费)                   │  ││
│  │  │  ├── 百度语音 API (5万次/天免费)                      │  ││
│  │  │  └── 讯飞语音 API (5万次/天免费)                      │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  Level 2: 系统原生 STT (离线兜底，完全免费)           │  ││
│  │  │  ├── Android → SpeechRecognizer (系统内置)           │  ││
│  │  │  ├── iOS/iPadOS → SFSpeechRecognizer (系统内置)      │  ││
│  │  │  └── Flutter 插件: speech_to_text                    │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │         TTS Service (文字 → 语音合成)                      ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  Level 1: 免费云端 API (有网络时)                     │  ││
│  │  │  ├── 豆包语音 API (推荐，免费额度高)                   │  ││
│  │  │  └── 百度语音 API (5万次/天免费)                      │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  Level 2: 系统原生 TTS (离线兜底，完全免费)           │  ││
│  │  │  ├── Android → TextToSpeech (系统内置)               │  ││
│  │  │  ├── iOS/iPadOS → AVSpeechSynthesizer (系统内置)      │  ││
│  │  │  └── Flutter 插件: flutter_tts                        │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │     发音评测 (免费方案)                                    ││
│  │  ├── 豆包/百度语音的识别置信度作为评分参考                  ││
│  │  └── 简单音素对比算法 (离线可用，无需云服务)               ││
│  └───────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

#### 推荐语音方案

| 功能 | 主要方案 (有网) | 兜底方案 (离线) | 费用 |
|------|:--------------:|:--------------:|:----:|
| **STT** | 豆包/百度语音 API | 系统原生 SpeechRecognizer | **0元** |
| **TTS** | 豆包/百度语音 API | 系统原生 TextToSpeech | **0元** |
| **发音评测** | 云端 API 置信度 | 本地音素对比 | **0元** |
| **音频控制** | flutter_sound + audioplayers | 同左 | **0元** |

**优点**：有网时用免费 API 获得更高精度，无网时系统原生兜底，**全程零费用**。

---

### 3.2 AI 引擎 — 云端 API 优先 + 本地模型兜底

#### 核心思路

```
云端 API (主) ───► 有网络 + 已配置 API Key 时使用
                      ├── DeepSeek (~2元/百万token，推荐)
                      ├── 通义千问 (~2元/百万token，推荐)
                      └── OpenAI GPT-4o-mini (约10元/百万token)
                            │
                            ▼
本地模型 (备) ───► 无网络 / 未配置 API Key 时自动降级
                      └── Qwen2-0.5B-Int4 (量化后 ~300MB)
                            │
                            ▼
规则引擎 (终极兜底) ──► 本地模型也不可用时
                      └── 固定对话模板 + 关键词回复
```

#### 云端 LLM API 成本对比

| API | 模型 | 价格 (输入/输出) | 1个孩子每月费用估算 | 推荐度 |
|-----|------|:---------------:|:------------------:|:------:|
| **DeepSeek** | deepseek-chat | **≈ 2元/百万token** | **~0.5元** | ⭐⭐⭐⭐⭐ |
| **通义千问** | qwen-plus | **≈ 2元/百万token** | **~0.5元** | ⭐⭐⭐⭐⭐ |
| **OpenAI** | GPT-4o-mini | ≈ 10元/百万token | ~3元 | ⭐⭐⭐⭐ |
| **OpenAI** | GPT-4o | ≈ 200元/百万token | ~50元 | ⭐⭐⭐ |
| **百度文心** | ERNIE-4.0 | ≈ 20元/百万token | ~5元 | ⭐⭐⭐ |

**费用估算**：一个一年级孩子每天学 30 分钟，月消耗约 30-50 万 token，**DeepSeek 月费仅 ~0.5-1元**，几乎可以忽略不计。

#### 技术架构

```
┌───────────────────────────────────────────────────────────────┐
│                     AI 引擎                                     │
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │               AI 路由器 (自动选择推理方式)                   ││
│  │                                                           ││
│  │  有网络 + 有 API Key  ──────────► 云端 API 调用             ││
│  │  无网络 / 无 API Key  ──────────► 本地模型推理              ││
│  │  本地模型不可用       ──────────► 规则引擎回退              ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────────────┐  ││
│  │  云端 API 通道        │  │  本地模型推理                  │  ││
│  │  ┌──────────────────┐│  │  ┌─────────────────────────┐ │  ││
│  │  │ DeepSeek Client  ││  │  │ Qwen2-0.5B-Int4        │ │  ││
│  │  │ (HTTP 调用)      ││  │  │ (langchain_ollama)     │ │  ││
│  │  └──────────────────┘│  │  └─────────────────────────┘ │  ││
│  │  ┌──────────────────┐│  │  ┌─────────────────────────┐ │  ││
│  │  │ 通义千问 Client  ││  │  │ 规则引擎 (终极兜底)       │ │  ││
│  │  │ (HTTP 调用)      ││  │  │ 固定模板 + 关键词        │ │  ││
│  │  └──────────────────┘│  │  └─────────────────────────┘ │  ││
│  └──────────────────────┘  └──────────────────────────────┘  ││
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │       AI 教学 Agent (推理引擎，核心升级)                     ││
│  │                                                           ││
│  │  大模型本身只负责"生成文本"，但 Agent 负责"思考该怎么做"     ││
│  │                                                           ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  Agent 推理循环 (ReAct 模式)                         │  ││
│  │  │                                                     │  ││
│  │  │  1. Thought (思考): "孩子刚才说错了 'apple' 的发音"   │  ││
│  │  │  2. Action (行动): 调用 check_progress() 查看历史记录 │  ││
│  │  │  3. Observation (观察): 发现这个词已经错3次了          │  ││
│  │  │  4. Thought (思考): "需要重点纠正，换个方式教"         │  ││
│  │  │  5. Action (行动): 调用 get_teaching_method() 换方法  │  ││
│  │  │  6. Response (回答): "没关系，我们再看一遍..."         │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  │                                                           ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  Agent 可调用的工具 (Tools)                           │  ││
│  │  │  ├── get_current_lesson()     → 获取当前课程内容      │  ││
│  │  │  ├── check_progress()         → 查询孩子学习进度      │  ││
│  │  │  ├── get_mistake_history()    → 查看常错知识点        │  ││
│  │  │  ├── record_mistake()         → 记录错误             │  ││
│  │  │  ├── give_reward()            → 给予宠物经验奖励      │  ││
│  │  │  ├── get_teaching_method()    → 获取不同教学方式      │  ││
│  │  │  └── suggest_game()           → 推荐适合的小游戏      │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  │                                                           ││
│  │  ┌─────────────────────────────────────────────────────┐  ││
│  │  │  记忆系统 (Memory)                                    │  ││
│  │  │  ├── 短期记忆: 当前对话上下文 (最后10轮)              │  ││
│  │  │  ├── 长期记忆: 已学课程、常错单词、掌握程度           │  ││
│  │  │  └── 教学策略: 针对不同孩子调整教学节奏               │  ││
│  │  └─────────────────────────────────────────────────────┘  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │         离线知识库 (本地 assets)                            ││
│  │  - 课程内容 JSON (8个单元打包在 App 内)                    ││
│  │  - 单词/句子/图片资源                                      ││
│  │  - 对话场景模板 (规则引擎使用)                              ││
│  └───────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

#### 为什么需要 Agent，而不是直接调大模型？

| 对比维度 | 直接调用 LLM (问答模式) | Agent 推理模式 (推荐) |
|---------|:---------------------:|:-------------------:|
| **教学方式** | 孩子问一句，AI 答一句，被动响应 | AI 主动规划教学步骤，引导式学习 |
| **错误处理** | 只纠正当前错误，记不住历史 | 记录错误模式，针对性强化训练 |
| **进度感知** | 每次对话独立，不知道孩子学到哪了 | 访问本地数据库，清楚孩子当前进度 |
| **工具调用** | 只能输出文字，无法操作 App | 可以调用函数：给宠物加经验、解锁课程、推荐游戏 |
| **教学策略** | 固定 Prompt，千篇一律 | 根据孩子表现动态调整教学节奏 |
| **一年级适配** | 回答可能太复杂或太简单 | 通过工具获取孩子水平，精确匹配难度 |

**简单说**：直接调大模型 = 一个只会回答问题的"词典"；Agent 模式 = 一个会思考的"真人老师"。

#### 核心选型：LangChain.dart — Flutter 原生 Agent 框架

> **LangChain.dart** 是 LangChain（Python）的 Dart 官方移植版，MIT 协议开源，由 David Migloz 维护。
> 3 年发布 60+ 版本，v0.9.0 稳定版，在 pub.dev 上直接安装。
>
> **GitHub**: https://github.com/davidmigloz/langchain_dart
> **pub.dev**: https://pub.dev/packages/langchain
> **文档**: https://langchaindart.com

**为什么选 LangChain.dart 而不是 DSH 或其他框架？**

| 框架 | 语言 | 嵌入 Flutter | 包体影响 | 生产可用 | Agent 能力 | 推荐度 |
|------|:---:|:----------:|:-------:|:-------:|:----------:|:------:|
| **LangChain.dart** ✅ | Dart | ✅ pub.dev 原生 | ~0 | ✅ v0.9.0 | ✅ 完整 | ⭐⭐⭐⭐⭐ |
| DeepSeek Harness | TS/JS | ❌ 需 Termux+Node.js | +80MB | ❌ 预览版 | ✅ 完整 | ⭐⭐ |
| LangChain (Python) | Python | ❌ 不能 | — | ✅ | ✅ | ❌ |
| AutoGen / CrewAI | Python | ❌ 不能 | — | ✅ | ✅ | ❌ |
| 纯 Function Calling | Dart | ✅ 原生 | 0 | ✅ | ⚠️ 基础 | ⭐⭐⭐⭐ |
| 自研 Dart Agent | Dart | ✅ 原生 | 0 | ✅ | ⚠️ 需自研 | ⭐⭐⭐ |

#### 核心方案：Flutter + LangChain.dart 单进程架构

```
┌──────────────────────────────────────────────────────────────────┐
│          最终方案：Flutter UI + LangChain.dart Agent               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Flutter App (单进程，全部内置)                              │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────────────┐  ┌──────────┐ │  │
│  │  │  语音模块     │  │  LangChain.dart     │  │  宠物系统  │ │  │
│  │  │  (纯 Dart)   │  │  Agent 引擎          │  │  (纯 Dart)│ │  │
│  │  └──────┬───────┘  └──────────┬───────────┘  └────┬─────┘ │  │
│  │         │                     │                   │       │  │
│  │         │          ┌──────────▼───────────────────┤       │  │
│  │         │          │  AgentExecutor (ReAct 循环)   │       │  │
│  │         │          │  ├── Thought (模型推理)        │       │  │
│  │         │          │  ├── Action (工具调用)         │       │  │
│  │         │          │  └── Observation (结果观察)    │       │  │
│  │         │          └──────────┬───────────────────┤       │  │
│  │         │                     │                   │       │  │
│  │         │          ┌──────────▼───────────────────┤       │  │
│  │         │          │  Tools (Skill 注册表)          │       │  │
│  │         │          │  ├── TeachingSkill           │       │  │
│  │         │          │  ├── PetSkill               │───────┤  │
│  │         │          │  └── GameSkill               │       │  │
│  │         │          └──────────┬───────────────────┘       │  │
│  │         │                     │                           │  │
│  │  ┌──────▼─────────────────────▼───────────────────────┐   │  │
│  │  │            AI 路由器 (自动选择推理方式)                │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 1: langchain_openai → DeepSeek API             │   │  │
│  │  │           (有网+有Key → AgentExecutor 自动推理)       │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 2: langchain_ollama → 本地 Qwen2 模型         │   │  │
│  │  │           (无网+有模型 → AgentExecutor 本地推理)     │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 3: 规则引擎 (固定模板)                          │   │  │
│  │  │           (无网+无模型 → 绝对可靠)                     │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │  本地存储      │  │  课程内容     │  │  网络检测     │      │  │
│  │  │  Isar         │  │  assets JSON │  │  auto switch │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ 单进程，无需 Node.js / Termux                                 │
│  ✅ 包体 ~60MB (LangChain.dart 是纯 Dart 包，几乎不增加包体)      │
│  ✅ Agent 框架 (AgentExecutor + Tool + Memory)                   │
│  ✅ Skill 插件化 (Tool 接口，后续增加技能只需实现接口)            │
│  ✅ 对话记忆 (Memory 模块自动管理上下文)                          │
│  ✅ 三层降级 (云端 → 本地 → 规则)                                 │
└──────────────────────────────────────────────────────────────────┘
```

#### Skill 定义：教学工具 (Tool 接口)

每个教学技能就是一个 Tool 实现，等同于 Harness 的插件：

```dart
import 'package:langchain/langchain.dart';
import 'package:langchain_openai/langchain_openai.dart';

// ============================================================
// 1. 定义教学工具 (Skill = Tool)
// ============================================================

class GetCurrentLessonTool implements Tool {
  @override
  String get name => 'get_current_lesson';

  @override
  String get description => '获取当前课程内容，返回课程名称、单词列表和句型';

  @override
  Map<String, dynamic> get inputSchema => {
    'type': 'object',
    'properties': {},
  };

  @override
  Future<ToolResult> invoke(ToolInput input) async {
    final lesson = await db.lessons.getCurrent();
    return ToolResult(
      output: '{"name": "${lesson.name}", "words": ${lesson.words}}',
    );
  }
}

class RecordMistakeTool implements Tool {
  @override
  String get name => 'record_mistake';

  @override
  String get description => '记录孩子某个单词的错误';

  @override
  Map<String, dynamic> get inputSchema => {
    'type': 'object',
    'properties': {
      'word': {'type': 'string', 'description': '错误的单词'},
    },
    'required': ['word'],
  };

  @override
  Future<ToolResult> invoke(ToolInput input) async {
    final word = input['word'] as String;
    await db.mistakes.insert({'word': word, 'timestamp': DateTime.now()});
    return ToolResult(output: '已记录单词 "$word" 的错误');
  }
}

class GiveRewardTool implements Tool {
  @override
  String get name => 'give_reward';

  @override
  String get description => '给予宠物经验值奖励';

  @override
  Map<String, dynamic> get inputSchema => {
    'type': 'object',
    'properties': {
      'xp': {'type': 'integer', 'description': '经验值数量'},
    },
    'required': ['xp'],
  };

  @override
  Future<ToolResult> invoke(ToolInput input) async {
    final xp = input['xp'] as int;
    await petService.addExperience(xp);
    return ToolResult(output: '宠物获得 $xp 经验值');
  }
}

// ============================================================
// 2. 创建 Agent (ReAct 循环)
// ============================================================

Future<AgentExecutor> createTeachingAgent() async {
  // 模型: DeepSeek 通过 OpenAI 兼容模式接入
  final model = ChatOpenAI(
    apiKey: 'your-deepseek-api-key',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  );

  // 工具列表 (Skill 注册表)
  final tools = [
    GetCurrentLessonTool(),
    RecordMistakeTool(),
    GiveRewardTool(),
    // 后续可轻松添加更多 Skill...
  ];

  // 创建 Agent (自动 ReAct 循环)
  final agent = ToolCallingAgent.fromLLMAndTools(
    llm: model,
    tools: tools,
    systemMessage: '''
      你是一个一年级英语教师AI助手。你可以:
      1. 获取当前课程内容
      2. 记录孩子的错误
      3. 给予宠物经验奖励
      请根据孩子的回答，智能决定使用哪些工具。
      语气要亲切、鼓励为主，适合6-7岁的孩子。
    ''',
  );

  return AgentExecutor(agent: agent, tools: tools);
}

// ============================================================
// 3. Flutter Provider 层
// ============================================================

final agentExecutorProvider = Provider<AgentExecutor>((ref) {
  return createTeachingAgent();
});

final aiResponseProvider =
    FutureProvider.family<String, String>((ref, message) async {
  final executor = await ref.read(agentExecutorProvider);
  final result = await executor.invoke({'input': message});
  return result['output'] as String;
});
```

#### 完整交互流程

```
孩子说话 (语音)
    │
    ▼
Flutter: 语音 → 文字 (STT)
    │
    ▼
Flutter: 调用 LangChain.dart AgentExecutor (进程内调用，无 HTTP)
    │
    ▼
AgentExecutor 开始 ReAct 推理:
    │
    ├── Thought: "孩子说 'I eat apple'，apple 发音不对"
    ├── Action: 调用 Tool: record_mistake("apple")
    ├── Observation: "apple 已记录第3次错误"
    ├── Thought: "需要重点纠正，使用图片辅助教学"
    ├── Action: 调用 Tool: get_current_lesson()
    ├── Observation: "当前课程：水果，包含 apple/banana/orange"
    └── Response: "没关系！apple 是 /ˈæp·əl/，看这张图片..."
    │
    ▼
Flutter: 显示文字 + 播放语音 (TTS) + 宠物动画
```

#### 三层降级体系（可靠性保障）

```
Level 1: 有网络 + 已配置 API Key
  ├── LangChain.dart + langchain_openai → DeepSeek API
  ├── AgentExecutor 自动管理 ReAct 循环
  └── 推理质量最高，支持多步工具调用

Level 2: 无网络 + 已下载本地模型
  ├── LangChain.dart + langchain_ollama → 本地 Qwen2-0.5B
  ├── AgentExecutor 本地推理 (中端手机 ~3-5 token/s)
  └── 推理能力中等，完全离线可用

Level 3: 无网络 + 无本地模型
  ├── 规则引擎兜底 (纯代码，固定对话模板)
  ├── 关键词匹配 + 课程进度感知
  └── 所有设备都可用，绝对可靠
```

#### Agent 错误处理与安全策略

```dart
class SafeAgentExecutor {
  final AgentExecutor _executor;
  static const int _maxIterations = 5;      // 防止无限循环
  static const Duration _timeout = Duration(seconds: 15); // 单次超时

  Future<String> invoke(String userInput) async {
    try {
      final result = await _executor.invoke(
        {'input': userInput},
        options: AgentOptions(
          maxIterations: _maxIterations,
          timeout: _timeout,
        ),
      );
      return result['output'] as String;
    } on TimeoutException {
      // 超时降级：返回固定鼓励语
      return '你真棒！继续加油吧～';
    } on ToolException catch (e) {
      // 工具执行失败：记录日志，返回降级回复
      debugPrint('Tool error: $e');
      return '让我换个方式教你吧～';
    } catch (e) {
      // 未知异常：降级到规则引擎
      return _ruleEngineFallback(userInput);
    }
  }

  String _ruleEngineFallback(String input) {
    // 关键词匹配的固定模板回复
    if (input.contains('hello') || input.contains('hi')) {
      return 'Hello! How are you today?';
    }
    return 'Good job! Let\'s keep learning!';
  }
}
```

#### API Key 安全存储

```dart
// 使用 flutter_secure_storage 加密存储 API Key
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiKeyManager {
  static const _storage = FlutterSecureStorage();

  static Future<void> saveKey(String provider, String key) async {
    await _storage.write(key: 'api_key_$provider', value: key);
  }

  static Future<String?> getKey(String provider) async {
    return await _storage.read(key: 'api_key_$provider');
  }

  static Future<void> deleteKey(String provider) async {
    await _storage.delete(key: 'api_key_$provider');
  }
}
```

> **注意**：API Key 不能明文存在 SharedPreferences 中，必须使用
> `flutter_secure_storage`（底层调用 Android Keystore / iOS Keychain）。


### 3.3 配置管理模块

#### 功能清单

- **API Key 管理**：配置 DeepSeek / 通义千问 / OpenAI 的 API Key
- **AI 模式切换**：云端 API / 本地模型 / 自动
- **语音服务选择**：豆包语音 / 百度语音 / 系统原生
- **学习设置**：每日学习时长、语速、难度
- **宠物设置**：宠物名字、提醒开关
- **数据管理**：导出/导入学习进度、重置数据

#### 设置页面结构

```
┌────────────────────────────────────────┐
│  设置                                   │
│                                        │
│  ┌─ AI 模型 ─────────────────────────┐ │
│  │  ○ 云端 API (推荐)                 │ │
│  │     服务商: [DeepSeek ▼]           │ │
│  │     API Key: [________________]    │ │
│  │     [验证并保存]                    │ │
│  │  ○ 本地模型 (离线运行)              │ │
│  │     状态: 未下载 [下载(300MB)]      │ │
│  │  ☑ 网络自动切换                    │ │
│  └────────────────────────────────────┘ │
│                                        │
│  ┌─ 语音设置 ────────────────────────┐ │
│  │  STT: [豆包语音 / 百度 / 系统原生]  │ │
│  │  TTS: [豆包语音 / 百度 / 系统原生]  │ │
│  │  TTS 语速: [慢──■─────快]          │ │
│  └────────────────────────────────────┘ │
│                                        │
│  ┌─ 学习设置 ────────────────────────┐ │
│  │  每日目标: [15 / 30 / 45 分钟]     │ │
│  │  难度: [简单 / 标准 / 挑战]         │ │
│  │  学习提醒: ☑ 每天 19:00           │ │
│  └────────────────────────────────────┘ │
│                                        │
│  ┌─ 数据管理 ────────────────────────┐ │
│  │  [导出学习报告]                    │ │
│  │  [重置所有数据]                    │ │
│  └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

#### 数据存储

```dart
// 配置数据模型 (SharedPreferences 存储)
class AppConfig {
  String? aiProvider;        // 'deepseek' | 'qwen' | 'openai'
  String? apiKey;            // 加密存储
  String aiMode;             // 'cloud' | 'local' | 'auto'
  String sttProvider;        // 'doubao' | 'baidu' | 'system'
  String ttsProvider;        // 'doubao' | 'baidu' | 'system'
  int dailyGoalMinutes;      // 每日学习目标
  String difficulty;         // 'easy' | 'normal' | 'hard'
  bool dailyReminder;        // 每日提醒开关
  String reminderTime;       // 提醒时间 '19:00'
  String petName;            // 宠物名字
  bool localModelDownloaded; // 本地模型是否已下载
}
```

---

### 3.4 网络状态与智能降级模块

#### 设计思路

> 自动检测网络状态，在不同网络条件下智能切换语音和 AI 服务，保证用户体验不断线。

#### 降级策略

```
┌──────────────────────────────────────────────────────────────────┐
│                        网络状态检测                                │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  WiFi / 5G    │    │  2G/3G 弱网   │    │  无网络       │       │
│  │  流畅         │    │  延迟高       │    │  完全离线     │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                  │                   │                │
│  ┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼───────┐       │
│  │ AI: 云端API  │    │ AI: 云端API  │    │ AI: 本地模型  │       │
│  │     (DeepSeek)│    │     (超时切本地)│    │     (Qwen2)  │       │
│  │ 语音: 云端API│    │ 语音: 云端API │    │ 语音: 系统原生│       │
│  │     (豆包)   │    │     (降级系统)│    │     (完全离线)│       │
│  │ 课程: 本地   │    │ 课程: 本地   │    │ 课程: 本地   │       │
│  │ 宠物: 本地   │    │ 宠物: 本地   │    │ 宠物: 本地   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

#### 状态切换逻辑

```dart
enum NetworkLevel { fluent, weak, offline }

enum AiLevel { cloudApi, localModel, ruleEngine }

class AiRouter {
  /// 根据网络状态和配置，决定使用哪种 AI 推理方式
  AiLevel decideAiLevel(NetworkLevel network, AppConfig config) {
    if (network == NetworkLevel.offline) {
      // 无网络 → 本地模型或规则引擎
      return config.localModelDownloaded
          ? AiLevel.localModel
          : AiLevel.ruleEngine;
    }

    if (config.aiMode == 'auto') {
      // 自动模式：有网络+有 Key → 云端，否则本地
      if (config.apiKey != null && config.apiKey!.isNotEmpty) {
        return network == NetworkLevel.fluent
            ? AiLevel.cloudApi
            : AiLevel.localModel; // 弱网也用本地，避免超时
      }
      return config.localModelDownloaded
          ? AiLevel.localModel
          : AiLevel.ruleEngine;
    }

    // 手动模式：按用户配置
    if (config.aiMode == 'cloud' && config.apiKey != null) return AiLevel.cloudApi;
    if (config.aiMode == 'local' && config.localModelDownloaded) return AiLevel.localModel;
    return AiLevel.ruleEngine;
  }
}
```

---

### 3.5 宠物养成系统

| 方案 | 说明 | 包体 | 学习成本 | 推荐度 |
|------|------|------|---------|--------|
| **Flame** | Flutter 官方 2D 游戏引擎，轻量 | ~1MB | 低 | ⭐⭐⭐⭐⭐ |
| **Bonfire** | 基于 Flame 的 RPG 引擎，适合宠物 | ~2MB | 中 | ⭐⭐⭐⭐ |
| **Lottie** | AirBnb 动画库，直接播放 AE 动画 | ~0.5MB | 极低 | ⭐⭐⭐⭐⭐ |
| **Rive** | 交互式动画工具，支持状态机 | ~1MB | 中 | ⭐⭐⭐⭐ |
| **Spine** | 骨骼动画，专业级 | ~2MB | 高 | ⭐⭐⭐ |

**推荐组合**：**Flame 引擎 + Lottie 动画**，兼顾开发效率与表现力。

#### 宠物系统架构

```
┌─────────────────────────────────────────────────────┐
│                  宠物养成系统                           │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │            宠物状态机 (Riverpod 状态管理)          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ 等级 Lv  │  │ 经验 XP  │  │ 饱腹度 Food  │  │ │
│  │  │ 0-50     │  │ 0-∞      │  │ 0-100       │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ 心情 Mood │  │ 进化阶段  │  │ 装扮/皮肤   │  │ │
│  │  │ 0-100    │  │ egg→baby │  │ 解锁制      │  │ │
│  │  │          │  │ →teen→   │  │             │  │ │
│  │  │          │  │ →adult   │  │             │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │          任务-奖励引擎                             │ │
│  │  ┌───────────────┐    ┌───────────────────────┐ │ │
│  │  │ 学习任务完成    │───►│ 获得经验 + 食物        │ │ │
│  │  │ 跟读单词      │    │ 经验满自动升级         │ │ │
│  │  │ 完成对话      │    │ 食物可喂食宠物         │ │ │
│  │  │ 小游戏过关    │    │ 连续学习获得额外奖励    │ │ │
│  │  └───────────────┘    └───────────────────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │          宠物动画系统 (Lottie + Flame)            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ 空闲动画  │  │ 高兴动画  │  │ 学习动画      │  │ │
│  │  │ 呼吸/眨眼  │  │ 跳跃/转圈 │  │ 翻书/点头    │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ 进食动画  │  │ 进化动画  │  │ 抚摸反应     │  │ │
│  │  │ 吃东西   │  │ 发光/变身 │  │ 蹭蹭/眯眼   │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### 宠物成长体系

| 阶段 | 等级 | 外观 | 解锁条件 | Lottie 动画 |
|------|------|------|---------|------------|
| 🥚 蛋 | Lv.0 | 宠物蛋，微微晃动 | 初始获得 | egg_idle.json |
| 🐣 幼年 | Lv.1-5 | 小萌宠，圆滚滚 | 完成 3 课时 | baby_idle/happy.json |
| 🐥 成长 | Lv.6-15 | 体型变大，更活泼 | 累计 100 XP | teen_idle/happy/eat.json |
| 🦋 进化 | Lv.16-30 | 形态变化，带特效 | 完成基础课程 | evolve(happy/study).json |
| 🦄 完全体 | Lv.31-50 | 华丽形态，专属特效 | 累计 500 XP | adult_idle/victory.json |

---

### 3.6 课程内容系统 — 纯本地

#### 数据结构

所有课程内容以 **JSON 文件** 打包在 App `assets` 目录下，无需网络。

```
assets/
  courses/
    ├── course_001_greetings.json
    ├── course_002_colors.json
    ├── course_003_numbers.json
    ├── course_004_animals.json
    ├── course_005_fruits.json
    ├── course_006_family.json
    ├── course_007_body.json
    └── course_008_actions.json
  images/
    ├── animals/       # 动物图片
    ├── fruits/        # 水果图片
    ├── colors/        # 颜色图片
    └── ...            # 其他课程图片
  audio/
    ├── words/         # 单词标准发音
    └── sentences/     # 句子标准发音
```

#### 课程 JSON 结构示例

```json
{
  "id": "course_001",
  "title": "Greetings",
  "grade": 1,
  "unit": 1,
  "vocabularies": [
    {
      "word": "hello",
      "phonetic": "/həˈloʊ/",
      "image": "images/greetings/hello.png",
      "audio": "audio/words/hello.mp3",
      "translation": "你好"
    },
    {
      "word": "goodbye",
      "phonetic": "/ɡʊdˈbaɪ/",
      "image": "images/greetings/goodbye.png",
      "audio": "audio/words/goodbye.mp3",
      "translation": "再见"
    }
  ],
  "sentences": [
    {
      "en": "Hello! How are you?",
      "zh": "你好！你好吗？",
      "audio": "audio/sentences/hello_how_are_you.mp3"
    }
  ],
  "dialogues": [
    {
      "role": "teacher",
      "en": "Hello! What's your name?",
      "zh": "你好！你叫什么名字？"
    },
    {
      "role": "student_hint",
      "en": "My name is ___.",
      "zh": "我的名字是___。"
    }
  ],
  "games": [
    {
      "type": "match",
      "prompt": "Match the word to the picture",
      "pairs": [
        {"word": "hello", "image": "images/greetings/wave.png"},
        {"word": "goodbye", "image": "images/greetings/wave_bye.png"}
      ]
    }
  ]
}
```

#### 课程体系（一年级 8 单元）

| 单元 | 主题 | 单词数 | 句子数 | 小游戏 |
|------|------|--------|--------|--------|
| 1 | Greetings 问候 | 4 | 2 | 配对 |
| 2 | Colors 颜色 | 6 | 3 | 涂色 |
| 3 | Numbers 数字 | 10 | 3 | 计数 |
| 4 | Animals 动物 | 6 | 4 | 拼图 |
| 5 | Fruits 水果 | 6 | 4 | 配对 |
| 6 | Family 家庭 | 5 | 4 | 连线 |
| 7 | Body 身体 | 8 | 4 | 指认 |
| 8 | Actions 动作 | 6 | 4 | 选择 |

---

## 四、第三方 UI 库与开源组件

> 核心原则：**能用三方的绝不自己写**，减少开发量，专注业务逻辑。

### 4.1 UI 组件库

| 库 | 用途 | 包体 | 说明 |
|---|------|------|------|
| **[shadcn_flutter](https://pub.dev/packages/shadcn_flutter)** | 现代化 UI 组件，按钮/卡片/输入框 | ~0.5MB | 美观，适合儿童应用 |
| **[flutter_animate](https://pub.dev/packages/flutter_animate)** | UI 动效库，淡入/弹跳/缩放 | ~0.3MB | 页面切换、按钮反馈 |
| **[flutter_staggered_animations](https://pub.dev/packages/flutter_staggered_animations)** | 列表动画 | ~0.1MB | 课程列表、宠物物品列表 |
| **[lottie](https://pub.dev/packages/lottie)** | After Effects 动画播放 | ~0.5MB | 宠物动画、UI 装饰动画 |
| **[rive](https://pub.dev/packages/rive)** | 交互式动画 | ~1MB | 宠物互动、状态切换动画 |
| **[flame](https://pub.dev/packages/flame)** | 2D 游戏引擎 | ~1MB | 小游戏、宠物互动场景 |
| **[confetti_widget](https://pub.dev/packages/confetti_widget)** | 庆祝彩纸特效 | ~0.1MB | 学习完成庆祝 |
| **[shimmer](https://pub.dev/packages/shimmer)** | 骨架屏加载效果 | ~0.1MB | 加载中占位 |

### 4.2 功能组件库

| 库 | 用途 | 说明 |
|---|------|------|
| **[speech_to_text](https://pub.dev/packages/speech_to_text)** | 语音识别（调用系统原生） | 完全离线 |
| **[flutter_tts](https://pub.dev/packages/flutter_tts)** | 语音合成（调用系统原生） | 完全离线 |
| **[flutter_sound](https://pub.dev/packages/flutter_sound)** | 录音控制 | 音频录制 |
| **[audioplayers](https://pub.dev/packages/audioplayers)** | 音频播放 | 播放课程音频 |
| **[isar](https://pub.dev/packages/isar)** | 高性能本地数据库 | 宠物数据/学习进度 |
| **[hive](https://pub.dev/packages/hive)** | 轻量 KV 存储 | 设置/配置项 |
| **[riverpod](https://pub.dev/packages/riverpod)** | 状态管理 | 全局状态 |
| **[go_router](https://pub.dev/packages/go_router)** | 路由管理 | 页面导航 |
| **[fl_chart](https://pub.dev/packages/fl_chart)** | 图表库 | 学习进度图表 |
| **[cached_network_image](https://pub.dev/packages/cached_network_image)** | 图片缓存 | 注意：本地版本可改用 `AssetImage` |

### 4.3 游戏相关库

| 库 | 用途 | 说明 |
|---|------|------|
| **[flame](https://pub.dev/packages/flame)** | 2D 游戏引擎核心 | 宠物小游戏 |
| **[flame_forge2d](https://pub.dev/packages/flame_forge2d)** | 物理引擎 | 物理小游戏（可选） |
| **[bonfire](https://pub.dev/packages/bonfire)** | RPG 地图引擎 | 宠物散步场景（可选） |
| **[simple_animations](https://pub.dev/packages/simple_animations)** | 简单动画 | UI 动效 |

### 4.4 页面布局参考

```
┌─────────────────────────────────┐
│  HomePage                       │
│  ┌─────────────────────────────┐│
│  │  宠物显示区域 (Lottie)       ││
│  │  + 宠物状态条 (进度/等级)    ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │  课程列表 (shadcn_flutter)   ││
│  │  ┌───────┐ ┌───────┐       ││
│  │  │ 第1课  │ │ 第2课  │       ││
│  │  │ ✅完成  │ │ 🔒锁定 │       ││
│  │  └───────┘ └───────┘       ││
│  │  ┌───────┐ ┌───────┐       ││
│  │  │ 第3课  │ │ 第4课  │       ││
│  │  │ ▶学习中 │ │ 🔒锁定 │       ││
│  │  └───────┘ └───────┘       ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │  底部导航 (CupertinoTabBar)  ││
│  │  [首页] [学习] [宠物] [我的]  ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## 五、本地数据存储

### 5.1 存储方案

| 数据类型 | 存储方案 | 说明 |
|---------|---------|------|
| **宠物数据** | Isar 数据库 | 等级、经验、物品、状态 |
| **学习进度** | Isar 数据库 | 已学课程、得分、时长 |
| **用户设置** | SharedPreferences | 音量、语速、主题 |
| **课程内容** | assets JSON | 打包在 App 内 |
| **音频资源** | assets 目录 | 单词/句子标准发音 |
| **图片资源** | assets 目录 | 课程配图、宠物素材 |

### 5.2 Isar 数据库 Schema

```dart
// 宠物数据
@collection
class Pet {
  String name;          // 宠物名字
  int level;            // 等级 0-50
  int experience;       // 经验值
  int fullness;         // 饱腹度 0-100
  int mood;             // 心情 0-100
  int evolutionStage;   // 进化阶段 0-4
  String skinId;        // 当前皮肤
  List<String> unlockedSkins; // 已解锁皮肤
  DateTime lastFeedTime; // 上次喂食时间
  DateTime lastPlayTime; // 上次玩耍时间
}

// 学习进度
@collection
class LearningProgress {
  String courseId;      // 课程 ID
  bool completed;       // 是否完成
  int score;            // 得分
  int studyTimeSeconds; // 学习时长
  DateTime lastStudyDate; // 最后学习日期
  List<String> masteredWords; // 已掌握的单词
}
```

---

## 六、数据流架构（混合：云端优先 + 本地兜底）

```
┌──────────┐    ┌───────────────┐    ┌──────────────┐
│  用户语音  │───►│  STT 语音识别  │───►│  文本输入     │
│  (麦克风)  │    │  (云端免费API  │    │              │
└──────────┘    │   /系统原生)   │    └──────┬───────┘
                └───────────────┘           │
                                            │
                          ┌─────────────────▼──────────────┐
                          │   LangChain.dart AgentExecutor  │
                          │   (ReAct: Thought→Action→Obs)  │
                          └─────────────────┬──────────────┘
                                            │
                ┌───────────────────────────┼───────────────────────┐
                │                           │                       │
        ┌───────▼───────┐          ┌────────▼────────┐    ┌────────▼────────┐
        │  Level 1 云端  │          │  Level 2 本地    │    │  Level 3 规则    │
        │  DeepSeek API │◄─有网────┤  Qwen2-0.5B     │◄───┤  固定模板回复    │
        │  (langchain_  │   降级    │  (langchain_   │ 降级 │  (纯代码兜底)    │
        │   openai)     │          │   ollama)       │      │                 │
        └───────┬───────┘          └────────┬────────┘    └────────┬────────┘
                │                           │                       │
                └───────────────────────────┼───────────────────────┘
                                            │
                                    ┌───────▼───────┐
                                    │  AI 回复文本    │
                                    └───────┬───────┘
                                            │
                ┌───────────────────────────┼───────────────────────┐
                │                           │                       │
        ┌───────▼───────┐          ┌────────▼────────┐    ┌────────▼────────┐
        │  TTS 语音合成  │          │  宠物状态更新     │    │  课程进度更新    │
        │  (云端免费API  │          │  (经验值/等级)    │    │  (Isar 本地DB)  │
        │   /系统原生)   │          └─────────────────┘    └─────────────────┘
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │  语音输出      │
        │  (扬声器)      │
        └───────────────┘
```

**数据流说明**：
- 语音和 AI 两路均有云端优先 + 本地兜底，保证任何网络环境都可用；
- 所有持久化数据（宠物、进度、错题）存在本地 Isar 数据库，无云端存储；
- AgentExecutor 进程内调用 LangChain.dart，无 HTTP 开销。

---

## 七、费用分析

### 7.1 费用构成

| 模块 | 费用项目 | 费用 | 说明 |
|------|---------|:---:|------|
| **语音 STT** | 豆包/百度免费 API | **0元** | 免费额度足够个人使用 |
| **语音 TTS** | 豆包/百度免费 API | **0元** | 免费额度足够个人使用 |
| **语音 (兜底)** | 系统原生 STT/TTS | **0元** | 完全免费，无需额度 |
| **AI 引擎 (云端)** | DeepSeek API | **~0.5-1元/月** | 按量计费，一个孩子极低 |
| **AI 引擎 (本地)** | Qwen2-0.5B 模型 | **0元** | 一次性下载，永久免费使用 |
| **AI 引擎 (兜底)** | 规则引擎 | **0元** | 纯代码逻辑，无费用 |
| **课程内容** | 本地 JSON + 资源 | **0元** | 打包在 App 内 |
| **宠物系统** | 本地游戏引擎 | **0元** | 纯本地运行 |
| **数据存储** | 本地数据库 | **0元** | 设备本地存储 |
| **服务器** | 无 | **0元** | 无需任何服务器 |

### 7.2 费用场景总结

| 使用场景 | 语音费用 | AI 费用 | 月总费用 |
|---------|:-------:|:-------:|:--------:|
| 有网络 + 配了 API Key | **0元** | ~0.5-1元 | **~0.5-1元** |
| 有网络 + 没配 API Key | **0元** | **0元** (本地模型) | **0元** |
| 无网络 | **0元** (系统原生) | **0元** (本地模型) | **0元** |
| 低端手机 + 无网络 | **0元** (系统原生) | **0元** (规则引擎) | **0元** |

### 7.3 API Key 获取方式

| 服务商 | 获取方式 | 费用 |
|-------|---------|:----:|
| **DeepSeek** | platform.deepseek.com 注册 | 充值，按量计费 |
| **通义千问** | dashscope.aliyun.com 注册 | 充值，按量计费 |
| **豆包语音** | volcengine.com 注册 | 有免费额度 |
| **百度语音** | console.bce.baidu.com 注册 | 有免费额度 |

---

## 九、推荐技术栈总结

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| **跨平台框架** | Flutter 3.x + Dart | 一套代码覆盖 Android / iPadOS（鸿蒙 NEXT 需 flutter_flutter_ohos 分支） |
| **AI Agent 框架** | LangChain.dart v0.9.0 | Dart 原生 Agent 框架：AgentExecutor + Tool + Memory |
| **模型接入 (云端)** | langchain_openai | OpenAI 兼容协议接入 DeepSeek / 通义千问 |
| **模型接入 (本地)** | langchain_ollama | 接入本地 Ollama / Qwen2-0.5B |
| **状态管理** | Riverpod 2.x | 编译安全、测试友好 |
| **路由** | go_router | 声明式路由 |
| **UI 组件** | shadcn_flutter | 现代化 UI，减少自研 |
| **动画** | Lottie + flutter_animate | 宠物动画 + UI 动效 |
| **游戏引擎** | Flame | 宠物小游戏 |
| **语音 STT (主)** | 豆包/百度语音 API | 免费云端，精度高 |
| **语音 STT (备)** | speech_to_text (系统原生) | 离线兜底，零包体 |
| **语音 TTS (主)** | 豆包/百度语音 API | 免费云端，音质好 |
| **语音 TTS (备)** | flutter_tts (系统原生) | 离线兜底，零包体 |
| **音频** | flutter_sound + audioplayers | 录音和播放 |
| **AI 引擎 (主)** | DeepSeek / 通义千问 API (langchain_openai) | 云端，~0.5元/月 |
| **AI 引擎 (备)** | Qwen2-0.5B (langchain_ollama) | 本地模型，离线可用 |
| **AI 引擎 (兜底)** | 规则引擎 (纯代码) | 所有设备可用 |
| **安全存储** | flutter_secure_storage | API Key 加密存储 (Keystore/Keychain) |
| **网络检测** | connectivity_plus | 自动切换在线/离线 |
| **本地数据库** | Isar | 宠物数据 + 学习进度 |
| **KV 存储** | SharedPreferences | 非敏感配置项 |
| **图表** | fl_chart | 学习统计 |
| **庆祝特效** | confetti_widget | 完成动画 |

---

## 十、包体大小预估

| 模块 | 大小 | 说明 |
|------|------|------|
| Flutter 引擎 | ~25 MB | 基础运行时 |
| 课程资源 (JSON + 图片) | ~10 MB | 8 单元内容 |
| 音频资源 (单词/句子) | ~15 MB | 标准发音 mp3 |
| 宠物动画 (Lottie) | ~5 MB | 各阶段动画 |
| 三方库 | ~5 MB | 所有依赖 |
| **小计 (不含 LLM)** | **~60 MB** | 正常 App 大小 |
| LLM 模型 (Qwen2-0.5B) | ~300 MB | 可选，首次下载 |
| **合计** | **~360 MB** | 含 LLM 模型包 |

**优化策略**：
- LLM 模型可在首次启动时下载（用户确认后），不强制包含在安装包中
- 音频资源可使用 OGG 压缩格式减小体积
- 图片使用 WebP 格式

---

## 十一、实施路线图

### 第一阶段：基础框架 + MVP（3-4周）

| 周次 | 任务 | 产出 |
|------|------|------|
| 第1周 | 搭建 Flutter 项目，配置路由/状态管理/UI 库 | 项目骨架 |
| 第1周 | 集成语音模块 (STT + TTS)，实现语音收发 | 语音可对话 |
| 第2周 | 集成本地 LLM 推理引擎，实现基础对话 | AI 可回复 |
| 第2周 | 编写 AI 教师角色 Prompt + 对话逻辑 | 角色对话 |
| 第3周 | 实现课程内容加载 + 第一单元课程 | 可学第一课 |
| 第3周 | 宠物系统基础（显示 + 状态管理） | 宠物可见 |
| 第4周 | 任务-奖励引擎（学习→获得经验） | 基础闭环 |
| 第4周 | 集成 Lottie 宠物动画 | 宠物动起来 |

### 第二阶段：游戏化完善（2-3周）

| 周次 | 任务 | 产出 |
|------|------|------|
| 第5周 | 宠物进化系统 + 多个 Lottie 动画 | 宠物可进化 |
| 第5周 | 喂食/抚摸/互动功能 | 宠物可互动 |
| 第6周 | 学习小游戏（配对/选择/拼图） | 3 种小游戏 |
| 第6周 | 完成全部 8 单元课程内容 | 完整课程 |
| 第7周 | 庆祝特效 + 鼓励反馈系统 | 完成感 ✅ |

### 第三阶段：多平台发布（2周）

| 周次 | 任务 | 产出 |
|------|------|------|
| 第8周 | Android APK 打包 + 真机测试 | Android 可用 |
| 第8周 | iPad 自适应布局适配 | iPad 可用 |
| 第9周 | HarmonyOS NEXT 适配 (flutter_flutter_ohos 分支) | 鸿蒙可用（第二阶段） |
| 第9周 | 性能优化 + 包体优化 | 发布就绪 |

### 第四阶段：持续迭代

- [ ] 更多课程内容（二年级+）
- [ ] 更多宠物种类（猫/狗/龙/精灵）
- [ ] 宠物换装系统
- [ ] 每日签到奖励
- [ ] 学习报告（本地图表统计）
- [ ] 家长控制模式

---

## 十二、Flutter 依赖清单

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter

  # 状态管理
  flutter_riverpod: ^2.x
  riverpod_annotation: ^2.x

  # 路由
  go_router: ^14.x

  # UI 组件库
  shadcn_flutter: ^x.x
  flutter_animate: ^4.x
  shimmer: ^3.x

  # 动画
  lottie: ^3.x
  confetti_widget: ^0.x

  # 语音 (云端免费 API)
  # 豆包/百度语音 API 用 HTTP 调用，无需特殊 Flutter 插件
  # 系统原生语音兜底
  speech_to_text: ^7.x        # 系统原生 STT
  flutter_tts: ^4.x           # 系统原生 TTS

  # 音频
  flutter_sound: ^9.x
  audioplayers: ^6.x

  # 游戏
  flame: ^1.x

  # AI Agent 框架 (LangChain.dart)
  langchain: ^0.9.0               # 核心框架：AgentExecutor / Tool / Memory
  langchain_openai: ^0.9.0        # 接入 DeepSeek / 通义千问 (OpenAI 兼容)
  langchain_ollama: ^0.9.0         # 接入本地 Ollama / Qwen2-0.5B

  # 本地存储
  isar: ^3.x
  isar_flutter_libs: ^3.x
  shared_preferences: ^2.x
  flutter_secure_storage: ^9.x    # API Key 加密存储

  # 网络检测
  connectivity_plus: ^6.x

  # 网络请求 (调用语音 API 等)
  dio: ^5.x

  # 工具
  path_provider: ^2.x
  permission_handler: ^11.x

  # 图表
  fl_chart: ^0.x

  # 本地 LLM 推理 (可选，用于 Level 2 本地模型)
  # 通过 langchain_ollama 调用本地 Ollama 服务，无需额外 Flutter 插件
  # 如需直接嵌入模型，可考虑 mediapipe_llm 或 llama.rn (后续评估)

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.x
  riverpod_generator: ^2.x
  isar_generator: ^3.x
  flutter_launcher_icons: ^x.x
  flutter_native_splash: ^x.x
```

---

## 十三、项目目录结构

```
ai_english_teacher/
├── android/                    # Android 原生配置
├── ios/                        # iOS/iPadOS 原生配置
├── ohos/                       # HarmonyOS NEXT 原生配置 (flutter_flutter_ohos 分支)
├── assets/
│   ├── courses/                # 课程 JSON
│   ├── images/                 # 课程图片
│   ├── audio/                  # 标准发音音频
│   │   ├── words/
│   │   └── sentences/
│   └── animations/             # Lottie 动画
│       ├── pet/
│       │   ├── egg/
│       │   ├── baby/
│       │   ├── teen/
│       │   └── adult/
│       └── effects/
├── lib/
│   ├── main.dart
│   ├── app.dart                # App 入口 + 路由
│   ├── core/
│   │   ├── theme/              # 主题配置
│   │   ├── router/             # 路由配置
│   │   └── constants/          # 常量
│   ├── features/
│   │   ├── home/               # 首页
│   │   │   ├── presentation/   # UI 页面
│   │   │   └── providers/      # 状态
│   │   ├── learning/           # 学习模块
│   │   │   ├── data/           # 课程数据加载
│   │   │   ├── presentation/   # 学习页面
│   │   │   └── providers/      # 学习状态
│   │   ├── ai_tutor/           # AI 教学 Agent (LangChain.dart)
│   │   │   ├── agent/          # AgentExecutor 创建与配置
│   │   │   ├── tools/          # Tool 实现 (Skill 注册表)
│   │   │   │   ├── get_lesson_tool.dart
│   │   │   │   ├── record_mistake_tool.dart
│   │   │   │   └── give_reward_tool.dart
│   │   │   ├── memory/         # 对话记忆管理
│   │   │   ├── router/         # AI 路由器 (云端→本地→规则 降级)
│   │   │   ├── fallback/       # 规则引擎兜底
│   │   │   └── safe_executor.dart  # SafeAgentExecutor (超时/异常处理)
│   │   ├── voice/              # 语音模块
│   │   │   ├── stt/            # 语音识别 (云端免费 API + 系统原生)
│   │   │   ├── tts/            # 语音合成 (云端免费 API + 系统原生)
│   │   │   └── audio/          # 音频控制
│   │   ├── pet/                # 宠物系统
│   │   │   ├── data/           # 宠物数据模型
│   │   │   ├── game/           # Flame 游戏组件
│   │   │   ├── animation/      # 动画管理
│   │   │   └── presentation/   # 宠物页面
│   │   ├── settings/           # 设置 (API Key 配置等)
│   │   │   └── api_key_manager.dart  # flutter_secure_storage 封装
│   │   └── profile/            # 个人中心
│   └── shared/
│       ├── widgets/            # 公共组件
│       └── utils/              # 工具函数
├── test/                       # 测试
├── pubspec.yaml
└── README.md
```

---

## 十四、技术风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| **本地 LLM 推理慢** | 低端手机响应延迟 | 使用 0.5B 小模型 + 量化；降级到规则引擎 |
| **本地 LLM 模型大** | 安装包 300MB+ | 首次启动可选下载，不强制捆绑 |
| **云端 API 费用** | 用户担心持续付费 | DeepSeek 月费仅 ~0.5 元，且有不配 Key 用本地模型的兜底方案 |
| **免费语音 API 额度用完** | 语音服务不可用 | 自动降级到系统原生语音，完全免费无额度限制 |
| **系统原生 STT 精度** | 儿童发音识别不准 | 适配儿童语音模型 + 简单关键词匹配兜底 |
| **HarmonyOS NEXT 不兼容 APK** | 鸿蒙新设备无法安装 | MVP 先只支持 Android；鸿蒙适配用 `flutter_flutter_ohos` 官方分支（第二阶段） |
| **Agent 无限循环 / 超时** | 卡死或等待过久 | SafeAgentExecutor 限制 maxIterations=5 + 15s 超时 + 异常降级 |
| **API Key 泄露** | 用户密钥被盗 | 使用 flutter_secure_storage 加密存储，不明文写入 SharedPreferences |
| **包体过大** | 用户下载意愿低 | App Bundle 分发，按需下载资源 |
| **宠物动画资源** | 需要美工配合 | 使用 Lottie 动画，可从社区获取免费资源 |

---

> **总结**：本方案采用 **Flutter 跨平台框架** + **LangChain.dart Agent 框架** + **混合架构** 设计。**语音模块优先使用免费云端 API（豆包/百度/微信），系统原生兜底，语音零成本**；**AI 引擎通过 LangChain.dart 的 AgentExecutor 管理 ReAct 循环，用户可自配云端 API Key（DeepSeek 月费 ~0.5元），未配置或无网络时自动降级到本地 Qwen2-0.5B 小模型或规则引擎**；所有课程、宠物、数据均在本地运行。通过大量使用第三方 UI 库（shadcn_flutter、Lottie、Flame 等）最大化复用、最小化开发量。一套代码即可打包为 Android / iPad 应用；**HarmonyOS NEXT 需用 `flutter_flutter_ohos` 分支重新打包**。

---

## 十五、整体可行性分析

### 15.1 打包分发可行性

#### Android 打包与安装

```
开发电脑
    │
    ├── flutter build apk ──► app-release.apk (~60MB，不含LLM)
    │                             │
    │                             ├── 直接微信/QQ发送给用户
    │                             ├── 用户点击安装 (需开启"允许安装未知来源")
    │                             └── ✅ 可以直接安装使用
    │
    └── flutter build appbundle ──► app-release.aab (Google Play 格式)
                                  └── 仅适用于 Google Play 发布
```

| 平台 | 打包方式 | 能否直接安装 | 备注 |
|------|---------|:----------:|------|
| **Android** | `flutter build apk` | **✅ 可以直接装** | 生成 APK 文件，微信/QQ发送，点击安装即可 |
| **HarmonyOS 4.x** | 兼容 Android APK | **✅ 可以直接装** | 基于 AOSP，兼容 APK |
| **HarmonyOS NEXT** | flutter_flutter_ohos 原生分支 | **⚠️ 需重新打包** | 纯血鸿蒙**不兼容 APK**，需用鸿蒙原生分支 |
| **iPadOS** | `flutter build ipa` | **❌ 不能直接装** | 必须通过 App Store 或 TestFlight 分发 |
| **iOS 个人测试** | 需开发者账号 ($99/年) | **❌ 不能直接装** | 需 TestFlight 内测分发 |

**关键结论**：**Android（含鸿蒙 4.x）可以直接打包 APK 发送安装**；**HarmonyOS NEXT 必须用 `flutter_flutter_ohos` 分支重新打包**，不能直接发 APK；iPad 需要通过 App Store 或 TestFlight。

#### 安装流程演示

> 你电脑上执行 `flutter build apk --release` → 生成 `app-release.apk` → 微信发给朋友 → 对方点击 APK 文件 → 允许安装 → 直接打开使用。**全程不需要任何服务器、应用商店审核。**

### 15.2 技术可行性

| 模块 | 可行性 | 风险等级 | 说明 |
|------|:------:|:-------:|------|
| **Flutter 跨平台** | ✅ 成熟 | 🟢 低 | Flutter 3.x 已非常稳定，国内外大量商用 App 验证 |
| **语音 STT/TTS** | ✅ 成熟 | 🟢 低 | 系统原生语音能力已存在多年，稳定可靠 |
| **云端 LLM API** | ✅ 成熟 | 🟢 低 | DeepSeek/通义千问 API 可用性 > 99.9% |
| **本地 LLM 推理** | ⚠️ 可行 | 🟡 中 | langchain_ollama + Qwen2-0.5B，中端手机推理 ~3-5 token/s |
| **规则引擎兜底** | ✅ 成熟 | 🟢 低 | 纯代码逻辑，无任何依赖，绝对可靠 |
| **宠物动画 (Lottie)** | ✅ 成熟 | 🟢 低 | Lottie 已被大量 App 验证，性能优秀 |
| **小游戏 (Flame)** | ✅ 成熟 | 🟢 低 | Flame 2D 引擎稳定，适合简单小游戏 |
| **本地数据库 (Isar)** | ✅ 成熟 | 🟢 低 | Isar 专为 Flutter 设计，性能优于 SQLite |

### 15.3 开发方式选择

#### 方案对比：AI 辅助开发 vs 传统开发

| 开发方式 | 上手难度 | 开发速度 | 代码质量 | 可维护性 | 推荐度 |
|---------|:-------:|:-------:|:-------:|:-------:|:------:|
| **方案A: Cursor IDE + AI 辅助** | **低** | **最快** | 高 | 高 | ⭐⭐⭐⭐⭐ |
| **方案B: Bolt.new / Lovable** | 极低 | 快 | 低 | 低 | ⭐⭐ |
| **方案C: AI Agent 框架 (AutoGPT等)** | 高 | 慢 | 不可控 | 极低 | ⭐ |
| **方案D: 传统手动编码** | 高 | 慢 | 高 | 高 | ⭐⭐⭐⭐ |

#### 方案A详解：Cursor IDE（推荐方案）

```
Cursor IDE
    │
    ├── 内置 AI 能力
    │   ├── Ctrl+K: 选中代码，用自然语言让 AI 修改
    │   ├── Ctrl+L: 对话模式，让 AI 理解整个项目
    │   ├── Tab: 代码自动补全 (类似 Copilot)
    │   └── @Files / @Folders: 引用文件/目录上下文
    │
    ├── 支持模型
    │   ├── Claude 3.5 Sonnet (推荐，最懂代码)
    │   ├── GPT-4o (备选)
    │   └── DeepSeek (免费方案)
    │
    └── 适合 Flutter 开发的原因
        ├── 理解完整项目结构，不只是单文件
        ├── Flutter/Dart 支持完善
        ├── 可以一键修复编译错误
        └── 社区活跃，Flutter 模板丰富
```

**推荐工作流**：

```
1. 用 Cursor 创建 Flutter 项目
   → 在 Cursor 中打开终端，执行 flutter create

2. 让 AI 帮写核心代码
   → "帮我写一个语音模块，支持系统原生STT/TTS，也支持豆包语音API"
   → "帮我写一个宠物系统，用 Riverpod 管理状态，用 Lottie 播放动画"

3. 让 AI 修复错误
   → 编译报错时，直接把错误信息复制给 AI，它帮你改

4. 迭代优化
   → "这个页面在平板上布局不对，帮我适配 iPad"
   → "宠物进化的逻辑需要调整，增加连续学习奖励"
```

#### 其他工具定位

| 工具 | 适合场景 | 不适合场景 |
|------|---------|-----------|
| **Cursor** | 完整的 Flutter 项目开发 | 无 |
| **Windsurf** | 类似 Cursor，AI 能力稍弱 | 复杂 Flutter 项目 |
| **GitHub Copilot** | 代码补全，辅助编码 | 全局项目理解 |
| **Bolt.new / Lovable** | 快速原型，Web 应用 | ❌ 不适合 Flutter 移动端 |
| **Trae (字节)** | 国内网络友好的 AI IDE | 生态不如 Cursor 成熟 |
| **豆包 (字节)** | 中文问答，代码片段生成 | 不适合完整项目开发 |
| **AI Agent 框架** | 自动化任务 | ❌ 不适合 App 开发，不可控 |

### 15.4 AI Agent 框架为什么不适合 App 开发

| 问题 | 说明 |
|------|------|
| **上下文窗口限制** | 一个完整的 Flutter 项目有几十上百个文件，AI Agent 无法同时理解全部 |
| **调试不可控** | Agent 自动修改代码可能导致连锁错误，难以追溯 |
| **UI 细节难把控** | 儿童 App 对 UI 要求高，Agent 无法精确控制像素级布局 |
| **依赖管理混乱** | Agent 可能随意添加/删除依赖，导致版本冲突 |
| **安全性** | Agent 可能修改配置文件、权限声明等，引入安全隐患 |

**结论**：**AI Agent 框架（AutoGPT、MetaGPT 等）当前不适合用于生产级 App 开发**。最高效的方式是 **Cursor IDE + 你的人工判断 + AI 辅助编码**。

### 15.5 推荐的开发工具链

```
┌──────────────────────────────────────────────────────────────┐
│                     开发工具链                                 │
│                                                              │
│  IDE:          Cursor (主要) + VS Code (备选)                  │
│  AI 模型:      Claude 3.5 Sonnet (代码生成)                   │
│                DeepSeek (低成本备选)                           │
│  Agent 框架:   LangChain.dart v0.9.0 (pub.dev 安装)            │
│  模型接入:     langchain_openai (DeepSeek 兼容)                │
│               langchain_ollama (本地模型)                     │
│  版本管理:     Git + GitHub (免费私有仓库)                     │
│  设计工具:     Figma (社区版免费) + LottieFiles (免费动画)     │
│  测试:         Android 模拟器 + 真机                           │
│  打包:         Flutter CLI                                    │
│  分发:         Android APK 直接发送；鸿蒙 NEXT 需 flutter_flutter_ohos 重新打包
│                TestFlight (iPad 内测)                         │
│                                                              │
│  成本: Cursor ($20/月) + Claude ($20/月) = $40/月             │
│        或: 只用 Cursor 内置的 DeepSeek = 免费                  │
└──────────────────────────────────────────────────────────────┘
```

### 15.6 可靠性保障措施

| 层级 | 措施 | 说明 |
|------|------|------|
| **代码层面** | Riverpod 状态管理 | 可预测的状态流，便于调试 |
| **语音层面** | 三层降级 (云端→原生→本地) | 任何情况都有语音可用 |
| **AI 层面** | 三层降级 (云端→本地→规则) | 任何情况都有教学反馈 |
| **数据层面** | Isar 本地数据库 + 自动备份 | 数据不丢失 |
| **异常层面** | try-catch 全局异常捕获 | 崩溃率控制在 0.1% 以下 |
| **测试层面** | Flutter 单元测试 + Widget 测试 | 核心逻辑有自动化测试覆盖 |
| **打包层面** | App Bundle 分片 + 按需下载 | 包体过大时降低安装门槛 |

### 15.7 最终建议

```
问：电脑打包发 APK 给用户，能直接安装吗？
答：✅ Android（含鸿蒙 4.x）可以直接安装；HarmonyOS NEXT 不兼容 APK，需 flutter_flutter_ohos 重新打包；iPad 需要经过 App Store

问：用什么框架开发？
答：✅ Flutter 3.x，跨平台最成熟的选择

问：Agent 框架用哪个？
答：✅ LangChain.dart v0.9.0，Dart 原生 Agent 框架，pub.dev 直接安装，进程内调用

问：用 AI 开发靠谱吗？
答：✅ 用 Cursor IDE + Claude 辅助开发很靠谱
    ❌ 用 Bolt.new / AI Agent 框架不靠谱

问：整体可靠性如何？
答：✅ 核心模块都有三层降级兜底，可靠性有保障
```

---

> **一句话总结**：Flutter 开发 UI → LangChain.dart 作为 Agent 引擎（进程内调用） → 电脑打包 APK → 微信直接发给 Android 用户安装。**技术可靠、成本极低、Agent 能力完整、无需 Node.js 运行时**。鸿蒙 NEXT 需用 `flutter_flutter_ohos` 分支重新打包。

---

## 十六、技术方案审查报告（全面自检）

> 本章节是对整个技术方案的逐模块审查，对照业界成熟实践，标注每个模块的可行性、风险和修正建议。

### 16.1 审查总览

| 模块 | 选型 | 可行性 | 风险等级 | 需修正 |
|------|------|:------:|:-------:|:------:|
| 1. 跨平台框架 | Flutter 3.x | ✅ | 🟢 低 | — |
| 2. 状态管理 | Riverpod 2.x | ✅ | 🟢 低 | — |
| 3. 语音 STT/TTS | 免费 API + 系统原生 | ✅ | 🟢 低 | — |
| 4. AI 云端 API | DeepSeek / 通义千问 | ✅ | 🟢 低 | — |
| 5. AI 本地模型 | Qwen2-0.5B (langchain_ollama) | ⚠️ | 🟡 中 | 需验证低端机性能 |
| 6. Agent 框架 | LangChain.dart v0.9.0 | ✅ | 🟢 低 | Dart 原生，已修正 |
| 7. HarmonyOS 适配 | flutter_flutter_ohos 分支 | ⚠️ | 🟡 中 | NEXT 不兼容 APK，第二阶段适配 |
| 8. 本地数据库 | Isar | ⚠️ | 🟡 中 | 建议增加备选方案 |
| 9. 宠物/游戏 | Flame + Lottie | ✅ | 🟢 低 | — |
| 10. 打包分发 | APK 直接安装 | ✅ | 🟢 低 | 仅 Android，鸿蒙需另处理 |

### 16.2 逐模块详细审查

---

#### 审查 1：跨平台框架 — Flutter 3.x ✅ 通过

**业界对比**：

| 框架 | 跨平台能力 | 游戏化支持 | 鸿蒙支持 | 社区活跃度 | 结论 |
|------|:---------:|:---------:|:-------:|:---------:|:----:|
| **Flutter 3.x** | Android/iOS/Web/桌面 | Flame 引擎成熟 | 官方适配中 | 极高 | ✅ 选型正确 |
| React Native | Android/iOS | 需原生桥接 | 无 | 高 | ❌ 不适合 |
| Uni-app | 多端 | 能力弱 | 有 | 中 | ❌ 性能不够 |
| 原生开发 | 单平台 | 各平台原生 | 仅鸿蒙 | — | ❌ 成本太高 |

**结论**：Flutter 是 2025-2026 年跨平台儿童教育 App 的业界首选，选型**完全正确**。

---

#### 审查 2：状态管理 — Riverpod 2.x ✅ 通过

**业界对比**：

| 方案 | 编译安全 | 测试友好 | 学习成本 | 2025 推荐度 | 结论 |
|------|:------:|:------:|:-------:|:----------:|:----:|
| **Riverpod 2.x/3.x** | ✅ | ✅ | 中 | ⭐⭐⭐⭐⭐ | ✅ 正确 |
| Bloc 8.x | ✅ | ✅ | 高 | ⭐⭐⭐⭐ | 可选 |
| GetX | ❌ | ❌ | 低 | ⭐⭐⭐ | ❌ 不推荐生产 |
| Provider | ❌ | ⚠️ | 低 | ⭐⭐ | ❌ 过时 |

**结论**：Riverpod 是 Flutter 官方推荐的状态管理方案，2025-2026 年社区共识，选型**正确**。

---

#### 审查 3：语音模块 — 免费 API + 系统原生 ✅ 通过

**验证点**：

| 验证项 | 结论 | 说明 |
|--------|:----:|------|
| 系统原生 STT 是否免费 | ✅ | Android SpeechRecognizer / iOS SFSpeechRecognizer 完全免费 |
| 系统原生 TTS 是否免费 | ✅ | Android TextToSpeech / iOS AVSpeechSynthesizer 完全免费 |
| 豆包/百度语音是否有免费额度 | ✅ | 豆包 100 万次/月，百度 5 万次/天 |
| speech_to_text 插件是否稳定 | ✅ | pub.dev 7.x 版本，维护活跃 |
| flutter_tts 插件是否稳定 | ✅ | pub.dev 4.x 版本，维护活跃 |
| 离线语音是否可用 | ✅ | 系统原生 STT/TTS 部分离线可用（取决于设备） |

**结论**：语音模块设计合理，三层降级策略正确，**通过**。

---

#### 审查 4：AI 云端 API — DeepSeek ✅ 通过

**验证点**：

| 验证项 | 结论 | 说明 |
|--------|:----:|------|
| DeepSeek API 价格 | ✅ | ~2 元/百万 token，一个孩子月费 < 1 元 |
| DeepSeek API 稳定性 | ✅ | 可用性 > 99.9%，国内访问速度快 |
| 是否支持 Function Calling | ✅ | DeepSeek 原生支持 |
| 通义千问是否可用 | ✅ | 同样支持，价格相近 |
| 是否有被封禁风险 | ⚠️ | API Key 需妥善保管，注意用量监控 |

**结论**：云端 AI 选型**正确**，DeepSeek 是 2025-2026 年性价比最高的选择。

---

#### 审查 5：AI 本地模型 — Qwen2-0.5B (langchain_ollama) ⚠️ 需关注

**风险点**：

| 风险 | 严重度 | 说明 |
|------|:------:|------|
| 低端手机推理慢 | 🟡 中 | 0.5B 模型在中端手机 ~3-5 token/s，可能让孩子等太久 |
| langchain_ollama 移动端成熟度 | 🟡 中 | Ollama 移动端方案仍在发展，需验证可用性 |
| 模型包体 300MB | 🟢 低 | 可选下载，不强制 |
| 模型推理耗电 | 🟡 中 | 长时间推理会发热 |

**建议**：本地模型定位为"备选方案"是正确的，但需要在开发时**实测中端 Android 手机的推理速度**，如果 > 10 秒/回复，则直接降级到规则引擎。

---

#### 审查 6：Agent 框架 — 已从 DSH 切换到 LangChain.dart ✅ 已修正

**原方案采用 DeepSeek Harness (DSH)，经调研发现以下问题，已切换为 LangChain.dart：**

| 问题 | 严重度 | 详细说明 |
|------|:------:|---------|
| **DSH 仍是开发者预览版** | 🔴 高 | 官方明确标注 Developer Preview，接口随时可能不兼容 |
| **dsh-mobile-apk 是社区项目** | 🔴 高 | 非官方，仅一人开发，稳定性无保障 |
| **手机运行 Node.js + Termux** | 🔴 高 | 实质是在手机上跑 Termux + Node.js，耗电、发热严重 |
| **双进程架构复杂** | 🟡 中 | Flutter + Node.js 两个运行时，内存占用翻倍 |
| **儿童 App 不需要如此重的 Agent** | 🟡 中 | 教学场景的推理链不复杂，不需要 Agent OS |
| **包体暴增** | 🟡 中 | Node.js 运行时 + DSH 框架 ≈ 50-80MB 额外包体 |
| **DSH 接口不稳定** | 🔴 高 | 官方说"会有破坏兼容的改动"，不适合生产依赖 |

**业界对比 — 移动端 Agent 框架选型**：

| 方案 | 语言 | 移动端适配 | 包体影响 | 生产可用 | Agent 能力 | 推荐度 |
|------|------|:---------:|:-------:|:-------:|:----------:|:------:|
| **LangChain.dart** | Dart | ✅ 原生 | 0 | ✅ 可用 | ✅ 完整 Agent | ⭐⭐⭐⭐⭐ |
| **DSH 手机版 (Termux+Node.js)** | TS/JS | ⚠️ 社区方案 | +80MB | ❌ 不可用 | ✅ 完整 | ⭐⭐ |
| **DSH 桌面版 + 手机远程** | TS/JS | ❌ 需电脑 | 0 | ❌ 不适合 | ✅ 完整 | ⭐ |
| **纯 Function Calling** | Dart | ✅ 原生 | 0 | ✅ 可用 | ⚠️ 基础 | ⭐⭐⭐⭐ |
| **自研 Dart ReAct 循环** | Dart | ✅ 原生 | 0 | ✅ 可用 | ⚠️ 需自研 | ⭐⭐⭐ |

---

### 16.6 最终推荐：LangChain.dart — Flutter 原生 Agent 框架

经过全面调研，**LangChain.dart** 是 Flutter 移动 App 嵌入 Agent 框架的最佳选择。

#### 什么是 LangChain.dart？

> LangChain.dart 是 LangChain（Python）的 **Dart 官方移植版**，由 David Migloz 维护，MIT 协议开源。
> 在 pub.dev 上发布，**2 小时前刚更新到 v0.9.0**，3 年发布 60 个版本，维护非常活跃。

**GitHub**: https://github.com/davidmigloz/langchain_dart
**pub.dev**: https://pub.dev/packages/langchain
**文档**: https://langchaindart.com

#### 为什么选 LangChain.dart？

| 维度 | LangChain.dart | DSH | 纯 Function Calling |
|------|:-------------:|:---:|:-------------------:|
| **语言** | Dart（原生） | TypeScript | Dart |
| **Flutter 集成** | ✅ pub.dev 一行依赖 | ❌ 需 Termux+Node.js | ✅ 原生 |
| **包体影响** | 0（纯 Dart 包） | +80MB | 0 |
| **Agent 能力** | ✅ Agent + Tool + Memory | ✅ 完整 | ⚠️ 基础 |
| **工具注册** | ✅ Tool 接口 + AgentExecutor | ✅ 插件系统 | 需自研 |
| **多模型支持** | ✅ OpenAI/Ollama/Google/Anthropic | ✅ 适配器 | 需自研 |
| **本地模型** | ✅ langchain_ollama | ❌ | 需自研 |
| **RAG 支持** | ✅ 向量库 + 检索 | ❌ | ❌ |
| **生产可用** | ✅ v0.9.0 稳定版 | ❌ 开发者预览 | ✅ |
| **维护状态** | ✅ 活跃（刚更新） | ⚠️ 预览版 | — |
| **Skill 可扩展** | ✅ Tool 组件化 | ✅ 插件 | 需自研 |

#### LangChain.dart 架构

```
┌──────────────────────────────────────────────────────────────────┐
│               LangChain.dart 架构 (v0.9.0)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  langchain (核心包)                                         │  │
│  │  ├── Agents (智能体)                                        │  │
│  │  │   ├── AgentExecutor (ReAct 循环执行器)                    │  │
│  │  │   ├── ToolCallingAgent (工具调用 Agent)                    │  │
│  │  │   └── 工具自动选择 + 多步推理                              │  │
│  │  ├── Chains (链式调用)                                      │  │
│  │  ├── Memory (对话记忆)                                      │  │
│  │  │   ├── ConversationBufferMemory                            │  │
│  │  │   └── ConversationSummaryMemory                          │  │
│  │  └── Prompts (提示词模板)                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  模型适配层 (每个一个独立包，按需引入)                          │  │
│  │  ├── langchain_openai    → ChatOpenAI (GPT-4o, o1, etc.)   │  │
│  │  ├── langchain_ollama     → ChatOllama (本地模型: Qwen, etc.)│  │
│  │  ├── langchain_google     → ChatGoogleGenerativeAI (Gemini) │  │
│  │  ├── langchain_anthropic → ChatAnthropic (Claude)           │  │
│  │  └── langchain_mistralai → ChatMistralAI (Mistral)          │  │
│  │                                                            │  │
│  │  ⚡ DeepSeek API 通过 langchain_openai 的                    │  │
│  │     OpenAI 兼容模式直接接入 (baseUrl 改为 DeepSeek 即可)     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  工具层 (Tool 注册 = Skill 系统)                             │  │
│  │  ├── 内置工具: Calculator, TavilySearch, DallE              │  │
│  │  └── 自定义工具: 实现 Tool 接口即可注册                      │  │
│  │     → 你的 TeachingSkill, PetSkill 都是自定义 Tool           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  检索层 (RAG，可选)                                          │  │
│  │  ├── MemoryVectorStore (内存向量库，适合移动端)               │  │
│  │  ├── ObjectBoxVectorStore (本地向量库)                       │  │
│  │  └── Pinecone / Supabase (云端向量库)                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ 全部纯 Dart，零原生依赖，直接 pub.dev 安装                     │
│  ✅ DeepSeek 通过 OpenAI 兼容模式接入                              │
│  ✅ 本地模型通过 Ollama 或直接 HTTP 接入                           │
│  ✅ Skill = Tool 接口实现，插件化扩展                               │
└──────────────────────────────────────────────────────────────────┘
```

#### Flutter + LangChain.dart 集成方案

```
┌──────────────────────────────────────────────────────────────────┐
│          最终方案：Flutter UI + LangChain.dart Agent               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Flutter App (单进程，全部内置)                              │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────────────┐  ┌──────────┐ │  │
│  │  │  语音模块     │  │  LangChain.dart      │  │  宠物系统  │ │  │
│  │  │  (纯 Dart)   │  │  Agent 引擎          │  │  (纯 Dart)│ │  │
│  │  └──────┬───────┘  └──────────┬───────────┘  └────┬─────┘ │  │
│  │         │                     │                   │       │  │
│  │         │          ┌──────────▼───────────────────┤       │  │
│  │         │          │  AgentExecutor (ReAct 循环)   │       │  │
│  │         │          │  ├── Thought (模型推理)        │       │  │
│  │         │          │  ├── Action (工具调用)         │       │  │
│  │         │          │  └── Observation (结果观察)    │       │  │
│  │         │          └──────────┬───────────────────┤       │  │
│  │         │                     │                   │       │  │
│  │         │          ┌──────────▼───────────────────┤       │  │
│  │         │          │  Tools (Skill 注册表)         │       │  │
│  │         │          │  ├── getCurrentLesson()      │       │  │
│  │         │          │  ├── recordMistake()        │       │  │
│  │         │          │  ├── giveReward()            │───────┤  │
│  │         │          │  ├── suggestGame()           │       │  │
│  │         │          │  ├── checkProgress()         │       │  │
│  │         │          │  └── getPetStatus()          │       │  │
│  │         │          └──────────┬───────────────────┘       │  │
│  │         │                     │                           │  │
│  │  ┌──────▼─────────────────────▼───────────────────────┐   │  │
│  │  │            AI 路由器 (自动选择推理方式)                │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 1: langchain_openai → DeepSeek API            │   │  │
│  │  │           (有网+有Key → AgentExecutor 自动推理)       │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 2: langchain_ollama → 本地 Qwen2 模型         │   │  │
│  │  │           (无网+有模型 → AgentExecutor 本地推理)     │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 3: 规则引擎 (固定模板)                          │   │  │
│  │  │           (无网+无模型 → 绝对可靠)                     │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │  本地存储      │  │  课程内容     │  │  网络检测     │      │  │
│  │  │  Isar         │  │  assets JSON │  │  auto switch │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ 单进程，无需 Node.js / Termux                                 │
│  ✅ 包体 ~60MB (LangChain.dart 是纯 Dart 包，几乎不增加包体)      │
│  ✅ Skill 插件化 (Tool 接口，后续增加技能只需实现接口)            │
│  ✅ Agent 推理循环 (AgentExecutor = ReAct)                       │
│  ✅ 对话记忆 (Memory 模块自动管理上下文)                          │
│  ✅ 三层降级 (云端 → 本地 → 规则)                                 │
└──────────────────────────────────────────────────────────────────┘
```

#### 代码示例：定义教学 Skill (Tool)

```dart
import 'package:langchain/langchain.dart';
import 'package:langchain_openai/langchain_openai.dart';

// 1. 定义教学工具 (Skill = Tool)
class GetCurrentLessonTool implements Tool {
  @override
  String get name => 'get_current_lesson';

  @override
  String get description => '获取当前课程内容，返回课程名称、单词列表和句型';

  @override
  Map<String, dynamic> get inputSchema => {
    'type': 'object',
    'properties': {},
  };

  @override
  Future<ToolResult> invoke(ToolInput input) async {
    final lesson = await db.lessons.getCurrent();
    return ToolResult(
      output: '{"name": "${lesson.name}", "words": ${lesson.words}}',
    );
  }
}

class RecordMistakeTool implements Tool {
  @override
  String get name => 'record_mistake';

  @override
  String get description => '记录孩子某个单词的错误';

  @override
  Map<String, dynamic> get inputSchema => {
    'type': 'object',
    'properties': {
      'word': {'type': 'string', 'description': '错误的单词'},
    },
    'required': ['word'],
  };

  @override
  Future<ToolResult> invoke(ToolInput input) async {
    final word = input['word'] as String;
    await db.mistakes.insert({'word': word, 'timestamp': DateTime.now()});
    return ToolResult(output: '已记录单词 "$word" 的错误');
  }
}

class GiveRewardTool implements Tool {
  @override
  String get name => 'give_reward';

  @override
  String get description => '给予宠物经验值奖励';

  @override
  Map<String, dynamic> get inputSchema => {
    'type': 'object',
    'properties': {
      'xp': {'type': 'integer', 'description': '经验值数量'},
    },
    'required': ['xp'],
  };

  @override
  Future<ToolResult> invoke(ToolInput input) async {
    final xp = input['xp'] as int;
    await petService.addExperience(xp);
    return ToolResult(output: '宠物获得 $xp 经验值');
  }
}

// 2. 创建 Agent (ReAct 循环)
Future<String> createTeachingAgent() async {
  // 模型: DeepSeek 通过 OpenAI 兼容模式接入
  final model = ChatOpenAI(
    apiKey: 'your-deepseek-api-key',
    baseUrl: 'https://api.deepseek.com/v1',  // DeepSeek API 地址
    model: 'deepseek-chat',
  );

  // 工具列表 (Skill 注册表)
  final tools = [
    GetCurrentLessonTool(),
    RecordMistakeTool(),
    GiveRewardTool(),
    // 后续可轻松添加更多 Skill...
  ];

  // 创建 Agent (自动 ReAct 循环)
  final agent = ToolCallingAgent.fromLLMAndTools(
    llm: model,
    tools: tools,
    systemMessage: '''
      你是一个一年级英语教师AI助手。你可以:
      1. 获取当前课程内容
      2. 记录孩子的错误
      3. 给予宠物经验奖励
      请根据孩子的回答，智能决定使用哪些工具。
      语气要亲切、鼓励为主，适合6-7岁的孩子。
    ''',
  );

  // 创建执行器 (管理 Thought-Action-Observation 循环)
  final executor = AgentExecutor(agent: agent, tools: tools);

  return executor;
}

// 3. 使用 Agent
Future<String> chatWithStudent(AgentExecutor executor, String userInput) async {
  final result = await executor.invoke({'input': userInput});
  return result['output'] as String;
}
```

#### pubspec.yaml 依赖更新

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Agent 框架 (替代 DSH)
  langchain: ^0.9.0                    # 核心包: Agent + Chain + Memory
  langchain_openai: ^0.9.0            # OpenAI/DeepSeek 兼容接入
  langchain_community: ^0.9.0         # 社区工具集
  # langchain_ollama: ^0.9.0          # 本地模型 (可选，离线时用)

  # 状态管理 / 路由 / UI (不变)
  flutter_riverpod: ^2.x
  go_router: ^14.x
  # ... 其余依赖不变
```

#### 对比结论：为什么 LangChain.dart > DSH？

| 对比维度 | LangChain.dart | DSH |
|---------|:--------------:|:---:|
| **移动端适配** | ✅ Flutter 原生 | ❌ 需 Termux |
| **安装方式** | `flutter pub add langchain` | 装 APK + Node.js |
| **包体影响** | ~0（纯 Dart 代码包） | +80MB |
| **运行方式** | Flutter 进程内 | 独立 Node.js 进程 |
| **版本状态** | v0.9.0 稳定版 | 开发者预览版 |
| **Skill 扩展** | 实现 Tool 接口 | Cordis 插件 |
| **Agent 循环** | AgentExecutor (内置) | 自带 |
| **模型适配** | OpenAI/Ollama/Google 等 | 适配器层 |
| **DeepSeek 接入** | OpenAI 兼容模式 | 适配器 |
| **本地模型** | langchain_ollama | 适配器 |
| **对话记忆** | ✅ Memory 模块 | ✅ 状态层 |
| **RAG 检索** | ✅ 向量库支持 | ❌ |
| **社区活跃度** | 3 年 60 版本，刚更新 | 15 天前开源 |
| **生产案例** | ✅ 有 Flutter App 案例 | ❌ 无 |

**结论**：LangChain.dart 是 Flutter 移动 App 嵌入 Agent 框架的唯一正确选择。
- 它给你想要的 **Agent 框架**（不是简单的 Function Calling）
- 它是 **Dart 原生**（不需要 Node.js/Termux）
- 它有 **AgentExecutor**（完整的 ReAct 循环，自动管理 Thought-Action-Observation）
- 它有 **Tool 接口**（等同于 Skill/Harness 插件，灵活扩展）
- 它有 **Memory 模块**（对话记忆自动管理）
- 它支持 **多模型**（DeepSeek/OpenAI/Ollama 本地模型，自动切换）

---

#### 审查 7：HarmonyOS 适配 ✅ 已修正（原为严重错误）

**原问题**：文档中多处声称"鸿蒙设备兼容 Android APK"，这在 HarmonyOS NEXT（纯血鸿蒙）上是**错误的**。**已在 2.2 节、第十四节等处修正。**

**业界实际情况**：

| 鸿蒙版本 | 是否兼容 APK | 说明 |
|---------|:----------:|------|
| HarmonyOS 4.x 及以下 | ✅ 兼容 | 基于 AOSP，可装 APK |
| **HarmonyOS NEXT (5.0+)** | ❌ **不兼容** | 纯血鸿蒙，彻底去除 AOSP，**无法安装 APK** |

> 华为已全面切换到 HarmonyOS NEXT，新设备不再支持 Android APK。这意味着**直接发 APK 给鸿蒙用户将无法安装**。

**修正方案**：

| 方案 | 说明 | 可行性 | 推荐度 |
|------|------|:------:|:------:|
| **方案A: flutter_flutter_ohos 适配** | 使用 OpenHarmony 官方 Flutter 分支 | ✅ 可行 | ⭐⭐⭐⭐ |
| **方案B: 鸿蒙 ArkTS 原生重写** | 用 ArkTS 重写 UI | ✅ 可行但成本高 | ⭐⭐ |
| **方案C: 先支持 Android，鸿蒙后续适配** | MVP 阶段只发 Android | ✅ 最务实 | ⭐⭐⭐⭐⭐ |
| ❌ 方案D: 发 APK 给鸿蒙用户 | HarmonyOS NEXT 不支持 | ❌ 不可行 | ⭐ |

**建议**：MVP 阶段先只支持 Android，鸿蒙适配放到第二阶段（使用 [flutter_flutter_ohos](https://gitcode.com/openharmony-sig/flutter_flutter) 官方分支）。

---

#### 审查 8：本地数据库 — Isar ⚠️ 需关注

**风险**：

| 风险 | 严重度 | 说明 |
|------|:------:|------|
| Isar 维护活跃度 | 🟡 中 | isar.dev 仍在运营，但更新频率降低 |
| Isar 4.x 延迟 | 🟡 中 | Isar 4.0 预告已久但未正式发布 |
| 社区讨论替代方案 | 🟡 中 | 部分 Flutter 开发者转向 Drift / Realm |

**业界对比**：

| 数据库 | 类型 | 性能 | 维护状态 | 适合场景 | 推荐度 |
|--------|------|:----:|:-------:|---------|:------:|
| **Isar 3.x** | NoSQL | 极快 | ⚠️ 活跃度下降 | 宠物数据/进度 | ⭐⭐⭐⭐ |
| **Drift (SQLite)** | SQL | 快 | ✅ 活跃 | 结构化数据 | ⭐⭐⭐⭐⭐ |
| **Realm** | NoSQL | 快 | ✅ 活跃 | 复杂对象关系 | ⭐⭐⭐⭐ |
| **sqflite** | SQL | 中 | ✅ 稳定 | 简单数据 | ⭐⭐⭐ |
| **Hive** | KV/NoSQL | 快 | ✅ 稳定 | 配置/简单数据 | ⭐⭐⭐⭐ |

**建议**：Isar 3.x 目前仍可用，但建议**预留数据库抽象层**，万一 Isar 停更可平滑迁移到 Drift。

---

#### 审查 9：宠物/游戏模块 — Flame + Lottie ✅ 通过

**验证点**：

| 验证项 | 结论 |
|--------|:----:|
| Flame 引擎是否适合儿童小游戏 | ✅ 轻量 2D 引擎，配对/拼图/选择游戏完全够用 |
| Lottie 动画是否成熟 | ✅ Airbnb 出品，大量 App 验证 |
| 是否有免费 Lottie 动画资源 | ✅ LottieFiles.com 有大量免费宠物动画 |
| Flame + Flutter 集成是否顺畅 | ✅ Flame 本身基于 Flutter，原生集成 |

**结论**：选型**正确**，Flame + Lottie 是 Flutter 游戏化 App 的标准组合。

---

#### 审查 10：打包分发 ✅ 通过（仅 Android）

**验证**：

| 平台 | 方式 | 直接安装 | 说明 |
|------|------|:--------:|------|
| Android | `flutter build apk` | ✅ | 微信发 APK，点击安装 |
| HarmonyOS NEXT | APK | ❌ | 不兼容，需用 flutter_flutter_ohos 适配 |
| iPadOS | ipa | ❌ | 需 App Store / TestFlight |

**结论**：Android 分发方案**正确**。鸿蒙和 iPad 需要额外处理，文档已说明。

---

### 16.3 问题修正清单（已全部处理）

| # | 问题 | 严重度 | 修正方案 | 状态 |
|---|------|:------:|---------|:----:|
| 1 | **HarmonyOS NEXT 不兼容 APK** | 🔴 高 | 2.2 节、第十四节已修正，MVP 先只支持 Android | ✅ 已修正 |
| 2 | **DSH 不适合嵌入移动 App** | 🔴 高 | 已改为 **LangChain.dart** (Dart 原生 Agent 框架) | ✅ 已修正 |
| 3 | **Isar 长期维护风险** | 🟡 中 | 预留数据库抽象层，可迁移到 Drift | ⚠️ 待开发时处理 |
| 4 | **本地模型性能未验证** | 🟡 中 | 开发时需实测中端手机推理速度 | ⚠️ 待开发时验证 |
| 5 | **数据流图写"纯本地"** | 🟡 中 | 第六节已改为混合架构数据流图 | ✅ 已修正 |
| 6 | **Agent 超时/无限循环风险** | 🟡 中 | 已增加 SafeAgentExecutor (maxIter=5, 15s 超时) | ✅ 已修正 |
| 7 | **API Key 明文存储风险** | 🟡 中 | 已增加 flutter_secure_storage 加密存储方案 | ✅ 已修正 |

### 16.4 修正后的最终架构

```
┌──────────────────────────────────────────────────────────────────┐
│                  修正后的最终架构 (V3 — LangChain.dart)             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Flutter App (单进程，全部内置)                              │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────────────┐  ┌──────────┐ │  │
│  │  │  语音模块     │  │  LangChain.dart     │  │  宠物养成  │ │  │
│  │  │  (纯 Dart)   │  │  Agent 引擎         │  │  (纯 Dart)│ │  │
│  │  └──────┬───────┘  └──────────┬───────────┘  └────┬─────┘ │  │
│  │         │                     │                   │       │  │
│  │         │          ┌──────────▼───────────────────┤       │  │
│  │         │          │  AgentExecutor (ReAct 循环)   │       │  │
│  │         │          │  ├── Thought (模型推理)        │       │  │
│  │         │          │  ├── Action (工具调用)         │       │  │
│  │         │          │  └── Observation (结果观察)    │       │  │
│  │         │          └──────────┬───────────────────┤       │  │
│  │         │                     │                   │       │  │
│  │         │          ┌──────────▼───────────────────┤       │  │
│  │         │          │  Tools (Skill 注册表)          │       │  │
│  │         │          │  ├── TeachingSkill           │       │  │
│  │         │          │  ├── PetSkill               │───────┤  │
│  │         │          │  └── GameSkill               │       │  │
│  │         │          └──────────┬───────────────────┘       │  │
│  │         │                     │                           │  │
│  │  ┌──────▼─────────────────────▼───────────────────────┐   │  │
│  │  │            AI 路由器 (自动选择推理方式)                │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 1: langchain_openai → DeepSeek API             │   │  │
│  │  │           (有网+有Key → AgentExecutor 自动推理)       │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 2: langchain_ollama → 本地 Qwen2 模型         │   │  │
│  │  │           (无网+有模型 → AgentExecutor 本地推理)     │   │  │
│  │  │                                                      │   │  │
│  │  │  Level 3: 规则引擎 (固定模板)                          │   │  │
│  │  │           (无网+无模型 → 绝对可靠)                     │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │  本地存储      │  │  课程内容     │  │  网络检测     │      │  │
│  │  │  Isar/Drift   │  │  assets JSON │  │  auto switch │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ 单进程，无需 Node.js / Termux                                 │
│  ✅ 包体 ~60MB (LangChain.dart 是纯 Dart 包，几乎不增加包体)      │
│  ✅ Agent 框架 (LangChain.dart: AgentExecutor + Tool + Memory)   │
│  ✅ Skill 插件化 (Tool 接口，后续增加技能只需实现接口)            │
│  ✅ 对话记忆 (Memory 模块自动管理上下文)                          │
│  ✅ 三层降级 (云端 → 本地 → 规则)                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 16.5 审查结论

| 维度 | 评分 | 说明 |
|------|:----:|------|
| **技术可行性** | 9/10 | LangChain.dart 原生 Dart Agent 框架，完美适配 Flutter |
| **成本控制** | 10/10 | 语音零成本，AI ~0.5 元/月，无服务器 |
| **开发效率** | 9/10 | Flutter + LangChain.dart + 三方库最大化复用 |
| **稳定性** | 8/10 | LangChain.dart v0.9.0 稳定版，三层降级保障 |
| **可扩展性** | 9/10 | Tool 接口 = Skill 插件化，Memory 自动记忆 |
| **分发便利性** | 8/10 | Android 直接发 APK，鸿蒙需额外适配 |

**最终判定**：方案在修正两个高风险问题（DSH → LangChain.dart、鸿蒙 APK 兼容性）后，
**技术可行、成本极低、Agent 能力完整、适合 MVP 快速开发**。