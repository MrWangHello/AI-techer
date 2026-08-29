# PROJECT MEMORY - 历史错误记录

> **每次开发前必读此文件，避免重蹈覆辙。**

---

## ❌ 错误 1：model-viewer ES Module 不兼容（2026-08-29）

**问题**：`model-viewer.min.js` 报 `Uncaught SyntaxError: Unexpected token 'export'`，3D模型永远加载不出来

**根因**：
- `model-viewer v3.x` 是 ES Module 格式，包含 `export` 关键字
- 用普通 `<script>` 标签加载会报 SyntaxError
- 用 `<script type="module">` 加载则360/QQ浏览器不支持

**错误做法**：
1. 反复在 ES Module 和普通 script 之间切换
2. 声称"已修复"但实际从未在浏览器中验证过
3. 没有检查源码格式就假设能加载

**正确方案**：
- 放弃 model-viewer，改用 Three.js r128 UMD 格式
- Three.js UMD 用传统 `<script>` 标签，所有浏览器兼容
- 用 GLTFLoader 直接加载 .glb 模型
- 文件本地化部署，不依赖 CDN

---

## ❌ 错误 2：3D模型全屏覆盖层遮挡UI（2026-08-29）

**问题**：页面只显示3D机器人，Flutter UI（导航栏、页面内容）全部被遮挡

**根因**：
- `#model-viewer-container` 使用了 `position: fixed; z-index: 9999; width: 100%; height: 100%`
- 覆盖整个页面，Flutter 内容在下面看不到

**正确方案**：
- 使用 `HtmlElementView` + `platformViewRegistry.registerViewFactory`
- 3D 模型作为 Flutter 布局的一部分，不遮挡任何 UI

---

## ❌ 错误 3：dart:js 残留引用导致编译失败（2026-08-29）

**问题**：`flutter build web` 报 `The getter 'js' isn't defined`

**根因**：
- 移除了 `import 'dart:js' as js;`
- 但代码中仍在使用 `js.context.callMethod('eval', ...)`

**教训**：
- 移除 import 前必须全局搜索所有引用
- 用 `dart:html` 的 `ScriptElement` 替代 `dart:js`

---

## ❌ 错误 4：HtmlElementView MessageEvent 类型错误（2026-08-29）

**问题**：`The getter 'data' isn't defined for the class 'Event'`

**根因**：
- `addEventListener` 回调参数类型是 `Event`
- `Event` 没有 `.data` 属性，需要强转为 `MessageEvent`

**教训**：
- `dart:html` 的事件类型必须精确匹配
- `Event` ≠ `MessageEvent` ≠ `KeyboardEvent`
- 监听 message 事件时，参数类型必须是 `MessageEvent`

---

## ❌ 错误 5：没有用浏览器 Agent 验证就声称修复（2026-08-29，多次）

**问题**：每次都说"已修复"、"验证通过"，但用户实际打开还是坏的

**根因**：
- 没有真正用浏览器 Agent 访问页面
- 没有查看控制台错误
- 没有截图确认

**强制规则**：
1. **每次修改后必须用浏览器 Agent 验证**
2. 查看控制台所有 error/warning
3. 截图确认 UI 正确
4. 检查关键 DOM 元素是否存在
5. **不要在未验证的情况下说"修好了"**

---

## ❌ 错误 6：Flutter Service Worker 缓存旧版 index.html（2026-08-29）

**问题**：部署了新的 index.html，但浏览器加载的仍是旧版（引用 model-viewer.min.js）

**根因**：
- Flutter 的 Service Worker 缓存了旧版 index.html
- 清除缓存的代码在新版 index.html 里
- 浏览器根本加载不到新版——死循环

**正确方案**：
- 在 GitHub Actions 构建后，用 `sed` 修改 Service Worker 的 `CACHE_NAME`
- 添加时间戳后缀，每次构建都不同
- 旧缓存自动废弃，浏览器加载新版本

---

## ✅ 强制工作流（从所有错误总结）

### 开发前
1. **读 PROJECT_MEMORY.md**，回顾历史错误
2. 检查第三方库格式（UMD/ESM/CJS）
3. 确认 dart:html 事件类型匹配

### 开发中
1. 本地化所有第三方资源，不依赖 CDN
2. Flutter Web 嵌入 Web 组件用 HtmlElementView，不用 position:fixed
3. 移除 import 前全局搜索引用

### 部署后
1. **等待 3 分钟**让 GitHub Actions 构建完成
2. **用浏览器 Agent 验证**（不是 curl，不是代码审查）
3. 检查控制台所有 error/warning
4. 截图确认 UI 正确
5. 检查关键 DOM 元素是否存在
6. 检查 window.THREE 等全局对象
7. 如果失败，查看错误，修复，重新部署，**再次验证**

### 绝不做的
- ❌ 不在未验证的情况下说"修好了"
- ❌ 不用 GitHub API 轮询构建状态（会限流）
- ❌ 不假设库的格式，先检查源码
