# 项目记忆

## 已完成

- ✅ 删除Flutter部署工作流 (`flutter-web-deploy.yml`)，只保留Next.js GitHub Pages部署
- ✅ 3D动画白猫（5个表情视频）替换静态宠物图片
- ✅ Cat3D组件 - 视频背景羽化融合，边缘渐变过渡到页面背景
- ✅ GitHub Pages部署工作流配置完成

## 待测试

- ⏳ **TTS语音合成（语音朗读）** - 部署后未在真实浏览器中测试
  - 原因：沙箱环境限制，SpeechSynthesis API 无法正常工作
  - 测试方式：部署到 GitHub Pages 后，在真实浏览器中手动测试
  - 测试步骤：
    1. 打开 https://mrwanghello.github.io/AI-techer/
    2. 切换到"学习"Tab，点击"朗读"按钮
    3. 切换到"首页"或"宠物"Tab，点击麦克风按钮
    4. 确认是否有声音输出

## 已知问题

- 视频文件较大（每个约2-3MB），首次加载可能需要时间
- 部分浏览器可能阻止视频自动播放，需要用户点击页面后激活

## 语音模块问题记录（2026-08-30）

### 问题1：TTS 输出无声音 — TimeoutError: signal timed out

- **现象**：点击麦克风或朗读按钮后，`/synthesize` 请求在恰好 15 秒后被取消，控制台报 `[TTS] Synthesis failed: TimeoutError: signal timed out`
- **根因**：`NEXT_PUBLIC_TTS_WORKER_URL` 环境变量未配置。项目无 `.env` 文件，`next.config.ts` 中该变量 fallback 为空字符串 `''`，导致请求发到相对路径 `/synthesize`，必然超时
- **关键代码**：
  - [speech.ts#L15-L16](file:///workspace/ai-english-teacher/src/lib/speech.ts#L15-L16)：默认 URL 含占位符 `'你的用户名'`，但 `next.config.ts` 的 env 注入覆盖了它为空字符串
  - [next.config.ts#L19](file:///workspace/ai-english-teacher/next.config.ts#L19)：`process.env.NEXT_PUBLIC_TTS_WORKER_URL || ''`
- **之前正常的原因**：之前使用浏览器原生 `SpeechSynthesis` API，不依赖外部服务；切换到 Edge-TTS Worker 后，Worker 未部署/未配置 URL，所以无声音
- **解决方向**：
  1. 部署 Edge-TTS Cloudflare Worker 并在 `.env` 中配置 `NEXT_PUBLIC_TTS_WORKER_URL`
  2. 或者回退到浏览器原生 `SpeechSynthesis` API 作为 fallback

### 问题2：语音识别输入报错 — React error #418

- **现象**：控制台报 `Uncaught Error: Minified React error #418`
- **根因**：`SpeechRecognition` 的回调（`onresult`/`onerror`）是异步的，可能在组件已卸载（如切换 Tab）后才触发，此时调用 `setState`（`setListening`/`setStatusText`/`setSpeaking`）导致 React 在已卸载组件上更新状态
- **关键代码**：[VoiceController.tsx#L54-L88](file:///workspace/ai-english-teacher/src/components/VoiceController.tsx#L54-L88)
- **解决方向**：在组件中加 `useRef` 标记挂载状态，回调中先检查组件是否仍挂载再 setState；或用 `AbortController` 在卸载时取消识别