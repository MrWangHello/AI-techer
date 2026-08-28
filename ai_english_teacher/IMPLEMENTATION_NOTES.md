# 实现问题记录

## 已完成的功能模块

### 1. 核心架构 ✅
- Flutter 项目结构搭建
- Riverpod 状态管理配置
- go_router 路由系统
- 主题配置

### 2. 数据库层 ✅
- Isar 数据库模型定义（Pet, LearningProgress, MistakeRecord）
- DatabaseService 封装基础操作

### 3. 语音模块 ✅
- STT 服务（系统原生）
- TTS 服务（系统原生）
- 音频播放服务

### 4. AI 引擎 ✅
- LangChain.dart Agent 框架集成
- 5 个教学工具实现：
  - GetCurrentLessonTool
  - RecordMistakeTool
  - GiveRewardTool
  - CheckProgressTool
  - GetTeachingMethodTool
- AI 路由器（云端/本地/规则引擎三层降级）
- SafeAgentExecutor 错误处理
- 规则引擎兜底实现

### 5. 课程内容系统 ✅
- Course 数据模型
- CourseRepository 加载逻辑
- 8 个单元课程 JSON 数据（Greetings, Colors, Numbers, Animals, Fruits, Family, Body, Actions）

### 6. 宠物系统 ✅
- Pet 数据模型（等级、经验、饱腹度、心情、进化阶段）
- PetProvider 状态管理
- 宠物页面 UI

### 7. 配置管理 ✅
- AppConfig 用户设置
- ApiKeyManager API Key 加密存储
- 设置页面 UI

### 8. 网络检测 ✅
- NetworkService 网络状态监控
- 自动降级逻辑

### 9. 页面 UI ✅
- HomePage 首页（宠物展示、课程列表、快捷操作）
- LearningPage 课程列表页
- LessonDetailPage 课程详情页
- ChatPage AI 对话页
- PetPage 宠物页
- SettingsPage 设置页

---

## 待解决的问题和待确认事项

### 问题 1：Isar 代码生成 ⚠️
**问题描述**：Isar 需要运行代码生成器来创建 `.g.dart` 文件
**解决方案**：
```bash
flutter pub run build_runner build
```
**待确认**：是否需要在项目中包含生成的文件？

### 问题 2：LangChain.dart API 兼容性 ⚠️
**问题描述**：LangChain.dart 的 Tool 接口和 ChatAgent 实现可能需要根据实际版本调整
**当前实现**：使用了简化的 ChatAgent 类
**待确认**：
- 是否需要实现完整的 ReAct 循环？
- ToolCallingAgent 的具体 API 需要验证

### 问题 3：本地模型集成 ⚠️
**问题描述**：技术方案中提到使用 langchain_ollama 集成本地 Qwen2-0.5B 模型
**当前状态**：未实现，仅实现了云端 API 和规则引擎
**待确认**：
- 是否需要在 MVP 阶段实现本地模型？
- 移动端 Ollama 的可行性需要验证

### 问题 4：云端语音 API 集成 ⚠️
**问题描述**：技术方案中提到集成豆包/百度语音 API
**当前状态**：仅实现了系统原生 STT/TTS
**待确认**：
- 是否需要在 MVP 阶段实现云端语音 API？
- 需要申请相应的 API Key

### 问题 5：资源文件缺失 ⚠️
**问题描述**：课程 JSON 中引用的图片、音频资源文件不存在
**待处理**：
- 需要创建 placeholder 资源文件
- 或者修改代码使用占位符图标

### 问题 6：Lottie 动画集成 ⚠️
**问题描述**：宠物系统需要使用 Lottie 动画
**当前状态**：使用 Material Icons 作为占位符
**待确认**：
- 是否需要立即购买/制作 Lottie 动画文件？
- 或者使用其他动画方案（如 Rive）？

### 问题 7：Flame 游戏引擎 ⚠️
**问题描述**：技术方案中提到使用 Flame 实现小游戏
**当前状态**：未实现任何游戏
**待确认**：
- 是否需要在 MVP 阶段实现游戏？
- 游戏类型优先级：配对 > 选择 > 拼图

### 问题 8：权限处理 ⚠️
**问题描述**：需要处理麦克风权限、存储权限等
**当前状态**：未实现权限请求逻辑
**待处理**：在语音模块初始化时添加权限请求

### 问题 9：API Key 验证 ⚠️
**问题描述**：设置页面保存 API Key 时没有验证
**待处理**：添加 API Key 验证功能，测试连接是否正常

