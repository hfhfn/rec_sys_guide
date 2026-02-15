# rec_sys_guide - Project Overview

## Purpose
推荐系统学习资料库 (Recommendation System Learning Resources). Uses GitHub + HuggingFace dual-storage: small files on GitHub, large files (>50MB) on HuggingFace Datasets.

## Tech Stack
- **Backend**: Python (`scripts/distribute_files.py`) - file scanning, HF upload, manifest generation
- **Frontend**: Single `index.html` with vanilla JS, glassmorphism UI
- **CI/CD**: GitHub Actions (`distribute-files.yml`, `deploy-pages.yml`)
- **Setup**: `setup.bat` (Windows) / `setup.sh` (Linux/macOS)

## Key Files
- `scripts/distribute_files.py` - Core distribution engine
- `index.html` - Web interface (GitHub Pages)
- `data/file_manifest.json` - Generated manifest of all files
- `.gitignore` - Auto-managed section for HF large files
- `setup.bat` / `setup.sh` - One-click setup scripts

## Conventions
- Python: standard logging, retry decorator pattern
- Frontend: vanilla JS, CSS custom properties for theming
- Gitignore: auto-managed section marked with `# [Auto] Large files managed by HuggingFace`

## Commands
- `setup.bat` (Windows) or `bash setup.sh` (Linux/macOS) - full workflow
- `python scripts/distribute_files.py` - run distribution only
