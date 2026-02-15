# System Architecture v4.2

The GitHub + HuggingFace Dual-Storage system solves GitHub's file size limitations by using HuggingFace Datasets as secondary storage for large binary files (>50MB), while keeping code and web interfaces on GitHub.

## 1. Storage Strategy

- **GitHub**: Stores code, small documentations, web interface (`index.html`), metadata (`data/file_manifest.json`), and `.nojekyll` (bypass Jekyll).
- **HuggingFace**: Stores large files (>50MB), excluded from Git tracking via `.gitignore`.

## 2. Key Components

### 2.1 Backend: `distribute_files.py` (v3.1 + v4.1 enhancements)

Core distribution engine with the following capabilities:

- **Scanning**: Identifies files exceeding the 50MB threshold.
- **Uploading**: Pushes large files to the specified HuggingFace dataset repository with retry logic (3 attempts, exponential backoff).
- **Sync Deletion**: Compares local files with HuggingFace repository:
  - **v4.1**: Checks if files in `.gitignore` rules exist locally
  - **v4.1**: Automatically removes rules for missing files
  - **v4.1**: Automatically deletes missing files from HuggingFace
  - **v4.1**: Treats 404 errors as expected (file already gone = success)
- **Manifest Generation**: Creates `data/file_manifest.json` with:
  - **v4.1**: Intelligent timestamp preservation (only updates if content changes)
  - **v4.1**: Automatic detection of file count changes (deletion indicator)
  - File metadata: name, path, size, URL, last_modified
- **Git Management**: Automatically updates `.gitignore` and removes large files from Git cache.

### 2.2 Frontend: `index.html`

A modern, glassmorphism-styled web interface that:

- Fetches code files directly from the GitHub API.
- Fetches large file metadata from `file_manifest.json`.
- Provides a unified tree view of both storage sources.
- Supports dark mode, searching, and type filtering.
- **v4.2**: Header includes GitHub link, HuggingFace dataset link (🤗 button), and theme toggle.

### 2.3 GitHub Pages: `.nojekyll` + `deploy-pages.yml`

- **v4.2**: An empty `.nojekyll` file in the repository root signals Jekyll bypass.
- **v4.2**: A dedicated `deploy-pages.yml` workflow deploys static files directly via `actions/deploy-pages`, replacing the default Jekyll build pipeline.
- Required because Jekyll cannot handle filenames with CJK characters or special symbols (e.g., `开篇词｜用好A_B测试.html`).
- Without it, Jekyll build failures cause GitHub Pages to stall on old content.
- `setup.bat`/`setup.sh` automatically create `.nojekyll` if missing.
- **Setup requirement**: GitHub Settings > Pages > Source must be set to **"GitHub Actions"** (not "Deploy from a branch").

### 2.4 Orchestration: `setup.bat` / `setup.sh` (v4.2)

Complete workflow orchestration:

1. **Environment Check**: Verify Python and dependencies
2. **Dependency Installation**: Auto-install huggingface_hub if missing
3. **Git Sync**: `git pull --rebase --autostash` for conflict-free synchronization
4. **v4.2 .nojekyll Check**: Create `.nojekyll` if missing (bypass Jekyll for GitHub Pages)
5. **Distribution**: Run `distribute_files.py` to process files
6. **Local Commit**: Stage and commit changes locally
7. **Push to GitHub**: Push to remote repository

### 2.5 CI/CD: `.github/workflows/distribute-files.yml` (v4.1)

GitHub Actions workflow with read-only model:

- **Triggers**: On push to main branch (excluding README.md and index.html)
- **Purpose**: Sync HuggingFace deletions (files deleted locally should be removed from HF)
- **v4.1 Model**: Read-only - script runs but does NOT commit or push
- **Reasoning**: Prevents GitHub Actions from overwriting user's local updates with stale versions
- **Responsibility Model**: User (local) controls all commits, GitHub Actions only validates

### 2.6 Deployment: `.github/workflows/deploy-pages.yml` (v4.2)

Static GitHub Pages deployment (bypasses Jekyll entirely):

- **Triggers**: On push to main branch
- **Purpose**: Deploy repository as static site to GitHub Pages without Jekyll processing
- **v4.2**: Replaces default Jekyll build with `actions/upload-pages-artifact` + `actions/deploy-pages`
- **Why needed**: Jekyll fails on CJK filenames and special characters; static deployment serves all files as-is
- **Requires**: GitHub Settings > Pages > Source set to "GitHub Actions"
- **Concurrency**: Uses `cancel-in-progress: false` to ensure deployments complete

## 3. Workflow Architecture

### 3.1 Upload New File (>50MB)

```
User: Copy file > 50MB to repo
    ↓
setup.bat runs:
  1. git pull --rebase --autostash
  2. ensure .nojekyll exists
  3. python distribute_files.py
     - scan_files() → detects new file
     - upload_to_hf() → uploads to HF
     - update_gitignore_and_git() → adds .gitignore rule
     - generate_manifest() → updates file_manifest.json
  3. git add . && git commit
  4. git push
    ↓
GitHub Actions triggered:
  - distribute_files.py runs (no-op, already uploaded)
  - Does NOT commit/push (read-only)
    ↓
Result: File in HF ✓, .gitignore on GitHub ✓, Pages updated ✓
```

### 3.2 Delete Large File

