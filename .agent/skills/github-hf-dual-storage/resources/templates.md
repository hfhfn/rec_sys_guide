# GitHub + HuggingFace Dual-Storage Templates

This file contains the template code required for the `github-hf-dual-storage` skill. The Agent should read this file and extract the relevant code blocks to create the necessary files in the user's project.

## 1. Distribution Script (`scripts/distribute_files.py`)

**Usage:**

- Replace `${HF_USERNAME}` and `${HF_REPO_NAME}` with actual values.
- Save to `scripts/distribute_files.py`.

```python
#!/usr/bin/env python3
"""
Dual-Storage Distribution Script v2.1
- Scans project for large files (>50MB).
- Uploads large files to HuggingFace (${HF_USERNAME}/${HF_REPO_NAME}).
- Removes large files from Git index (git rm --cached) and adds to .gitignore.
- Generates data/file_manifest.json for the web interface.
"""
import os
import sys
import json
import subprocess
from pathlib import Path

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
    print(f"\\n🚀 Uploading {len(files)} large files to HuggingFace ({HF_REPO_ID})...")
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

def update_gitignore_and_git(large_files):
    if not large_files: return
    print("\\n🛡️  Processing Git tracking & .gitignore...")
    gitignore_path = PROJECT_ROOT / '.gitignore'
    existing_rules = set()
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            existing_rules = {line.strip() for line in f if line.strip() and not line.startswith('#')}

    new_rules = []
    for file_path in large_files:
        rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        if rel_path not in existing_rules:
            new_rules.append(rel_path)
        print(f"   🚫 Git stop tracking: {rel_path}")
        run_git_cmd(['rm', '--cached', str(file_path)])

    if new_rules:
        with open(gitignore_path, 'a', encoding='utf-8') as f:
            f.write("\\n# [Auto] Large files managed by HuggingFace\\n")
            for rule in new_rules:
                f.write(f"{rule}\\n")
        print(f"   📝 Added {len(new_rules)} rules to .gitignore")

def generate_manifest(large_files):
    print("\\n📋 Generating file manifest (data/file_manifest.json)...")
    manifest = {"hf_repo_id": HF_REPO_ID, "files": []}

    for file_path in large_files:
        rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        size_mb = get_file_size(file_path) / (1024 * 1024)
        hf_url = f"https://huggingface.co/datasets/{HF_REPO_ID}/resolve/main/{rel_path}"
        manifest["files"].append({
            "name": file_path.name,
            "path": rel_path,
            "size_mb": round(size_mb, 2),
            "url": hf_url
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
        update_gitignore_and_git(large)
        generate_manifest(large)
    else:
        print("🎉 No files > 50MB found.")

    print("\\n✅ All steps complete! Ready for git push.")

if __name__ == "__main__":
    main()
```

## 2. Windows Setup Script (`scripts/setup.bat`)

**Usage:**

- Save to `scripts/setup.bat` (Windows).

```batch
@echo off
REM Setup Script: Checks env + installs deps + first run (Windows)
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ============================================
echo   Auto-Distribution Setup
echo ============================================
echo.

REM --- 1. Python Check ---
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    pause
    exit /b 1
)

REM --- 2. Dependencies ---
echo.
echo [2/5] Installing huggingface_hub...
pip install -q huggingface_hub

REM --- 3. HF Auth ---
echo.
echo [3/5] HuggingFace Authentication
if defined HF_TOKEN goto :skip_hf_auth
python -c "from huggingface_hub import HfApi; HfApi().whoami()" >nul 2>&1
if not errorlevel 1 goto :skip_hf_auth

echo   HF Auth not found.
echo   a) Login now
echo   b) Skip (No upload)
set /p hf_choice="  Select [a/b]: "
if /i "%hf_choice%"=="a" (
    huggingface-cli login
) else (
    echo   Skipping auth.
)

:skip_hf_auth

REM --- 4. Run Script ---
echo.
echo [4/5] Running distribution...
cd /d "%~dp0.."
python scripts\distribute_files.py

REM --- 5. Initial Commit ---
echo.
echo [5/5] Committing to Git...
git add .
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Auto: Initial setup"
    git push origin main
) else (
    echo   No changes to commit.
)

pause
```

## 3. Linux/Mac Setup Script (`scripts/setup.sh`)

**Usage:**

- Save to `scripts/setup.sh`.
- Run `chmod +x scripts/setup.sh`.

```bash
#!/bin/bash
# Setup Script (Linux/macOS)

echo ""
echo "============================================"
echo "  Auto-Distribution Setup"
echo "============================================"
echo ""

# --- 1. Python Check ---
echo "[1/5] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 not found."
    exit 1
fi

# --- 2. Install Deps ---
echo ""
echo "[2/5] Installing huggingface_hub..."
pip3 install -q huggingface_hub

# --- 3. HF Auth ---
echo ""
echo "[3/5] HuggingFace Auth"
if python3 -c "from huggingface_hub import HfApi; HfApi().whoami()" &> /dev/null; then
    echo "  Logged in."
else
    echo "  Not logged in."
    read -p "  Login now? (y/n) [n]: " login_choice
    if [[ "$login_choice" == "y" || "$login_choice" == "Y" ]]; then
        huggingface-cli login
    else
        echo "  Skipping login."
    fi
fi

# --- 4. Run Script ---
echo ""
echo "[4/5] Running distribution..."
cd "$(dirname "$0")/.."
python3 scripts/distribute_files.py

# --- 5. Push ---
echo ""
echo "[5/5] Pushing to GitHub..."
git add .
if ! git diff --cached --quiet; then
    git commit -m "Auto: Initial setup"
    git push origin main
else
    echo "  No changes to push."
fi
```

