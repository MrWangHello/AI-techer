# AI 英语老师 (Bella) — 开发维护文档

> 线上地址：https://mrwanghello.github.io/AI-techer/
> 技术栈：Next.js 16 静态导出 + GitHub Pages

---

## 1. 项目结构

```
ai-english-teacher/
├── src/
│   ├── app/page.tsx          # 主页面（4 Tab：首页/宠物/学习/设置）
│   ├── components/
│   │   ├── Cat3D.tsx       # 3D 宠物（视频循环 + CSS mask）
│   │   ├── VoiceController.tsx  # 麦克风 / 文字输入
│   │   └── StudyCards.tsx    # 单词学习 + 朗读
│   └── lib/
│       ├── speech.ts         # TTS/STT（Web Speech API）
│       ├── mock-agent.ts     # 关键词匹配 AI 回复
│       └── pet-data.ts       # 宠物数据 localStorage
├── public/
│   ├── videos/               # 5 个 mood MP4（480×480，共 ~470KB）
│   └── images/               # 5 张 JPG poster（即时占位）
└── docs/
    └── ARCHITECTURE.md       # 本文件
```

---

## 2. 3D 宠物（Cat3D）

### 2.1 视频资源（共 5 个）

| mood 键 | 视频文件 | poster 图片 | 标签显示 |
|---------|----------|-------------|----------|
| `neutral` | `white-cat-3d.mp4` | `white-cat.jpg` | 平静 🐱 |
| `happy` | `white-cat-happy-3d.mp4` | `white-cat-happy.jpg` | 开心 😊 |
| `sad` | `white-cat-sleepy-3d.mp4` | `white-cat-sleepy.jpg` | 困困 😴 |
| `surprised` | `white-cat-surprised-3d.mp4` | `white-cat-surprised.jpg` | 惊讶 😮 |
| `thinking` | `white-cat-thinking-3d.mp4` | `white-cat-curious.jpg` | 思考 🤔 |

> 注意：`sad` mood 使用的是 **sleepy（困倦/睡觉）** 视频，不是「难过」视频。

### 2.2 mood 如何触发切换

宠物表情由 `page.tsx` 中的 `agentEmotion` 状态控制，传给 `<Cat3D mood={agentEmotion} />`。

**触发来源：**

| 来源 | 文件 | 触发方式 | 典型 mood |
|------|------|----------|-----------|
| 语音/文字对话 | `mock-agent.ts` → `handleAgentResponse` | 关键词匹配后设置 `response.emotion` | 见下表 |
| 点击猫 | `page.tsx` onTap | 强制 `happy` | happy |
| 喂食按钮 | `handleFeed` | 强制 `happy` | happy |
| 玩耍按钮 | `handlePlay` | 强制 `happy` | happy |
| 洗澡按钮 | `handleBathe` | 强制 `happy` | happy |
| 睡觉按钮 | `handleSleep` | 强制 `sad`（困倦视频） | sad |

**语音关键词 → mood 映射（mock-agent.ts）：**

| 说/输入的内容 | mood |
|--------------|------|
| 你好、嗨 | happy |
| 喂、吃、饿 | happy |
| 玩、游戏 | happy |
| **学、单词** | **thinking** |
| 测验、考试 | surprised |
| **睡、困、休息** | **sad（困倦）** |
| 伤心、难过 | sad |
| 天气 | thinking |
| 无法识别 | neutral / thinking / happy（随机） |

### 2.3 为什么「有时切换、有时不切换」

**原因 1：emotion 会一直保持，不会自动恢复**

`agentEmotion` 只在上述事件触发时改变。比如说「学单词」后变成 `thinking`，之后不会自动回到 `neutral`，除非再次触发其他事件。

**原因 2：很多操作都设为 happy**

喂食、玩耍、洗澡、戳猫 → 全部 `happy`，容易看起来「总是开心」。

**原因 3：之前存在的竞态 bug（已修复）**

mood 切换时，新视频还在下载，但旧视频的 blob URL 已被应用到 `<video>` 上，导致标签变了但画面没变。修复方式：`activeSrc` 记录 URL 对应关系，只有 `activeSrc.url === currentVideo` 时才渲染 video。

**原因 4：睡觉之前映射错误（已修复）**

睡觉按钮和「睡/困」关键词之前设为 `neutral`（普通猫），现在改为 `sad`（困倦视频）。

### 2.4 背景融合方案

**问题根因：** MP4 源文件自带实心米色背景（约 `#f0ebe4`），与页面粉色渐变 `#fdf2f8` 不一致，CSS overlay 无法让视频背景变透明。

**当前方案：**
1. 宠物区域背景色设为 `#f0ebe4`，与视频源背景一致
2. CSS `mask-image` 椭圆 radial-gradient，让猫边缘淡出（不是 overlay 覆盖）
3. 去掉白色卡片 `bg-white`，避免色差
4. poster JPG 在视频加载前即时显示

**彻底解决方案（未实施，需重新制作素材）：**
- 导出带 Alpha 透明通道的 WebM 视频
- 或使用 Live2D / 静态 PNG 序列替代 MP4

---

## 3. 语音模块（speech.ts）

### 3.1 技术方案

| 功能 | API | 说明 |
|------|-----|------|
| TTS 朗读 | `SpeechSynthesis` | 浏览器原生，无后端；音色由系统/浏览器提供（Google/微软/苹果） |
| STT 识别 | `SpeechRecognition` / `webkitSpeechRecognition` | Chromium 系最佳（Chrome、Edge）；**非 Google 专属** |
| 降级 | 文字输入 | VoiceChatBar：STT 不可用或失败 → 自动切 ⌨️ 文字模式 |

