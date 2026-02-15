#!/bin/bash
set -e

echo ""
echo "=========================================="
echo "  rec_sys_guide - Setup"
echo "  Architecture: v4.3 (Long Paths + Gitignore Escaping)"
echo "=========================================="
echo ""

# 1. Check Python
echo "[1/9] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 not found."
    exit 1
fi
echo "  OK: $(python3 --version)"

# 2. Check Dependencies
echo ""
echo "[2/9] Checking Dependencies..."
if ! python3 -c "import huggingface_hub" &> /dev/null; then
    echo "  Installing huggingface_hub..."
    pip3 install -q "huggingface_hub>=0.17.0"
else
    echo "  OK: huggingface_hub is installed"
fi

# 3. HuggingFace Authentication
echo ""
echo "[3/9] HuggingFace Authentication"

if [ -n "$HF_TOKEN" ]; then
    echo "  HF_TOKEN environment variable detected, skipping auth."
elif python3 -c "from huggingface_hub import HfApi; HfApi().whoami()" &>/dev/null; then
    echo "  Already logged in via huggingface-cli, skipping auth."
else
    echo "  No HF authentication detected."
    echo "  a) Run huggingface-cli login now"
    echo "  b) Skip upload (generate manifest only)"
    echo ""
    read -p "  Choose [a/b] (default b): " hf_choice
    case "$hf_choice" in
        a|A) huggingface-cli login ;;
        *) echo "  Skipped authentication." ;;
    esac
fi

# 4. Enable long paths (Windows MAX_PATH 260 fix, harmless on other OS)
echo ""
echo "[4/9] Enabling Git long paths..."
git config core.longpaths true
echo "  OK: core.longpaths enabled"

# 5. Sync Remote (Architecture v4.1: Autostash mode)
echo ""
echo "[5/9] Syncing Remote (git pull --rebase --autostash)..."
git pull --rebase --autostash origin main
if [ $? -ne 0 ]; then
    echo "[ERROR] Sync failed. Resolve conflicts: git rebase --abort"
    exit 1
else
    echo "  OK: Synced successfully"
fi

# 6. Ensure .nojekyll exists
echo ""
echo "[6/9] Checking .nojekyll..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$SCRIPT_DIR/.nojekyll" ]; then
    touch "$SCRIPT_DIR/.nojekyll"
    echo "  Created .nojekyll"
else
    echo "  OK: .nojekyll exists"
fi

# 7. Run Distribution
echo ""
echo "[7/9] Running Distribution Script..."
cd "$SCRIPT_DIR"
python3 scripts/distribute_files.py

# 8. Local Commit
echo ""
echo "[8/9] Preparing Git commit..."
git add .
if ! git diff --cached --quiet; then
    read -p "  Enter message (default: Auto update): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Auto update"
    fi
    git commit -m "$commit_msg"
    echo "  OK: Committed locally"
else
    echo "  OK: No changes to commit"
fi

# 9. Push
echo ""
echo "[9/9] Pushing to GitHub..."
git push origin main

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
