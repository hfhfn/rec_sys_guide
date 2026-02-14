# GitHub + HuggingFace Dual-Storage Templates

This file contains the template code required for the `github-hf-dual-storage` skill. The Agent should read this file and extract the relevant code blocks to create the necessary files in the user's project.

## 1. Distribution Script (`scripts/distribute_files.py`)

**Usage:**

- Replace `${HF_USERNAME}` and `${HF_REPO_NAME}` with actual values.
- Save to `scripts/distribute_files.py`.

```python
#!/usr/bin/env python3
"""
Dual-Storage Distribution Script v3.0
- Scans project for large files (>50MB).
- Uploads large files to HuggingFace (${HF_USERNAME}/${HF_REPO_NAME}).
- Sync Deletion: Cleans up redundant files on HF that are deleted locally.
- Enhances manifest with metadata (extension, last modified).
- Syncs .gitignore and removes large files from Git index.
"""
import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# --- Configuration ---
SIZE_THRESHOLD = 50 * 1024 * 1024  # 50MB
HF_REPO_ID = "${HF_USERNAME}/${HF_REPO_NAME}"  # Agent: Replace this!
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Exclude directories
EXCLUDE_DIRS = {'.git', '.idea', '.vscode', 'venv', 'node_modules', '__pycache__', '.serena', '.github'}

def get_file_size(path):
    return path.stat().st_size

def run_git_cmd(args):
    try:
        subprocess.run(['git'] + args, cwd=PROJECT_ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def scan_files():
    large_files = []
    small_files = []
    print(f"🔍 Scanning files (Threshold: {SIZE_THRESHOLD/1024/1024:.0f}MB)...")

    for path in PROJECT_ROOT.rglob('*'):
        if not path.is_file(): continue
        parts = path.relative_to(PROJECT_ROOT).parts
        if any(p.startswith('.') and p not in ['.gitignore', '.gitattributes'] for p in parts): continue
        if any(ex in parts for ex in EXCLUDE_DIRS): continue

        try:
            size = get_file_size(path)
            if size >= SIZE_THRESHOLD:
                large_files.append(path)
            else:
                small_files.append(path)
        except OSError: pass

    return large_files, small_files

def upload_to_hf(files):
    if not files: return
    print(f"\n🚀 Uploading {len(files)} large files to HuggingFace ({HF_REPO_ID})...")
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        user = api.whoami()
        print(f"   Logged in as: {user['name']}")

        for file_path in files:
            rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
            print(f"   📤 Uploading: {rel_path} ({get_file_size(file_path)/1024/1024:.1f} MB)")
            api.upload_file(
                path_or_fileobj=str(file_path),
                path_in_repo=rel_path,
                repo_id=HF_REPO_ID,
                repo_type="dataset",
                commit_message=f"Upload large file: {os.path.basename(rel_path)}"
            )
        print("✅ Upload complete")
        return True
    except ImportError:
        print("❌ Error: huggingface_hub not installed. Run: pip install huggingface_hub")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        return False

def sync_hf_deletions(local_large_files):
    """Sync deletion: If a file exists on HF but is deleted locally, remove from HF"""
    print(f"\n🧹 Checking for redundant files on HuggingFace ({HF_REPO_ID})...")
    try:
        from huggingface_hub import HfApi, list_repo_files
        api = HfApi()
        remote_files = list_repo_files(repo_id=HF_REPO_ID, repo_type="dataset")
        local_rel_paths = {f.relative_to(PROJECT_ROOT).as_posix() for f in local_large_files}

        to_delete = []
        for rf in remote_files:
            if rf in local_rel_paths: continue
            if rf.endswith(('.gitattributes', 'README.md', '.gitignore')): continue
            to_delete.append(rf)

        if to_delete:
            print(f"   Found {len(to_delete)} redundant files, deleting from HF...")
            for rf in to_delete:
                print(f"   🗑️  Deleting: {rf}")
                api.delete_file(
                    path_in_repo=rf,
                    repo_id=HF_REPO_ID,
                    repo_type="dataset",
                    commit_message=f"Sync delete: {os.path.basename(rf)}"
                )
            print(f"✅ Sync deletion complete (Removed {len(to_delete)} files)")
        else:
            print("   ✨ Remote repo is up to date, no redundant files found.")
    except Exception as e:
        print(f"⚠️ Sync deletion failed: {str(e)}")

def update_gitignore_and_git(large_files):
    if not large_files: return
    print("\n🛡️  Processing Git tracking & .gitignore...")
    gitignore_path = PROJECT_ROOT / '.gitignore'

    existing_content = []
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            existing_content = f.readlines()

    header = "# [Auto] Large files managed by HuggingFace\n"
    new_content = []
    in_auto_section = False
    for line in existing_content:
        if line == header:
            in_auto_section = True
            continue
        if in_auto_section and line.strip() == "":
            in_auto_section = False
            continue
        if not in_auto_section:
            new_content.append(line)

    new_rules = []
    for file_path in large_files:
        rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        new_rules.append(rel_path)
        run_git_cmd(['rm', '--cached', str(file_path)])

    with open(gitignore_path, 'w', encoding='utf-8') as f:
        f.writelines(new_content)
        if new_rules:
            if new_content and not new_content[-1].endswith('\n'): f.write('\n')
            f.write("\n" + header)
            for rule in sorted(new_rules):
                f.write(f"{rule}\n")
    print(f"   📝 Updated .gitignore with {len(new_rules)} rules")

def generate_manifest(large_files):
    print("\n📋 Generating enhanced manifest (data/file_manifest.json)...")
    manifest = {
        "hf_repo_id": HF_REPO_ID,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "files": []
    }

    for file_path in large_files:
        rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        size_mb = get_file_size(file_path) / (1024 * 1024)
        hf_url = f"https://huggingface.co/datasets/{HF_REPO_ID}/resolve/main/{rel_path}"

        manifest["files"].append({
            "name": file_path.name,
            "path": rel_path,
            "extension": file_path.suffix.lower().lstrip('.'),
            "size_mb": round(size_mb, 2),
            "url": hf_url,
            "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        })

    manifest_dir = PROJECT_ROOT / 'data'
    manifest_dir.mkdir(exist_ok=True)
    with open(manifest_dir / 'file_manifest.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("✅ Manifest generated")

def main():
    large, small = scan_files()
    print(f"   -> Found {len(large)} large files, {len(small)} small files")

    if large:
        upload_to_hf(large)
        sync_hf_deletions(large)
        update_gitignore_and_git(large)
        generate_manifest(large)
    else:
        print("🎉 No files > 50MB found.")
        sync_hf_deletions([])
        generate_manifest([])

    print("\n✅ All steps complete! Ready for git push.")

if __name__ == "__main__":
    main()
```

