#!/bin/bash
# 快速启动脚本：环境检查 + 依赖安装 + 首次分发

set -e

echo ""
echo "============================================"
echo "  推荐系统项目 - 自动文件分发系统"
echo "============================================"
echo ""

# --- 1. 检查 Python ---
echo "[1/5] 检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] 未找到 Python 3，请先安装"
    exit 1
fi
echo "  OK: $(python3 --version)"

# --- 2. 安装依赖 ---
echo ""
echo "[2/5] 安装 huggingface_hub..."
pip install -q huggingface_hub
echo "  OK: huggingface_hub 已安装"

# --- 3. HuggingFace 认证（可选） ---
echo ""
echo "[3/5] HuggingFace 认证"

if [ -n "$HF_TOKEN" ]; then
    echo "  已检测到 HF_TOKEN 环境变量，跳过配置。"
elif python3 -c "from huggingface_hub import HfApi; HfApi().whoami()" &>/dev/null; then
    echo "  已通过 huggingface-cli 登录，跳过配置。"
else
    echo "  未检测到 HF 认证信息。"
    echo "  你可以选择："
    echo "    a) 现在运行 huggingface-cli login 登录"
    echo "    b) 稍后手动设置环境变量 HF_TOKEN"
    echo "    c) 跳过（仅生成清单，不上传到 HF）"
    echo ""
    read -p "  请选择 [a/b/c] (默认 c): " hf_choice
    case "$hf_choice" in
        a|A) huggingface-cli login ;;
        b|B)
            echo ""
            echo "  请稍后执行: export HF_TOKEN=your_token_here"
            echo "  Token 获取: https://huggingface.co/settings/tokens"
            ;;
        *) echo "  已跳过，后续可随时配置。" ;;
    esac
fi

# --- 4. 测试运行分发脚本 ---
echo ""
echo "[4/5] 运行分发脚本..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
python3 scripts/distribute_files.py
echo "  OK: 分发脚本执行完成"

# --- 5. 提交到 Git ---
echo ""
echo "[5/5] 提交配置到 Git..."
git add .
if ! git diff --cached --quiet; then
    git commit -m "Auto: Initial setup and file distribution"
    echo "  OK: 已提交所有更改"
else
    echo "  无需提交，没有变更。"
fi

echo ""
echo "============================================"
echo "  配置完成！"
echo "============================================"
echo ""
echo "  下一步:"
echo "  1. 在 GitHub 仓库 Settings 中添加 Secrets:"
echo "     - HF_TOKEN:    你的 HuggingFace Token"
echo "     - HF_USERNAME: hfhfn"
echo "     访问: https://github.com/hfhfn/rec_sys_guide/settings/secrets/actions"
echo ""
echo "  2. 启用 GitHub Pages:"
echo "     Settings → Pages → 选择 main 分支"
echo "     访问: https://hfhfn.github.io/rec_sys_guide"
echo ""
echo "  3. 推送到远程:"
echo "     git push origin main"
