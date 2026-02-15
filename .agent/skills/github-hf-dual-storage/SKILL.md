---
name: github-hf-dual-storage
description: >
  将任何 GitHub 仓库转换为 GitHub + HuggingFace 双端存储系统。大文件 (>50MB) 自动路由至
  HuggingFace Datasets，代码与小文件保留在 GitHub，通过 GitHub Pages 提供统一的毛玻璃风格资源
  导航界面。MUST BE USED when: (1) 用户要求为仓库设置大文件自动分发, (2) 仓库含 >50MB 二进制
  文件 (PDF/压缩包/数据集) 需要拆分存储, (3) 用户希望通过 GitHub Pages 提供统一文件浏览界面,
  (4) 需要从零搭建 GitHub + HuggingFace 双端存储架构, (5) 用户要求将现有双端存储方案迁移到
  新仓库。
---

# GitHub + HuggingFace Dual-Storage Skill

## Execution Workflow

### Phase 1: Gather Configuration

Run `git remote -v` to extract GitHub username and repo name. Confirm with user:
- `GITHUB_USERNAME` / `GITHUB_REPO_NAME`
- `HF_USERNAME` / `HF_REPO_NAME` (often same as GitHub)
- `PROJECT_DESCRIPTION` (one-line Chinese description for README)
- `PROJECT_TOC` (Markdown table-of-contents block for README)

### Phase 2: Scaffold from Templates

Read each `assets/*.template` file, replace `${VARIABLES}`, write to target paths:

| Template | Target Path | Notes |
|----------|-------------|-------|
| `distribute_files.py.template` | `scripts/distribute_files.py` | Core distribution engine |
| `setup.bat.template` | `setup.bat` | Windows one-click script |
| `setup.sh.template` | `setup.sh` | Linux/macOS one-click script |
| `index.html.template` | `index.html` | **Must conform to UI spec** (see below) |
| `README.md.template` | `README.md` | Project documentation |
| `distribute-files.yml.template` | `.github/workflows/distribute-files.yml` | HF sync CI (read-only) |
| `deploy-pages.yml.template` | `.github/workflows/deploy-pages.yml` | Static Pages deployment |
| `.gitignore.template` | `.gitignore` | Only if no `.gitignore` exists |
| `.gitattributes.template` | `.gitattributes` | Git LFS backup config |

Also create empty `.nojekyll` file in repo root (bypass Jekyll).

### Phase 3: Guide User Setup

1. Run `setup.bat` (Windows) or `bash setup.sh` (Linux/macOS)
2. Configure GitHub Secret: `Settings → Secrets → HF_TOKEN` (HuggingFace write token)
3. Enable GitHub Pages: `Settings → Pages → Source → "GitHub Actions"`

## Template Variables

All `${VAR}` placeholders in templates must be replaced before writing:

| Variable | Example | Used In |
|----------|---------|---------|
| `${GITHUB_USERNAME}` | `hfhfn` | All templates |
| `${GITHUB_REPO_NAME}` | `AI_Resources` | All templates |
| `${HF_USERNAME}` | `hfhfn` | distribute_files.py, README |
| `${HF_REPO_NAME}` | `AI_Resources` | distribute_files.py, README |
| `${PROJECT_DESCRIPTION}` | `收集 AI 相关学习资料...` | README only |
| `${PROJECT_TOC}` | `### 01 - 数据结构\n...` | README only |

## UI Specification (CRITICAL)

The `index.html` frontend has a strict design specification. When generating or modifying the
index.html, **always read** [`references/ui-spec.md`](references/ui-spec.md) first.

Non-negotiable UI requirements:
- Glassmorphism container with `backdrop-filter: blur(12px)`
- H1 gradient text (`--primary` → `#ec4899`), `font-size: 2.5rem`
- 3 header icon buttons: GitHub, HuggingFace 🤗, theme toggle (`gap: 8px`)
- Visible "清空" clear button (NOT hidden toggle); clear must focus input after clearing
- Filter tag pills: 全部 / PDF 文档 / 项目源码 / 压缩包 / HF 大文件
- File-type icons (📕📦🐍⚡🌐📝📄📓🖼️🎬📊)
- Dual badges: `🤗 HF` (amber) and `📦 Git` (indigo)
- Stats footer grid: 文件总数 / GitHub 文件 / HuggingFace 大文件 / 资料总体积 (exactly 4 cards)
- Theme persistence via `localStorage`
- Skeleton shimmer loading animation (NOT plain text loader): 5 animated bars with `@keyframes shimmer`
- Search text highlighting: `highlightText()` with regex escaping → `<mark class="text-match">` on folder names and file names
- Search row-level highlighting with yellow accent bar (`var(--highlight)` + `border-left: 3px solid var(--primary)`)
- GitHub API fallback: parallel fetch manifest + GitHub Trees API; use API only when manifest fails/empty
- HF file links must include `download` attribute
- Folder display names must end with trailing `/`
- `hiddenRootFolders: ["data", "scripts"]`
- Mobile responsive (<=640px breakpoint, `h1: 1.8rem`)

## Backend Architecture

For detailed backend design, CI workflows, error handling, and data consistency model,
see [`references/architecture.md`](references/architecture.md).

Key guarantees:
- **Local control**: User commits always take precedence; CI never pushes
- **Idempotency**: Multiple runs without changes = no extra commits
- **Sync integrity**: Local delete → auto-remove from HF + .gitignore + manifest
- **404 tolerance**: Deleting already-deleted HF files treated as success
- **CI/fresh-clone safety**: `skip_deletion` when no local large files but .gitignore has rules