## 2. Windows Setup Script (`scripts/setup.bat`)

**Usage:**

- Save to `scripts/setup.bat` (Windows).

```batch
@echo off
REM Dual-Storage Setup Script v3.0 (Windows)
REM Environment check + dependency installation + first distribution
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ============================================
echo   GitHub + HuggingFace 自动分发系统 v3.0
echo ============================================
echo.

REM --- 1. Python 检查 ---
echo [1/5] 正在检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM --- 2. 安装依赖 ---
echo.
echo [2/5] 正在安装 huggingface_hub...
pip install -q "huggingface_hub>=0.17.0"
echo   OK: 依赖安装完成

REM --- 3. HuggingFace 认证 ---
echo.
echo [3/5] HuggingFace 身份认证
if defined HF_TOKEN (
    echo   检测到 HF_TOKEN 环境变量，跳转。
    goto :skip_hf_auth
)
python -c "from huggingface_hub import HfApi; HfApi().whoami()" >nul 2>&1
if not errorlevel 1 (
    echo   已通过 huggingface-cli 登录。
    goto :skip_hf_auth
)

echo   未检测到 HF 认证信息。
echo   a) 立即运行 huggingface-cli login 登录
echo   b) 跳过上传（仅生成本地清单）
set /p hf_choice="  请选择 [a/b] (默认 b): "
if /i "%hf_choice%"=="a" (
    huggingface-cli login
) else (
    echo   已跳过认证。
)

:skip_hf_auth

REM --- 4. 运行分发逻辑 ---
echo.
echo [4/5] 正在执行文件分发与同步...
echo   说明：此操作将上传大文件到 HF，并清理远程冗余文件。
cd /d "%~dp0.."
python scripts\distribute_files.py

REM --- 5. 提交并同步到 GitHub ---
echo.
echo [5/5] 正在提交配置到 Git...
git add .
git diff --cached --quiet
if errorlevel 1 (
    echo.
    set /p commit_msg="输入提交信息 (直接回车默认: Initial dual-storage setup): "
    if "!commit_msg!"=="" set commit_msg=Initial dual-storage setup
    git commit -m "!commit_msg!"
    echo.
    echo 正在推送到 GitHub...
    git push origin main
    if errorlevel 1 (
        echo [ERROR] 推送至 GitHub 失败，请检查网络或权限。
    ) else (
        echo   OK: 全部分发与同步完成！
    )
) else (
    echo   无需提交，配置文件已是最新。
)

echo.
echo ============================================
echo   设置完成！您的双端存储系统已就绪。
echo ============================================
echo.
pause
```