### 问题 10：学习进度持久化 ⚠️
**问题描述**：课程学习进度没有完整实现
**待处理**：
- 在 LessonDetailPage 中记录学习时长
- 更新 LearningProgress 数据库
- 在 HomePage 显示课程完成状态

### 问题 11：宠物互动动画 ⚠️
**问题描述**：喂食、玩耍按钮没有动画反馈
**待处理**：
- 添加宠物动画（Lottie 或 Flutter 动画）
- 添加经验值增加动画
- 添加升级/进化特效

### 问题 12：对话记忆系统 ⚠️
**问题描述**：AI 对话没有实现上下文记忆
**待处理**：使用 LangChain 的 Memory 模块实现对话历史

### 问题 13：发音评测 ⚠️
**问题描述**：没有实现发音准确性评测
**待确认**：
- 是否使用云端 API 的置信度作为评分？
- 或者实现本地音素对比算法？

### 问题 14：多语言支持 ⚠️
**问题描述**：当前仅支持英文教学内容，界面是中文
**待确认**：是否需要支持英文界面？

### 问题 15：数据导出 ⚠️
**问题描述**：设置页面有"导出学习报告"按钮但未实现
**待处理**：实现学习数据导出功能（PDF/Excel）

---

## 技术债务

### 1. 错误处理不完善
- 很多异步操作没有完整的 try-catch
- 用户友好的错误提示不足

### 2. 性能优化
- 课程列表没有使用懒加载
- 图片资源没有缓存策略

### 3. 测试覆盖
- 没有单元测试
- 没有 Widget 测试

### 4. 文档
- 代码注释较少
- 缺少 API 文档

---

## 下一步建议

### MVP 阶段（优先级高）
1. 运行 `build_runner` 生成 Isar 代码
2. 创建 placeholder 资源文件
3. 实现权限请求逻辑
4. 完善学习进度记录
5. 测试 AI 对话功能

### 第二阶段
1. 集成 Lottie 宠物动画
2. 实现至少一个简单游戏（配对游戏）
3. 实现对话记忆系统
4. 添加 API Key 验证

### 第三阶段
1. 集成云端语音 API（豆包/百度）
2. 实现发音评测
3. 添加庆祝特效
4. 性能优化

---

## 运行说明

### 环境要求
- Flutter 3.x
- Dart 3.x
- Android Studio / Xcode（用于模拟器）

### 运行步骤
```bash
# 1. 进入项目目录
cd ai_english_teacher

# 2. 安装依赖
flutter pub get

# 3. 生成 Isar 代码
flutter pub run build_runner build

# 4. 运行应用
flutter run
```

### 注意事项
- 首次运行会自动创建数据库
- API Key 可选配置，不配置则使用规则引擎
- 需要麦克风权限才能使用语音功能

---

## 文件清单

### 核心文件
- `lib/main.dart` - 应用入口
- `lib/app.dart` - App 组件
- `pubspec.yaml` - 依赖配置

### 核心模块
- `lib/core/router/app_router.dart` - 路由配置
- `lib/core/theme/app_theme.dart` - 主题配置
- `lib/core/constants/app_constants.dart` - 常量定义

### 功能模块
- `lib/features/home/` - 首页
- `lib/features/learning/` - 学习模块
- `lib/features/ai_tutor/` - AI 教学引擎
- `lib/features/pet/` - 宠物系统
- `lib/features/voice/` - 语音服务
- `lib/features/settings/` - 设置模块

### 共享模块
- `lib/shared/database/` - 数据库服务
- `lib/shared/network/` - 网络服务

### 资源文件
- `assets/courses/` - 课程 JSON 数据（8 个单元）
- `assets/images/` - 图片资源（待创建）
- `assets/audio/` - 音频资源（待创建）
- `assets/animations/` - 动画资源（待创建）

---

## 总结

已实现核心功能框架，包括：
- ✅ 完整的 Flutter 项目结构
- ✅ 数据库模型和服务
- ✅ 语音模块（系统原生）
- ✅ AI 引擎（云端 API + 规则引擎）
- ✅ 课程内容系统（8 个单元）
- ✅ 宠物系统基础
- ✅ 配置管理
- ✅ 网络检测
- ✅ 所有主要页面 UI

待完善：
- ⚠️ Isar 代码生成
- ⚠️ 资源文件创建
- ⚠️ 权限处理
- ⚠️ 学习进度持久化
- ⚠️ Lottie 动画
- ⚠️ 小游戏
- ⚠️ 云端语音 API
- ⚠️ 发音评测

项目可以运行，但需要补充资源文件和运行代码生成器后才能完整使用。
