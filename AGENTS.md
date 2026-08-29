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
- 语音合成依赖浏览器 SpeechSynthesis API，不同浏览器表现可能有差异