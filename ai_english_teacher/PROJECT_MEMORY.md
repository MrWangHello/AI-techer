# AI English Teacher - 项目记忆文档

> 本文档记录项目完整开发历史、决策、待办事项和技术细节，供后续开发参考。

---

## 一、项目概述

**项目名称**：AI English Teacher（AI 英语教师）
**目标**：面向儿童的 AI 英语学习 App，核心特色为 3D 拟人化宠物陪伴学习
**技术栈**：Flutter（目标）/ HTML 原型（当前可用）
**Git 仓库**：https://github.com/MrWangHello/AI-techer
**分支**：`main`（生产）、`trae/agent-PAeTIT`（开发）

---

## 二、已完成的工作

### 2.1 HTML 原型版本（`/workspace/ai_english_teacher/`）

- [x] 完整的移动端界面原型（`prototype.html`）
  - 首页、学习、宠物、成就 4 个 Tab 页
  - 宠物页面：经验值/饱腹度/心情进度条
  - 语音交互：Web Speech API（TTS + STT）
  - 宠物互动：点击触发行为、随机行为系统
- [x] 3D 角色集成（Three.js）
  - 使用 RobotExpressive.glb 模型（464KB，13 个动画）
  - 本地 Three.js 库（不依赖外部 CDN）
  - 动画：Idle、Dance、Jump、Wave、ThumbsUp、Yes、No、Punch 等
  - 图片回退机制（3D 加载失败时显示公主图片）
- [x] 3D 公主图片资源（AI 生成，3 张不同风格）
- [x] Python HTTP 服务器（8080 端口）

### 2.2 Flutter 项目（`/workspace/ai_english_teacher_flutter/`）

- [x] Flutter SDK 3.24.5 安装完成（中国镜像下载）
- [x] Flutter Web 项目创建完成
- [x] `pubspec.yaml` 配置（依赖 `web: ^1.1.0`）
- [x] `lib/main.dart` 完整代码（4 个页面 + 3D 宠物页）
- [x] GLB 模型资源放入 `assets/models/`
- [x] `web/index.html` 配置
- [x] GitHub Actions 工作流文件（`.github/workflows/flutter-web-deploy.yml`）

### 2.3 资源文件

| 文件 | 路径 | 说明 |
|------|------|------|
| RobotExpressive.glb | `ai_english_teacher/assets/models/` | 3D 机器人模型，464KB，13 个动画 |
| three.module.js | `ai_english_teacher/assets/js/` | Three.js 核心库，1.3MB |
| GLTFLoader.js | `ai_english_teacher/assets/js/` | GLB 模型加载器，106KB |
| princess_pet.jpg | `ai_english_teacher/assets/images/` | 3D 公主图片（回退用） |

---

## 三、关键技术决策

### 3.1 3D 方案选型

| 方案 | 结论 | 原因 |
|------|------|------|
| CSS 2D 卡通 | ❌ 放弃 | 用户反馈"太卡通，不好看" |
| 静态 3D 图片 | ❌ 放弃 | 用户反馈"不像 3D，不能动" |
| Three.js + GLB（HTML） | ✅ 当前使用 | 真正的 3D 动画，本地资源不依赖 CDN |
| flutter_3d_controller | ❌ 放弃 | 依赖 flutter_inappwebview，不支持 Web 编译 |
| o3d | ❌ 放弃 | 同样依赖 flutter_inappwebview |
| model_viewer_plus | ❌ 放弃 | 依赖 WebView，Web 编译失败 |
| Flutter 手写 model-viewer | ⏸️ 待实现 | 最终方案，需要 dart:html 嵌入 |

### 3.2 3D 模型选型

| 模型 | 结论 | 原因 |
|------|------|------|
| plewr.itch.io 素体 | ❌ 未使用 | 需要手动操作 Blender 合并服装 |
| Mixamo 动画 | ❌ 未使用 | 需要手动登录 Adobe 操作 |
| CGTrader 卡通女孩 | ❌ 未使用 | 需要登录才能下载 |
| Ready Player Me | ❌ 已关停 | 2026年1月31日关闭 |
| **RobotExpressive**（Three.js 示例） | ✅ 当前使用 | 免费、可直接下载、自带 13 个动画 |

### 3.3 部署方案

| 方案 | 结论 | 原因 |
|------|------|------|
| 本地 HTTP 服务器 | ✅ 当前使用 | 快速验证，手机浏览器直接访问 |
| GitHub Actions + Pages | ⏸️ 待配置 | 需要 GitHub 认证（PAT），GitHub 暂时打不开 |
| Flutter APK | ⏸️ 未来目标 | 需要 Android SDK，原生语音功能 |

### 3.4 CDN 选型

| CDN | 测试结果 | 结论 |
|------|---------|------|
| jsdelivr | 200（0.64s） | 国内可能不稳定 |
| unpkg | 200（1.63s） | 较慢 |
| bootcdn | 404 | 路径不存在 |
| cdnjs | 404 | 路径不存在 |
| npmmirror | 200（0.09s） | 最快 |
| **本地文件** | ✅ 最终方案 | 零依赖，最可靠 |

---

## 四、遇到的问题与解决方案

### 4.1 Three.js 3D 区域空白
- **问题**：手机端 3D 区域显示空白
- **原因**：jsdelivr CDN 在国内可能被墙/访问慢
- **解决**：将 Three.js 下载到本地 `assets/js/`，使用本地 importmap

### 4.2 Flutter Web 编译失败（flutter_3d_controller）
- **问题**：`Error: Couldn't resolve the package 'flutter_inappwebview_web'`
- **原因**：flutter_3d_controller 依赖 flutter_inappwebview，不支持 Web
- **解决**：换用 `web` 包 + 手写 model-viewer 方案（待实现）

