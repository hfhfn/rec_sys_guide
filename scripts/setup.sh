#!/bin/bash
# Dual-Storage Setup Script v3.0 (Linux/macOS)
# 环境检查 + 依赖安装 + 首次分发

set -e

echo ""
echo "============================================"
echo "  GitHub + HuggingFace 自动分发系统 v3.0"
echo "============================================"
echo ""

# --- 1. 检查 Python ---
echo "[1/5] 正在检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] 未找到 Python 3，请先安装"
    exit 1
fi
echo "  OK: $(python3 --version)"

# --- 2. 安装依赖 ---
echo ""
echo "[2/5] 正在检查并安装依赖..."
pip3 install -q "huggingface_hub>=0.17.0"
echo "  OK: huggingface_hub 安装/更新完成"

# --- 3. HuggingFace 认证 ---
echo ""
echo "[3/5] HuggingFace 身份认证"

if [ -n "$HF_TOKEN" ]; then
    echo "  已检测到 HF_TOKEN 环境变量，跳过配置。"
elif python3 -c "from huggingface_hub import HfApi; HfApi().whoami()" &>/dev/null; then
    echo "  已通过 huggingface-cli 登录，跳过配置。"
else
    echo "  未检测到 HF 认证信息。"
    echo "  你可以选择："
    echo "    a) 现在运行 huggingface-cli login 登录"
    echo "    b) 跳过上传 (仅生成本地清单)"
    echo ""
    read -p "  请选择 [a/b] (默认 b): " hf_choice
    case "$hf_choice" in
        a|A) huggingface-cli login ;;
        *) echo "  已跳过认证。" ;;
    esac
fi

# --- 4. 运行分发逻辑 ---
echo ""
echo "[4/5] 正在执行文件分发与同步..."
echo "  说明：此操作将自动上传大文件并清理远程冗余文件。"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
python3 scripts/distribute_files.py
echo "  OK: 分发任务执行完成"

# --- 5. 提交并同步到 GitHub ---
echo ""
echo "[5/5] 正在提交更改到 Git..."
git add .
if ! git diff --cached --quiet; then
    echo ""
    read -p "请输入提交信息 (直接回车默认: Auto: Initial v3.0 setup): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Auto: Initial v3.0 setup"
    fi
    git commit -m "$commit_msg"
    echo ""
    echo "正在推送到 GitHub..."
    git push origin main
    echo "  OK: 全部分发与同步完成！"
else
    echo "  无需提交，配置文件已是最新。"
fi

echo ""
echo "============================================"
echo "  全部完成！您的双端存储系统已就绪。"
echo "============================================"
echo ""
