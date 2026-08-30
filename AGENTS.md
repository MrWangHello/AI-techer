# 项目记忆

## 已完成

- ✅ 删除Flutter部署工作流 (`flutter-web-deploy.yml`)，只保留Next.js GitHub Pages部署
- ✅ 3D动画白猫（5个表情视频）替换静态宠物图片
- ✅ Cat3D组件 - CSS mask 椭圆羽化，视频与页面背景融合
- ✅ GitHub Pages部署工作流配置完成
- ✅ 移除 Edge-TTS / Cloudflare Worker，改用浏览器原生 Web Speech API
- ✅ 语音模块：Chrome wake-up 修复、STT 文字输入降级、voiceSpeed 接入
- ✅ 宠物视频压缩（960×960 → 480×480，7.8MB → ~470KB）
- ✅ Cat3D 性能优化：poster 即时显示、Tab keep-alive、视频 prefetch 缓存

## 待测试

- ⏳ **TTS/STT 语音功能** - 部署后在真实浏览器（Chrome 手机端）手动测试
  - 测试步骤：
    1. 打开 https://mrwanghello.github.io/AI-techer/
    2. 切换到"学习"Tab，点击"朗读"按钮，确认有声音
    3. 切换到"宠物"Tab，点击麦克风说话，确认识别 + TTS 回复
    4. 在非 Chrome 浏览器测试文字输入降级（STT 不可用时）
    5. 设置页查看语音合成/识别支持状态

## 已知问题

- TTS 音色取决于手机系统语音包，无法指定 Neural 音色
- STT 在 QQ/UC 等浏览器不稳定，已提供文字输入降级
- 部分浏览器可能阻止视频自动播放，需用户点击页面后激活

## 语音方案（2026-08-30 确定）

- **TTS**：浏览器原生 `SpeechSynthesis`（Chrome wake-up 修复）
- **STT**：浏览器原生 `SpeechRecognition` / `webkitSpeechRecognition`
- **降级**：STT 不可用时显示文字输入框；TTS 不可用时提示使用 Chrome
- **已移除**：Edge-TTS Cloudflare Worker（国内 403 + Worker 缺少 Sec-MS-GEC）

## 语音模块问题记录

### 已修复：React error #418（语音识别）

- **根因**：SpeechRecognition 异步回调在组件卸载后触发 setState
- **修复**：VoiceController 中添加 `isMounted` 挂载守卫

### 已修复：TTS 无声音

- **根因**：Edge-TTS Worker 未配置 + 国内网络 403
- **修复**：回退到原生 SpeechSynthesis，含 Chrome wake-up 机制
