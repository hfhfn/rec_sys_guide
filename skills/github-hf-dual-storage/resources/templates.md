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
EXCLUDE_DIRS = {'.git', '.idea', '.vscode', 'venv', 'node_modules', '__pycache__', '.serena'}

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
    print(f"🚀 Uploading {len(files)} large files to HuggingFace ({HF_REPO_ID})...")
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
    print("\n🛡️  Processing Git tracking & .gitignore...")
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
            f.write("\n# [Auto] Large files managed by HuggingFace\n")
            for rule in new_rules:
                f.write(f"{rule}\n")
        print(f"   📝 Added {len(new_rules)} rules to .gitignore")

def generate_manifest(large_files):
    print("\n📋 Generating file manifest (data/file_manifest.json)...")
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

    print("\n✅ All steps complete! Ready for git push.")

if __name__ == "__main__":
    main()
```

## 2. Windows Setup Script (`scripts/setup.bat`)

**Usage:**

- Save to `scripts/setup.bat` (Windows).

```batch
@echo off
chcp 65001 >nul
echo [1/6] Installing dependencies...
pip install huggingface_hub
echo [2/6] Running distribution script...
python scripts/distribute_files.py
echo [3/6] Adding files to Git...
git add .
echo [4/6] Committing...
git commit -m "Auto: Update files (Dual-Storage)"
echo [5/6] Pushing to GitHub...
git push origin main
pause
```

## 3. Linux/Mac Setup Script (`scripts/setup.sh`)

**Usage:**

- Save to `scripts/setup.sh`.

```bash
#!/bin/bash
echo "[1/6] Installing dependencies..."
pip install huggingface_hub
echo "[2/6] Running distribution script..."
python3 scripts/distribute_files.py
echo "[3/6] Adding files to Git..."
git add .
echo "[4/6] Committing..."
git commit -m "Auto: Update files (Dual-Storage)"
echo "[5/6] Pushing to GitHub..."
git push origin main
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${GITHUB_REPO_NAME} - Files</title>
    <style>
      body {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
          Arial, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8fafc;
        color: #334155;
      }
      h1 {
        color: #1e293b;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 10px;
      }
      .file-item {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        border-bottom: 1px solid #e2e8f0;
        background: white;
        transition: background 0.2s;
      }
      .file-item:hover {
        background-color: #f1f5f9;
      }
      .file-item a {
        text-decoration: none;
        color: #2563eb;
        font-weight: 500;
        display: flex;
        align-items: center;
        width: 100%;
      }
      .file-icon {
        margin-right: 10px;
        font-size: 1.2em;
      }
      .hf-badge {
        margin-left: auto;
        font-size: 11px;
        background-color: #fef3c7;
        color: #92400e;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: bold;
        border: 1px solid #fcd34d;
      }
      .folder {
        margin-top: 5px;
      }
      .folder-header {
        font-weight: bold;
        padding: 8px 12px;
        cursor: pointer;
        background-color: #e2e8f0;
        border-radius: 6px;
        display: flex;
        align-items: center;
        color: #475569;
      }
      .folder-header:hover {
        background-color: #cbd5e1;
      }
      .folder-children {
        margin-left: 20px;
        border-left: 2px solid #e2e8f0;
      }
      .loading,
      .error,
      .no-results {
        text-align: center;
        padding: 40px;
        color: #64748b;
      }
      .error {
        color: #ef4444;
      }
    </style>
  </head>
  <body>
    <h1>📂 ${GITHUB_REPO_NAME} Files</h1>
    <div id="file-list"></div>

    <script>
      // --- CONFIGURATION ---
      const username = "${GITHUB_USERNAME}"; // Agent: Replace!
      const repo = "${GITHUB_REPO_NAME}"; // Agent: Replace!
      const branch = "main";

      let allFilesData = [];

      function buildFileTree(files) {
        const tree = {};
        files.forEach((file) => {
          const parts = file.path.split("/");
          let current = tree;
          const fileName = parts.pop();
          parts.forEach((dir) => {
            if (!current[dir]) current[dir] = {};
            current = current[dir];
          });
          if (!current._files) current._files = [];
          current._files.push({
            name: fileName,
            fullPath: file.path,
            ext: fileName.split(".").pop().toLowerCase(),
            isHF: file.isHF,
            hfInfo: file.hfInfo,
          });
        });
        return tree;
      }

      function renderTree(node) {
        let html = "";
        // Render Folders
        Object.keys(node)
          .filter((k) => k !== "_files")
          .sort()
          .forEach((folder) => {
            html += `<div class="folder"><div class="folder-header">📁 ${folder}/</div><div class="folder-children">${renderTree(node[folder])}</div></div>`;
          });
        // Render Files
        if (node._files) {
          node._files
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((file) => {
              let url,
                title,
                badge = "";
              const previewExts = [
                "pdf",
                "jpg",
                "jpeg",
                "png",
                "gif",
                "svg",
                "txt",
                "json",
                "html",
                "htm",
                "xml",
              ];

              if (file.isHF) {
                url = file.hfInfo.url;
                title = `HuggingFace Download (${file.hfInfo.size_mb}MB)`;
                badge = '<span class="hf-badge">🤗 HF</span>';
              } else if (previewExts.includes(file.ext)) {
                url = file.fullPath; // Direct preview relative path
                title = "Direct View/Download";
              } else {
                url = `https://github.com/${username}/${repo}/blob/${branch}/${file.fullPath}`; // Blob view
                title = "View Source on GitHub";
              }
              html += `<div class="file-item"><a href="${url}" target="_blank"><span class="file-icon">📄</span><span>${file.name}</span>${badge}</a></div>`;
            });
        }
        return html;
      }

      async function init() {
        try {
          document.getElementById("file-list").innerHTML =
            '<div class="loading">Loading files...</div>';

          // 1. Fetch GitHub Tree
          const ghRes = await fetch(
            `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`,
          );
          const ghData = ghRes.ok ? await ghRes.json() : { tree: [] };

          // Filter files (exclude .git, scripts, data)
          const gitFiles = (ghData.tree || []).filter(
            (i) =>
              i.type === "blob" &&
              !i.path.startsWith(".git") &&
              !i.path.startsWith("scripts/") &&
              !i.path.startsWith("data/"),
          );

          allFilesData = gitFiles.map((f) => ({
            path: f.path,
            name: f.path.split("/").pop(),
            isHF: false,
          }));

          // 2. Fetch HF Manifest
          try {
            const hfRes = await fetch(
              "./data/file_manifest.json?t=" + Date.now(),
            );
            if (hfRes.ok) {
              const hfData = await hfRes.json();
              hfData.files.forEach((f) => {
                allFilesData.push({
                  path: f.path,
                  name: f.name,
                  isHF: true,
                  hfInfo: f,
                });
              });
            }
          } catch (e) {
            console.warn("Manifest loading failed", e);
          }

          // Render
          if (allFilesData.length === 0) {
            document.getElementById("file-list").innerHTML =
              '<div class="no-results">No files found.</div>';
          } else {
            document.getElementById("file-list").innerHTML = renderTree(
              buildFileTree(allFilesData),
            );
          }
        } catch (e) {
          document.getElementById("file-list").innerHTML =
            `<div class="error">Error loading files: ${e.message}</div>`;
        }
      }
      init();
    </script>
  </body>
</html>
```
