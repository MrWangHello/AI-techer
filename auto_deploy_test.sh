#!/bin/bash

# 自动化部署和测试脚本
# 流程：等待构建 → 验证部署 → 自动测试 → 输出报告

set -e

echo "=========================================="
echo "🚀 自动化部署和测试流程"
echo "=========================================="

# 1. 等待 GitHub Actions 构建完成
echo ""
echo "📦 步骤1: 等待 GitHub Actions 构建..."
echo "----------------------------------------"

MAX_WAIT=300
WAITED=0
CHECK_INTERVAL=15

while [ $WAITED -lt $MAX_WAIT ]; do
    # 获取最新的 workflow run
    RUN_INFO=$(curl -s "https://api.github.com/repos/MrWangHello/AI-techer/actions/runs?per_page=1" 2>/dev/null || echo "")
    
    if [ -z "$RUN_INFO" ]; then
        echo "⚠️  API 请求失败，等待后重试..."
        sleep $CHECK_INTERVAL
        WAITED=$((WAITED + CHECK_INTERVAL))
        continue
    fi
    
    # 提取状态和结论
    STATUS=$(echo "$RUN_INFO" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0]['status'] if data.get('workflow_runs') else 'unknown')" 2>/dev/null || echo "unknown")
    CONCLUSION=$(echo "$RUN_INFO" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0].get('conclusion', 'null') if data.get('workflow_runs') else 'null')" 2>/dev/null || echo "null")
    
    echo "  状态: $STATUS | 结论: $CONCLUSION | 已等待: ${WAITED}s"
    
    if [ "$STATUS" = "completed" ]; then
        if [ "$CONCLUSION" = "success" ]; then
            echo "✅ GitHub Actions 构建成功！"
            break
        else
            echo "❌ GitHub Actions 构建失败: $CONCLUSION"
            exit 1
        fi
    fi
    
    sleep $CHECK_INTERVAL
    WAITED=$((WAITED + CHECK_INTERVAL))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⏰ 等待超时（${MAX_WAIT}秒），请手动检查构建状态"
    exit 1
fi

# 2. 等待部署生效
echo ""
echo "🌐 步骤2: 等待部署生效..."
echo "----------------------------------------"
DEPLOY_WAIT=30
echo "  等待 ${DEPLOY_WAIT} 秒让部署生效..."
sleep $DEPLOY_WAIT

# 3. 验证关键资源
echo ""
echo "🔍 步骤3: 验证关键资源..."
echo "----------------------------------------"

BASE_URL="https://mrwanghello.github.io/AI-techer"

check_resource() {
    local url=$1
    local name=$2
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "200" ]; then
        echo "✅ $name (HTTP $status)"
        return 0
    else
        echo "❌ $name (HTTP $status)"
        return 1
    fi
}

RESOURCES_OK=true

check_resource "$BASE_URL/" "主页" || RESOURCES_OK=false
check_resource "$BASE_URL/model-viewer.min.js" "model-viewer.min.js" || RESOURCES_OK=false
check_resource "$BASE_URL/assets/models/RobotExpressive.glb" "3D模型文件" || RESOURCES_OK=false
check_resource "$BASE_URL/main.dart.js" "Flutter应用" || RESOURCES_OK=false

if [ "$RESOURCES_OK" = false ]; then
    echo ""
    echo "⚠️  部分资源加载失败，请检查部署"
    exit 1
fi

# 4. 输出测试报告
echo ""
echo "=========================================="
echo "✅ 自动化部署和测试完成！"
echo "=========================================="
echo ""
echo "📊 部署信息:"
echo "  - 部署URL: $BASE_URL"
echo "  - 构建状态: 成功"
echo "  - 资源验证: 全部通过"
echo ""
echo "🎯 下一步:"
echo "  1. 在360浏览器中访问上述URL"
echo "  2. 检查3D模型是否正常加载"
echo "  3. 测试底部导航栏是否可点击"
echo "  4. 测试语音朗读功能"
echo ""
echo "📝 如果仍有问题，请告诉我具体现象"
echo "=========================================="