## 3. Linux/Mac Setup Script (`scripts/setup.sh`)

**Usage:**

- Save to `scripts/setup.sh`.
- Run `chmod +x scripts/setup.sh`.

```bash
#!/bin/bash
# Dual-Storage Setup Script v3.0 (Linux/macOS)
# Environment check + dependency installation + first distribution

set -e

echo ""
echo "============================================"
echo "  GitHub + HuggingFace 自动分发系统 v3.0"
echo "============================================"
echo ""

# --- 1. Python 检查 ---
echo "[1/5] 正在检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] 未找到 python3，请先安装。"
    exit 1
fi

# --- 2. 安装依赖 ---
echo ""
echo "[2/5] 正在安装 huggingface_hub..."
pip3 install -q "huggingface_hub>=0.17.0"
echo "  OK: 依赖安装完成"

# --- 3. HuggingFace 认证 ---
echo ""
echo "[3/5] HuggingFace 身份认证"
if [ -z "$HF_TOKEN" ] && ! python3 -c "from huggingface_hub import HfApi; HfApi().whoami()" &> /dev/null; then
    echo "  未检测到 HF 认证信息。"
    read -p "  立即运行 huggingface-cli login 登录? (y/n) [n]: " login_choice
    if [[ "$login_choice" == "y" || "$login_choice" == "Y" ]]; then
        huggingface-cli login
    else
        echo "  已跳过认证。"
    fi
else
    echo "  已登录。"
fi

# --- 4. 运行分发逻辑 ---
echo ""
echo "[4/5] 正在执行文件分发与同步..."
echo "  说明：此操作将上传大文件到 HF，并清理远程冗余文件。"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."
python3 scripts/distribute_files.py

# --- 5. 提交并同步到 GitHub ---
echo ""
echo "[5/5] 正在提交配置到 Git..."
git add .
if ! git diff --cached --quiet; then
    echo ""
    read -p "输入提交信息 (直接回车默认: Initial dual-storage setup): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Initial dual-storage setup"
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
echo "  设置完成！您的双端存储系统已就绪。"
echo "============================================"
echo ""
```

## 4. Web Interface (`index.html`)

**Usage:**