**已移除：** Edge-TTS + Cloudflare Worker（国内 403，Worker 缺少 Sec-MS-GEC）  
**注意：** Edge-TTS 是微软**云端 API**，与 **Microsoft Edge 浏览器** 不是同一概念；Edge 浏览器可正常使用 Web Speech API。

### 3.2 为什么 Chrome 音色有时会变

**原因 1：系统音色列表异步加载**

Chrome 的 `speechSynthesis.getVoices()` 首次调用可能返回空数组，`onvoiceschanged` 事件后才返回完整列表。第一次 speak 可能用默认音色，后续用系统中文包音色。

**原因 2：每次 speak 重新选音色（已修复）**

之前 `createUtterance` 每次都从 `getVoices()` 重新匹配，可能选到不同 voice。现在 `cachePreferredVoices()` 在预热时锁定 `zh-CN` 和 `en-US` 各一个音色。

**原因 3：中英文参数不同（设计如此）**

| 语言 | rate | pitch |
|------|------|-------|
| 中文 `speak()` | `pet.voiceSpeed`（默认 1.0） | 1.1 |
| 英文 `speakEnglish()` | 0.9 | 1.0 |

**原因 4：Chrome wake-up 机制**

空闲时先 speak 一个空字符串唤醒引擎，再 speak 正文。唤醒过程不影响最终音色，但可能有极短延迟。

### 3.3 浏览器兼容性

> 详细 FAQ（荣耀/小米、Edge vs Google 等）见 [BROWSER_COMPAT_PLAN.md §11](./BROWSER_COMPAT_PLAN.md#11-用户-faq常见疑问)

| 浏览器 | TTS | STT | 说明 |
|--------|-----|-----|------|
| Chrome Android | ✅ | ✅（需联网，常走 Google 云端） | Android 推荐 |
| Chrome Desktop | ✅ | ✅ | 推荐 |
| **Edge Desktop** | ✅（微软音色） | ✅ | **Windows 推荐** |
| Edge Android | ✅ | ⚠️ 看机型 | 同 Chromium |
| Safari iOS | ✅ | 部分 | 语音 + 文字 |
| QQ / UC 浏览器 | ✅ TTS | ⚠️ STT 不稳定 | 文字为主 |
| Firefox | ✅ TTS | ❌ 无 STT API | 纯文字 |
| 微信内置 | 部分 | ❌ 常拒权限 | 纯文字，引导外链浏览器 |
| **荣耀/华为（无 GMS）** | ⚠️ | ❌ 装 Chrome 也常失败 | 缺 Google 移动服务，请用文字输入 |

**架构关系：**

```
网站 speech.ts → Web Speech API（标准接口）→ 浏览器/vendor 实现
                                              ├─ Chrome：Google 云端 STT + 系统音色
                                              ├─ Edge：微软音色 TTS + Chromium STT
                                              ├─ Safari：Apple 语音
                                              └─ Firefox：仅 TTS，无 STT
```

网站**不绑定 Google**；能否语音取决于浏览器 + 系统服务，不是网站配置项。

### 3.4 关键函数

```typescript
speak(text, onEnd?, speed?)       // 中文 TTS
speakEnglish(text, onEnd?, speed?) // 英文 TTS
warmUpSpeech()                     // 用户首次交互时预热
startListening(onResult, onError)  // STT
isSpeechSupported() / isSTTSupported() // 能力检测
```

---

## 4. 部署

### 4.1 自动部署

推送 `main` 分支 → GitHub Actions (`.github/workflows/deploy.yml`) → 构建 Next.js 静态站 → GitHub Pages

```bash
# 本地构建测试
cd ai-english-teacher
DEPLOY_TARGET=github-pages npm run build
# 输出在 out/ 目录
```

### 4.2 环境变量

| 变量 | 说明 |
|------|------|
| `DEPLOY_TARGET=github-pages` | 启用 basePath `/AI-techer` |
| `NEXT_PUBLIC_BASE_PATH` | 自动注入，视频/图片路径前缀 |

---

## 5. 常见问题排查

### TTS 无声音
1. 确认使用 **Chrome 或 Edge** 等支持 Web Speech 的浏览器（不限于 Chrome）
2. 检查手机系统设置 → 无障碍 → 文字转语音，是否安装了中文/英文语音包
3. 设置页查看「语音合成: ✅ 支持」
4. 首次点击需用户手势触发（warmUpSpeech）
5. **荣耀/华为无 GMS**：TTS 也可能受限，ReplyBar 仍显示文字回复

### STT 无法识别
1. 确认麦克风权限已允许
2. 需要网络连接（Chrome STT 通常走 Google 云端；Edge 走 Chromium 识别链路）
3. **荣耀/华为**：即使用 Chrome，缺 GMS 时 STT 常失败 → 点底部 ⌨️ 用文字输入
4. **Firefox**：不支持 STT，请直接用文字模式
5. 不支持或失败时 VoiceChatBar 会自动切文字输入

### 宠物视频不切换
1. 确认触发了会改变 emotion 的操作（见 2.2 表格）
2. emotion 不会自动恢复，需再次触发
3. 打开 DevTools 看 `[Cat3D]` 或 video 加载错误

### 宠物背景有框
1. 确认已部署最新版（背景色 `#f0ebe4`）
2. 若仍有框感，需重新制作透明背景视频素材

---

## 6. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-08-30 | 移除 Edge-TTS，改用 Web Speech API |
| 2026-08-30 | 视频压缩 960→480，7.8MB→470KB |
| 2026-08-30 | Cat3D：poster、prefetch、CSS mask、Tab keep-alive |
| 2026-08-30 | 全局 VoiceChatBar + VoiceReplyBar，类微信/豆包双模输入 |
| 2026-08-30 | 文档：浏览器语音 FAQ（荣耀/小米、Edge vs Google） |