### 4.3 Flutter Web 编译失败（o3d）
- **问题**：同样依赖 flutter_inappwebview
- **解决**：放弃 o3d

### 4.4 GitHub 推送失败
- **问题**：沙箱环境无 GitHub 认证，无法 push
- **原因**：非交互式环境，无法输入密码；gh CLI 未登录
- **状态**：待用户 GitHub 恢复后提供 PAT 或在本地电脑推送

### 4.5 Flutter SDK 下载慢
- **问题**：官方源下载 700MB+ 文件极慢
- **解决**：使用清华大学镜像 `storage.flutter-io.cn`，速度 10MB/s

---

## 五、待办事项（Pending Tasks）

### 高优先级

- [ ] **GitHub 推送代码**
  - 需要用户提供 PAT 或在本地电脑执行 `git push`
  - 推送后触发 GitHub Actions 自动编译部署到 GitHub Pages
  - 目标 URL：`https://mrwanghello.github.io/AI-techer/`

- [ ] **Flutter Web 3D 角色实现**
  - 用 `dart:html` 嵌入 Google `<model-viewer>` Web Component
  - 不依赖任何第三方 WebView 包
  - 实现动画切换（Idle/Wave/Dance/Jump 等）
  - 编译 Flutter Web 并部署

- [ ] **替换 3D 模型为女性角色**
  - 当前使用机器人模型（RobotExpressive）
  - 目标：卡通拟人小女孩（类似国漫风格）
  - 候选：CGTrader 卡通女孩（需手动下载）、AI 生成 GLB

### 中优先级

- [ ] **语音功能完善**
  - Flutter Web 版：Web Speech API（有限制）
  - Flutter APK 版：原生 Speech-to-Text（完整功能）
  - 需要解决移动端浏览器语音权限问题

- [ ] **GitHub Pages 部署配置**
  - 在仓库 Settings → Pages 中设置 Source 为 GitHub Actions
  - 配置 `--base-href "/AI-techer/"`

- [ ] **Flutter APK 编译**
  - 需要 Android SDK 环境
  - 编译后可安装到手机，获得完整原生体验

### 低优先级

- [ ] 宠物形象升级为真正的 3D 公主（非机器人）
- [ ] 宠物交互特效（粒子效果、表情变化）
- [ ] 学习页面、成就页面功能开发
- [ ] 后端 API 集成

---

## 六、项目文件结构

```
/workspace/
── .github/
│   ── workflows/
│       └── flutter-web-deploy.yml    # GitHub Actions 自动部署
── ai_english_teacher/               # HTML 原型（当前可用）
│   ├── prototype.html                # 主界面原型
│   ├── assets/
│   │   ├── js/
│   │   │   ├── three.module.js       # Three.js 核心（本地）
│   │   │   └── GLTFLoader.js         # GLB 加载器（本地）
│   │   ├── models/
│   │   │   └── RobotExpressive.glb   # 3D 机器人模型
│   │   └── images/
│   │       └── princess_pet.jpg      # 3D 公主图片（回退）
│   ├── DEVELOPMENT_WORKFLOW.md
│   ├── IMPLEMENTATION_NOTES.md
│   └── README.md
├── ai_english_teacher_flutter/       # Flutter 项目（开发中）
│   ├── lib/main.dart                 # 主代码（4 个页面）
│   ├── pubspec.yaml                  # 依赖配置
│   ├── web/index.html                # Web 入口
│   ├── assets/models/
│   │   └── RobotExpressive.glb
│   └── ...
└── flutter/                          # Flutter SDK 3.24.5
```

---

## 七、用户反馈记录

1. **"太卡通了，不太好看"** → 从 CSS 2D 卡通兔子升级为 3D 方案
2. **"不像个 3D，纯图片感觉"** → 从静态图片升级为 Three.js 真实 3D GLB 模型
3. **"外部页面很多功能无法验证"** → 决定采用 Flutter 方案
4. **"Flutter SDK 下载慢"** → 使用国内镜像加速
5. **"GitHub 打不开了"** → 先用本地 HTTP 服务验证，等 GitHub 恢复再推送

---

## 八、下一步行动计划

### 立即可做（无需 GitHub）
1. 手机浏览器访问 `http://localhost:8080/prototype.html` 体验 3D 效果
2. 验证 3D 角色动画、交互是否正常

### GitHub 恢复后
1. 用户提供 PAT → 自动推送代码
2. 或用户在本地电脑执行：
   ```bash
   cd AI-techer
   git pull origin trae/agent-PAeTIT
   git push origin main
   ```
3. 配置 GitHub Pages（Settings → Pages → Source: GitHub Actions）
4. 等待 2-3 分钟自动部署
5. 访问 `https://mrwanghello.github.io/AI-techer/`

### 长期目标
1. Flutter Web 版上线（真正的 3D + 动画控制）
2. Flutter APK 版（原生语音、完整功能）
3. 替换为女性 3D 角色模型

---

## 九、重要命令备忘

```bash
# 启动本地服务
cd /workspace/ai_english_teacher && python3 -m http.server 8080

# Flutter 相关
export PATH="/workspace/flutter/bin:$PATH"
cd /workspace/ai_english_teacher_flutter
flutter pub get
flutter build web --release --base-href "/AI-techer/"

# Git 推送
git add .
git commit -m "feat: ..."
git push origin main
```

---

*文档最后更新：2026-08-29*
*下次开发前请阅读本文档以了解项目状态*