- Replace `${GITHUB_USERNAME}` and `${GITHUB_REPO_NAME}`.
- Save to `index.html`.

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${GITHUB_REPO_NAME} - 资源导航</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- 引入现代字体 -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --primary: #4f46e5;
        --primary-hover: #4338ca;
        --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        --card-bg: rgba(255, 255, 255, 0.8);
        --text-main: #1e293b;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --hf-bg: #fef3c7;
        --hf-text: #92400e;
        --hf-border: #fcd34d;
        --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
      }

      [data-theme="dark"] {
        --primary: #818cf8;
        --primary-hover: #6366f1;
        --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        --card-bg: rgba(30, 41, 59, 0.7);
        --text-main: #f1f5f9;
        --text-muted: #94a3b8;
        --border: #334155;
        --hf-bg: rgba(251, 191, 36, 0.15);
        --hf-text: #fbbf24;
        --hf-border: rgba(251, 191, 36, 0.3);
      }

      * {
        box-sizing: border-box;
        transition: all 0.2s ease;
      }
      body {
        font-family:
          "Inter",
          system-ui,
          -apple-system,
          sans-serif;
        margin: 0;
        min-height: 100vh;
        background: var(--bg-gradient);
        color: var(--text-main);
        line-height: 1.5;
      }

      .container {
        max-width: 1100px;
        margin: 40px auto;
        padding: 0 20px;
      }

      .glass-card {
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--glass-shadow);
        padding: 40px;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }

      h1 {
        font-family: "Outfit", sans-serif;
        margin: 0;
        font-size: 2.5rem;
        background: linear-gradient(135deg, var(--primary) 0%, #a855f7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      /* 主题切换按钮 */
      .theme-toggle {
        background: var(--card-bg);
        border: 1px solid var(--border);
        padding: 10px;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 搜索与过滤 */
      .search-section {
        margin-bottom: 30px;
      }
      .search-box {
        position: relative;
        display: flex;
        gap: 12px;
      }
      #searchInput {
        flex: 1;
        padding: 16px 24px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: var(--card-bg);
        color: var(--text-main);
        font-size: 1.1rem;
        outline: none;
      }
      #searchInput:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
      }

      .filter-tags {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      .tag {
        padding: 6px 16px;
        border-radius: 99px;
        background: var(--card-bg);
        border: 1px solid var(--border);
        font-size: 0.9rem;
        cursor: pointer;
        color: var(--text-muted);
      }
      .tag.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      /* 文件树样式 */
      .file-tree {
        min-height: 400px;
      }
      .folder {
        margin: 8px 0;
      }
      .folder-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        color: var(--primary);
      }
      .folder-header:hover {
        background: rgba(79, 70, 229, 0.08);
      }
      .folder-icon {
        font-size: 1.2rem;
      }
      .toggle-icon {
        width: 20px;
        text-align: center;
        font-size: 0.8rem;
        opacity: 0.7;
      }

      .folder-children {
        margin-left: 28px;
        border-left: 1px solid var(--border);
        padding-left: 12px;
        overflow: hidden;
      }
      .folder-children.collapsed {
        display: none;
      }

      .file-item {
        display: flex;
        align-items: center;
        padding: 8px 14px;
        border-radius: 10px;
        margin: 4px 0;
      }
      .file-item:hover {
        background: rgba(79, 70, 229, 0.05);
        transform: translateX(4px);
      }
      .file-item a {
        text-decoration: none;
        color: var(--text-main);
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      .file-icon {
        font-size: 1.2rem;
      }

      .hf-badge {
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--hf-bg);
        color: var(--hf-text);
        border: 1px solid var(--hf-border);
        font-weight: 600;
        margin-left: auto;
      }

      .footer-stats {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
        display: flex;
        gap: 24px;
        color: var(--text-muted);
        font-size: 0.9rem;
      }

      @media (max-width: 640px) {
        .container {
          margin: 20px auto;
        }
        .glass-card {
          padding: 24px;
        }
        h1 {
          font-size: 1.8rem;
        }
        .search-box {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body data-theme="light">
    <div class="container">
      <div class="glass-card">
        <header>
          <h1>${GITHUB_REPO_NAME}</h1>
          <button class="theme-toggle" id="themeToggle" title="切换主题">
            <span id="themeIcon">🌓</span>
          </button>
        </header>

        <section class="search-section">
          <div class="search-box">
            <input
              type="text"
              id="searchInput"
              placeholder="搜索文件或目录..."
              autocomplete="off"
            />
          </div>
          <div class="filter-tags" id="filterTags">
            <button class="tag active" data-filter="all">全部</button>
            <button class="tag" data-filter="pdf">PDF 文档</button>
            <button class="tag" data-filter="code">代码源码</button>
            <button class="tag" data-filter="archive">压缩包</button>
          </div>
        </section>

        <div id="file-list" class="file-tree">
          <div style="text-align: center; padding: 40px; opacity: 0.6;">
            📂 正在初始化资源树...
          </div>
        </div>

        <div class="footer-stats" id="stats"></div>
      </div>
    </div>

    <script>
      const username = "${GITHUB_USERNAME}";
      const repo = "${GITHUB_REPO_NAME}";
      const branch = "main";

      let allFiles = [];
      let currentFilter = "all";
      let currentSearch = "";

      // --- 图标映射 ---
      function getFileIcon(name) {
        const ext = name.split(".").pop().toLowerCase();
        if (["pdf"].includes(ext)) return "📕";
        if (["zip", "rar", "7z", "gz"].includes(ext)) return "📦";
        if (
          [
            "py",
            "js",
            "html",
            "css",
            "go",
            "java",
            "cpp",
            "c",
            "sh",
            "bat",
          ].includes(ext)
        )
          return "💻";
        if (["jpg", "png", "gif", "svg", "webp"].includes(ext)) return "🖼️";
        if (["mp4", "mkv", "avi"].includes(ext)) return "🎬";
        if (["md", "txt"].includes(ext)) return "📝";
        return "📄";
      }

      // --- 主题切换 ---
      function initTheme() {
        const saved =
          localStorage.getItem("theme") ||
          (window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light");
        document.body.setAttribute("data-theme", saved);
        document.getElementById("themeToggle").addEventListener("click", () => {
          const current = document.body.getAttribute("data-theme");
          const next = current === "light" ? "dark" : "light";
          document.body.setAttribute("data-theme", next);
          localStorage.setItem("theme", next);
        });
      }

      // --- 数据加载 ---
      async function loadData() {
        try {
          // GitHub Tree API
          const ghUrl = `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`;
          const ghRes = await fetch(ghUrl);
          const ghData =
            ghRes.status === 200 ? await ghRes.json() : { tree: [] };

          let files = ghData.tree
            .filter(
              (i) =>
                i.type === "blob" &&
                !i.path.startsWith(".") &&
                !["index.html", "README.md"].includes(i.path) &&
                !i.path.match(/^(scripts|data|venv|node_modules)\//),
            )
            .map((i) => ({
              name: i.path.split("/").pop(),
              path: i.path,
              isHF: false,
            }));

          // HF Manifest
          try {
            const maniRes = await fetch(
              `./data/file_manifest.json?t=${Date.now()}`,
            );
            if (maniRes.ok) {
              const mani = await maniRes.json();
              if (mani.files) {
                mani.files.forEach((f) => {
                  files.push({ ...f, isHF: true });
                });
              }
            }
          } catch (e) {
            console.warn("Manifest load failed", e);
          }

          allFiles = files;
          render();
          renderStats();
        } catch (e) {
          document.getElementById("file-list").innerHTML =
            `<div style="color:red; text-align:center;">❌ 加载失败: ${e.message}</div>`;
        }
      }

      // --- 过滤逻辑 ---
      function isMatch(file) {
        const matchSearch =
          file.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
          file.path.toLowerCase().includes(currentSearch.toLowerCase());

        let matchFilter = true;
        const ext = file.name.split(".").pop().toLowerCase();
        if (currentFilter === "pdf") matchFilter = ext === "pdf";
        else if (currentFilter === "code")
          matchFilter = [
            "py",
            "js",
            "html",
            "css",
            "sh",
            "bat",
            "java",
            "cpp",
          ].includes(ext);
        else if (currentFilter === "archive")
          matchFilter = ["zip", "rar", "7z", "gz"].includes(ext);

        return matchSearch && matchFilter;
      }

      // --- 渲染引擎 ---
      function render() {
        const filtered = allFiles.filter(isMatch);
        const tree = buildTree(filtered);
        document.getElementById("file-list").innerHTML = filtered.length
          ? renderNode(tree)
          : '<div style="text-align:center; padding:40px; opacity:0.5;">🔍 未找到相关资源</div>';
      }

      function buildTree(files) {
        const root = { _files: [], _folders: {} };
        files.forEach((f) => {
          const parts = f.path.split("/");
          const fileName = parts.pop();
          let current = root;
          parts.forEach((p) => {
            if (!current._folders[p])
              current._folders[p] = { _files: [], _folders: {} };
            current = current._folders[p];
          });
          current._files.push(f);
        });
        return root;
      }

      function renderNode(node, level = 0) {
        let html = "";

        // 渲染文件夹
        Object.entries(node._folders)
          .sort()
          .forEach(([name, sub]) => {
            html += `
            <div class="folder">
              <div class="folder-header" onclick="this.nextElementSibling.classList.toggle('collapsed'); this.querySelector('.toggle-icon').innerText = this.nextElementSibling.classList.contains('collapsed') ? '▶' : '▼'">
                <span class="toggle-icon">${currentSearch ? "▼" : "▶"}</span>
                <span class="folder-icon">📁</span>
                <span>${name}</span>
              </div>
              <div class="folder-children ${currentSearch ? "" : "collapsed"}">
                ${renderNode(sub, level + 1)}
              </div>
            </div>`;
          });

        // 渲染文件
        node._files
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((f) => {
            const url = f.isHF
              ? f.url
              : `https://github.com/${username}/${repo}/blob/${branch}/${f.path}`;
            html += `
            <div class="file-item">
              <a href="${url}" target="_blank">
                <span class="file-icon">${getFileIcon(f.name)}</span>
                <span>${f.name}</span>
                ${f.isHF ? `<span class="hf-badge">${f.size_mb} MB</span>` : ""}
              </a>
            </div>`;
          });

        return html;
      }

      function renderStats() {
        const hf = allFiles.filter((i) => i.isHF);
        const totalSize = hf
          .reduce((acc, cr) => acc + (cr.size_mb || 0), 0)
          .toFixed(1);
        document.getElementById("stats").innerHTML = `
          <span>📦 总计 ${allFiles.length} 项</span>
          <span>🤗 HF 大文件 ${hf.length} 项 (${totalSize} MB)</span>
        `;
      }

      // --- 事件监听 ---
      initTheme();
      loadData();

      document.getElementById("searchInput").addEventListener("input", (e) => {
        currentSearch = e.target.value;
        render();
      });

      document.getElementById("filterTags").addEventListener("click", (e) => {
        if (e.target.classList.contains("tag")) {
          document
            .querySelectorAll(".tag")
            .forEach((t) => t.classList.remove("active"));
          e.target.classList.add("active");
          currentFilter = e.target.dataset.filter;
          render();
        }
      });
    </script>
  </body>
</html>
```