## 4. Web Interface (`index.html`)

**Usage:**

- Replace `${GITHUB_USERNAME}` and `${GITHUB_REPO_NAME}`.
- Save to `index.html`.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${GITHUB_REPO_NAME} File Browser</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        max-width: 1000px;
        margin: 40px auto;
        padding: 0 20px;
        background: #f8f9fa;
      }
      .container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 30px;
      }
      h1 {
        color: #1a73e8;
        border-bottom: 2px solid #e8f0fe;
        padding-bottom: 15px;
        margin-top: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .search-box {
        margin: 20px 0;
        display: flex;
        gap: 10px;
      }
      #searchInput {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e8f0fe;
        border-radius: 8px;
        font-size: 16px;
        outline: none;
      }
      #searchInput:focus {
        border-color: #1a73e8;
      }
      .folder-header {
        padding: 6px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        color: #e36209;
        font-weight: 500;
      }
      .folder-header:hover {
        background: #f1f8ff;
      }
      .folder-children {
        margin-left: 24px;
        border-left: 1px dashed #dadce0;
      }
      .folder-children.collapsed {
        display: none;
      }
      .file-item {
        padding: 6px 8px;
        transition: background 0.2s;
      }
      .file-item:hover {
        background: #f1f8ff;
      }
      .file-item a {
        text-decoration: none;
        color: #1a73e8;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hf-badge {
        font-size: 11px;
        background: #fef3c7;
        color: #92400e;
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid #fcd34d;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${GITHUB_REPO_NAME}</h1>
      <div class="search-box">
        <input
          type="text"
          id="searchInput"
          placeholder="Search files..."
          autocomplete="off"
        />
      </div>
      <div id="file-list">Loading...</div>
    </div>

    <script>
      const username = "${GITHUB_USERNAME}";
      const repo = "${GITHUB_REPO_NAME}";
      const branch = "main";
      let allFilesData = [];

      function toggleFolder(e) {
        const children = e.currentTarget.nextElementSibling;
        children.classList.toggle("collapsed");
        e.stopPropagation();
      }

      function renderTree(node) {
        let html = "";
        Object.keys(node)
          .filter((k) => k !== "_files")
          .sort()
          .forEach((folder) => {
            html += `<div class="folder"><div class="folder-header" onclick="toggleFolder(event)">📁 ${folder}/</div><div class="folder-children collapsed">${renderTree(node[folder])}</div></div>`;
          });
        if (node._files) {
          node._files
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((f) => {
              let url = f.isHF
                ? f.hfInfo.url
                : ["pdf", "jpg", "png", "txt", "md", "json"].includes(f.ext)
                  ? f.fullPath
                  : `https://github.com/${username}/${repo}/blob/${branch}/${f.fullPath}`;
              let badge = f.isHF ? '<span class="hf-badge">🤗 HF</span>' : "";
              html += `<div class="file-item"><a href="${url}" target="_blank">📄 ${f.name} ${badge}</a></div>`;
            });
        }
        return html;
      }

      async function init() {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`,
          );
          const data = await res.json();
          allFilesData = data.tree
            .filter(
              (i) =>
                i.type === "blob" &&
                !i.path.startsWith(".git") &&
                !i.path.startsWith("data/"),
            )
            .map((f) => ({
              path: f.path,
              name: f.path.split("/").pop(),
              ext: f.path.split(".").pop().toLowerCase(),
              isHF: false,
            }));

          try {
            const hfRes = await fetch(
              `./data/file_manifest.json?t=${Date.now()}`,
            );
            if (hfRes.ok) {
              const hfData = await hfRes.json();
              hfData.files.forEach((hf) =>
                allFilesData.push({
                  path: hf.path,
                  name: hf.name,
                  ext: hf.path.split(".").pop().toLowerCase(),
                  isHF: true,
                  hfInfo: hf,
                }),
              );
            }
          } catch (e) {}

          // Build Layout
          const tree = {};
          allFilesData.forEach((f) => {
            let parts = f.path.split("/");
            let curr = tree;
            let name = parts.pop();
            parts.forEach((d) => {
              if (!curr[d]) curr[d] = {};
              curr = curr[d];
            });
            if (!curr._files) curr._files = [];
            curr._files.push(f);
          });

          document.getElementById("file-list").innerHTML = renderTree(tree);

          // Search
          document
            .getElementById("searchInput")
            .addEventListener("input", (e) => {
              const val = e.target.value.toLowerCase();
              if (!val)
                return (document.getElementById("file-list").innerHTML =
                  renderTree(tree));
              let html = "";
              allFilesData
                .filter((f) => f.name.toLowerCase().includes(val))
                .forEach((f) => {
                  let url = f.isHF ? f.hfInfo.url : f.fullPath;
                  html += `<div class="file-item"><a href="${url}" target="_blank">📄 ${f.name}</a></div>`;
                });
              document.getElementById("file-list").innerHTML =
                html || "No results";
            });
        } catch (e) {
          document.getElementById("file-list").innerHTML =
            "Error: " + e.message;
        }
      }
      init();
    </script>
  </body>
</html>
```
