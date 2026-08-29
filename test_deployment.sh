#!/bin/bash

# 自动化测试和部署验证脚本
# 用于验证 AI English Teacher 应用的完整功能

set -e

echo "🚀 开始自动化测试和部署验证..."

# 1. 检查 GitHub Actions 构建状态
echo ""
echo "📋 步骤 1: 检查 GitHub Actions 构建状态..."
cd /workspace

# 获取最新的 commit hash
LATEST_COMMIT=$(git rev-parse HEAD)
echo "最新提交: $LATEST_COMMIT"

# 等待 GitHub Actions 构建完成（最多等待 5 分钟）
echo "等待 GitHub Actions 构建完成..."
MAX_WAIT=300
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    # 检查最新的 workflow run 状态
    RUN_STATUS=$(curl -s "https://api.github.com/repos/MrWangHello/AI-techer/actions/runs?per_page=1" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    RUN_CONCLUSION=$(curl -s "https://api.github.com/repos/MrWangHello/AI-techer/actions/runs?per_page=1" | grep -o '"conclusion":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ "$RUN_STATUS" = "completed" ]; then
        if [ "$RUN_CONCLUSION" = "success" ]; then
            echo "✅ GitHub Actions 构建成功"
            break
        else
            echo "❌ GitHub Actions 构建失败: $RUN_CONCLUSION"
            exit 1
        fi
    fi
    
    echo "构建中... (已等待 ${WAITED}s)"
    sleep 10
    WAITED=$((WAITED + 10))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⏰ 等待超时，请手动检查 GitHub Actions 状态"
    exit 1
fi

# 2. 等待 GitHub Pages 部署完成
echo ""
echo "🌐 步骤 2: 等待 GitHub Pages 部署完成..."
sleep 30  # 给 GitHub Pages 一些时间部署

# 3. 验证部署的页面
echo ""
echo "🔍 步骤 3: 验证部署的页面..."
DEPLOY_URL="https://mrwanghello.github.io/AI-techer/"

# 检查页面是否可访问
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 页面可访问 (HTTP $HTTP_STATUS)"
else
    echo "❌ 页面不可访问 (HTTP $HTTP_STATUS)"
    exit 1
fi

# 4. 检查关键资源
echo ""
echo "📦 步骤 4: 检查关键资源..."

# 检查 model-viewer.min.js
MV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}model-viewer.min.js")
if [ "$MV_STATUS" = "200" ]; then
    echo "✅ model-viewer.min.js 可访问"
else
    echo "❌ model-viewer.min.js 不可访问 (HTTP $MV_STATUS)"
    exit 1
fi

# 检查 3D 模型文件
GLB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}assets/models/RobotExpressive.glb")
if [ "$GLB_STATUS" = "200" ]; then
    echo "✅ RobotExpressive.glb 可访问"
else
    echo "❌ RobotExpressive.glb 不可访问 (HTTP $GLB_STATUS)"
    exit 1
fi

# 5. 检查 HTML 内容
echo ""
echo "📄 步骤 5: 检查 HTML 内容..."

# 下载并检查 index.html
INDEX_HTML=$(curl -s "$DEPLOY_URL")

# 检查是否包含 WebGL 检测代码
if echo "$INDEX_HTML" | grep -q "checkWebGLSupport"; then
    echo "✅ WebGL 检测代码存在"
else
    echo "❌ WebGL 检测代码缺失"
    exit 1
fi

# 检查是否包含 model-viewer 容器
if echo "$INDEX_HTML" | grep -q "model-viewer-container"; then
    echo "✅ model-viewer 容器存在"
else
    echo "❌ model-viewer 容器缺失"
    exit 1
fi

# 检查是否使用 type="module" 加载 model-viewer
if echo "$INDEX_HTML" | grep -q 'type="module"'; then
    echo "✅ model-viewer 使用 ES Module 加载"
else
    echo "❌ model-viewer 未使用 ES Module 加载"
    exit 1
fi

# 6. 检查 Flutter 应用
echo ""
echo "🎯 步骤 6: 检查 Flutter 应用..."

# 检查 main.dart.js
MAIN_JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}main.dart.js")
if [ "$MAIN_JS_STATUS" = "200" ]; then
    echo "✅ main.dart.js 可访问"
else
    echo "❌ main.dart.js 不可访问 (HTTP $MAIN_JS_STATUS)"
    exit 1
fi

# 7. 总结
echo ""
echo "========================================="
echo "✅ 所有自动化测试通过！"
echo "========================================="
echo ""
echo "📊 测试结果摘要:"
echo "  - GitHub Actions 构建: ✅ 成功"
echo "  - GitHub Pages 部署: ✅ 成功"
echo "  - 关键资源加载: ✅ 正常"
echo "  - WebGL 检测: ✅ 已实现"
echo "  - model-viewer: ✅ ES Module 加载"
echo "  - Flutter 应用: ✅ 正常"
echo ""
echo "🌐 访问地址: $DEPLOY_URL"
echo ""
echo "💡 下一步:"
echo "  1. 在支持 WebGL 的浏览器中访问页面"
echo "  2. 测试 3D 模型加载和交互功能"
echo "  3. 测试语音朗读功能"
echo "  4. 测试宠物互动功能"
echo ""