```
User: rm large_file.bin (delete locally)
    ↓
setup.bat runs:
  1. git pull
  2. python distribute_files.py
     - scan_files() → file not found
     - update_gitignore_and_git()
       a) Read .gitignore auto-section rules
       b) FOR EACH rule:
          - Check if file exists locally
          - IF NOT: Remove rule, delete from HF, handle 404 as success
       c) Remove stale rules from .gitignore
     - generate_manifest()
       - Detect file count decreased → force update timestamp
       - Remove entry for deleted file
  3. git add . && git commit
  4. git push
    ↓
GitHub Actions triggered:
  - distribute_files.py runs
  - File already deleted from HF (expected 404)
  - Does NOT commit (read-only)
    ↓
Result: File deleted from HF ✓, .gitignore updated ✓, manifest updated ✓, Pages current ✓
```

### 3.3 Multiple Changes (Add + Delete)

```
User operations:
  - Add big_file_A.bin (new)
  - Delete big_file_B.bin (existing)
    ↓
setup.bat processes:
  - big_file_A: Uploaded to HF, rule added to .gitignore
  - big_file_B: Deleted from HF, rule removed from .gitignore
  - Single manifest.json update with both changes
    ↓
Result: Atomic operation, consistent state
```

## 4. Error Handling & Resilience

| Scenario | Handling | Status |
|----------|----------|--------|
| HF upload fails | Retry 3x with exponential backoff (2s → 4s → 8s) | ✅ |
| File already on HF | Overwrite (idempotent) | ✅ |
| File missing from HF (404) | Treat as success (already gone) | ✅ |
| Network timeout | Retry decorator handles | ✅ |
| Missing huggingface_hub | Auto-installed by setup.bat | ✅ |
| Git conflict | setup.bat exits with instruction | ✅ |
| Missing .nojekyll | Auto-created by setup.bat/setup.sh | ✅ |
| Manifest corruption | Regenerated automatically | ✅ |
| Timestamp mismatch | Smart preservation (only update on change) | ✅ |

## 5. Data Consistency Model

### Guarantee 1: Local Control
- User's local edits always take precedence
- GitHub Actions never overwrites local commits

### Guarantee 2: Idempotency
- Running script multiple times without changes = no extra commits
- Timestamp preserved if content identical
- Safe to run multiple times

### Guarantee 3: Sync Integrity
- File deleted locally → automatically removed from HF
- File missing from HF → automatically removed from .gitignore
- Manifest always reflects current state

## 6. Version Evolution

| Version | Key Features | Date |
|---------|-------------|------|
| v3.2 | Basic dual-storage, GitHub Actions auto-commit | 2026-02 |
| v4.0 | Fixed GitHub Actions conflicts, read-only model | 2026-02-14 |
| v4.1 | Auto-delete rules, smart timestamps, 404 handling | 2026-02-15 |
| v4.2 | `.nojekyll` auto-creation, HuggingFace UI button | 2026-02-15 |

## 7. Performance Characteristics

- **Scan**: O(n) where n = total files in repo
- **Upload**: O(m) where m = files >50MB (with retry = O(m×3) worst case)
- **Sync Deletion**: O(hf_files) where hf_files = files on HuggingFace
- **Manifest Generation**: O(n) with sorting overhead
- **Total Run Time**: Typically 30-60s for typical repos (varies by file size and network)

## 8. Best Practices

- **GitHub Pages 兼容**: 确保 `.nojekyll` 存在，避免 Jekyll 构建失败导致 Pages 不更新 (尤其对含中文/特殊字符文件名的仓库)。
- **鉴权**: 优先使用 `HF_TOKEN` 环境变量；本地开发可通过 `huggingface-cli login` 交互登录。
- **删除文件**: 删除本地文件后直接运行 `setup.bat`/`setup.sh`，脚本自动处理 `.gitignore` 清理、HF 远程删除和 manifest 更新，无需手动编辑。
- **定期清理**: 利用 GitHub Actions `schedule` 触发器 (每周日 0:00 UTC) 自动同步删除，节省 HuggingFace 存储空间。
- **文档维护**: 始终提供清晰的 `README.md` 以便协同开发者理解分发逻辑与 Secret 配置。

## 9. Version Changelog (Detailed)

### v4.2: GitHub Pages 兼容 + HuggingFace 入口 (2026-02-15)

| 特性 | v4.1 (旧) | v4.2 (新) |
|------|-----------|-----------|
| GitHub Pages 兼容 | 依赖 Jekyll 默认构建，中文文件名导致构建失败 | `.nojekyll` + `deploy-pages.yml` 静态部署，彻底跳过 Jekyll |
| HuggingFace 入口 | 页面无直接链接到 HF 数据集 | Header 添加 🤗 按钮，一键跳转 HF 数据集页面 |
| Setup 步骤 | 7 步 (检查→依赖→同步→分发→提交→推送) | 8 步 (新增 .nojekyll 检查步骤) |

### v4.1: 智能 .gitignore 删除 + 时间戳保留 (2026-02-15)

| 特性 | v3.2 (旧) | v4.1 (新) |
|------|-----------|-----------|
| `.gitignore` 规则清理 | 用户需手动编辑，删除已删除文件的规则 | 脚本检测本地文件是否存在，自动移除不存在文件的规则 |
| GitHub Actions 控制权 | 自动提交/推送 manifest，导致覆盖用户更新 | 仅运行同步逻辑，不提交任何更改，用户本地完全掌控 |
| 时间戳管理 | 每次运行都更新时间戳，导致无必要的 diff | 仅当文件内容或数量变化时更新时间戳 |
| HF 404 处理 | 删除已不存在的文件时报错 | 404 视为成功 (文件已删除 = 预期状态) |
| Manifest 范围 | 仅含大文件 | 全量文件 (大+小)，带 `is_hf` 字段区分 |
| URL 编码 | 不处理中文路径 | `urllib.parse.quote` 编码，支持中文路径 |
| 日志系统 | `print()` | `logging` 模块，文件+控制台双输出 |
| 重试机制 | 无 | `retry()` 装饰器，3 次重试，指数退避 |
