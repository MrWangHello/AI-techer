# 项目历史错误记忆

> 每次犯的错误记录在这里，后续开发前先阅读，避免重蹈覆辙。

---

## 错误 1：model-viewer ES Module 语法错误（致命）

**时间**：2026-08-29
**现象**：3D 模型永远加载不出来，所有浏览器都显示"3D 模型加载中..."
**根本原因**：`model-viewer.min.js` 是 ES Module 格式，包含 `export` 关键字。用普通 `<script>` 标签加载会报 `Uncaught SyntaxError: Unexpected token 'export'`。用 `<script type="module">` 加载则360/QQ浏览器不支持。
**错误做法**：反复在 ES Module 和普通 script 之间切换，从未真正解决问题。
**正确方案**：放弃 model-viewer，改用 Three.js r128（UMD 格式，所有浏览器兼容）+ GLTFLoader 直接渲染 GLB 模型。
**教训**：
- 不要假设某个库的格式，先检查源码是否包含 `export`/`import`
- 不要在没有浏览器 Agent 验证的情况下声称"已修复"
- 每次修改后必须用浏览器 Agent 实际访问页面验证

---

## 错误 2：3D 模型全屏覆盖层遮挡 Flutter 界面

**时间**：2026-08-29
**现象**：页面只显示3D机器人模型，Flutter UI（导航栏、页面内容）全部被遮挡
**根本原因**：`#model-viewer-container` 使用了 `position: fixed; z-index: 9999; width: 100%; height: 100%`，覆盖整个页面
**正确方案**：使用 `HtmlElementView` 将 3D 模型嵌入 Flutter 布局中，作为普通 Widget 的一部分
**教训**：
- 永远不要用 `position: fixed` + 全屏 z-index 覆盖层来嵌入 Web 组件
- 使用 Flutter 的 `HtmlElementView` + `platformViewRegistry` 正确嵌入

---

## 错误 3：dart:js 的 js.context.callMethod 编译失败

**时间**：2026-08-29
**现象**：`flutter build web` 报错 `The getter 'js' isn't defined`
**根本原因**：移除了 `import 'dart:js' as js;` 但代码中仍在使用 `js.context.callMethod()`
**正确方案**：用 `dart:html` 的 `ScriptElement` 替代 `dart:js` 的 eval
**教训**：
- 移除 import 前必须全局搜索所有引用
- `dart:js` 在 Flutter Web 中不推荐，优先用 `dart:html`

---

## 错误 4：HtmlElementView 中 MessageEvent.data 类型错误

**时间**：2026-08-29
**现象**：`The getter 'data' isn't defined for the class 'Event'`
**根本原因**：`addEventListener` 的回调参数类型是 `Event`，不是 `MessageEvent`，`Event` 没有 `.data` 属性
**正确方案**：将回调参数类型声明为 `html.MessageEvent`，或者用 `as html.MessageEvent` 强转
**教训**：
- `dart:html` 的事件类型必须精确匹配，`Event` ≠ `MessageEvent`
- 监听 message 事件时，参数类型必须是 `MessageEvent`

---

## 错误 5：没有用浏览器 Agent 自测就声称修复

**时间**：2026-08-29（多次）
**现象**：每次都说"已修复"、"验证通过"，但用户实际打开还是坏的
**根本原因**：没有真正用浏览器 Agent 访问页面、查看控制台错误、截图验证
**正确方案**：每次修改后必须：1) 构建 2) 部署 3) 用浏览器 Agent 访问 4) 查看控制台错误 5) 截图确认
**教训**：
- **永远不要在没有浏览器 Agent 验证的情况下声称修复成功**
- 浏览器 Agent 的 console_messages 是发现问题的关键工具
- 截图对比是验证 UI 变化的必要手段

---

## 错误 6：GitHub Actions API 限流导致无法查询构建状态

**时间**：2026-08-29
**现象**：`curl` 请求 GitHub API 返回 403 rate limit
**根本原因**：未认证的 GitHub API 请求频率限制很低（60次/小时）
**正确方案**：不要依赖 GitHub API 查询构建状态，直接等待足够时间后验证部署资源
**教训**：
- 部署后等待 2-3 分钟直接 curl 验证资源即可
- 不要用 GitHub API 轮询构建状态

---

## 错误 7：Flutter Service Worker 缓存旧版 index.html

**时间**：2026-08-29
**现象**：部署了新的 index.html（引用 three.min.js），但浏览器加载的仍是旧版（引用 model-viewer.min.js）
**根本原因**：Flutter 的 Service Worker 缓存了旧版 index.html，浏览器加载缓存而非网络最新版本
**正确方案**：在 index.html 中 flutter_bootstrap.js 之前添加清除 Service Worker 缓存和 Cache Storage 的代码
**教训**：
- Flutter Web 的 Service Worker 会缓存 index.html，导致新版本无法生效
- 每次重大更新都需要强制清除缓存
- 浏览器 Agent 验证时看到的是缓存页面，不是最新部署

---

## 通用规则（从以上错误总结）

1. **修改后必须用浏览器 Agent 验证**，不能只靠代码审查
2. **检查第三方库的格式**（UMD/ESM/CJS），确保加载方式匹配
3. **dart:html 事件类型必须精确**，Event ≠ MessageEvent ≠ KeyboardEvent
4. **不要移除 import 后遗留引用**，全局搜索确认
5. **Flutter Web 嵌入 Web 组件用 HtmlElementView**，不要用 position:fixed 覆盖层
6. **本地化所有第三方资源**，不依赖 CDN（国内访问不稳定）
7. **Flutter Service Worker 会缓存 index.html**，重大更新需清除缓存
