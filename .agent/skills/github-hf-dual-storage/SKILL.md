---
name: github-hf-dual-storage
description: Transform any GitHub repository into a Dual-Storage system (Large files to HuggingFace, Small files/Pages to GitHub).
---

# GitHub + HuggingFace Dual-Storage Skill

## Overview

This skill guides you through transforming a standard GitHub repository into a dual-storage system optimized for large datasets or binary files.

**Architecture:**

- **Large Files (>50MB)**: Automatically uploaded to HuggingFace Datasets and excluded from Git tracking (via `.gitignore`).
- **Sync Deletion (v3.0)**: Automatically cleans up redundant files on HuggingFace that are deleted locally.
- **Small Files & Code**: Maintained in the GitHub repository.
- **Premium Unified Interface (v3.0)**: A modern, glassmorphism-styled `index.html` with dark mode, category filtering, and enhanced search.

**Use When:**

- The user has a repo with large files (models, datasets, videos) that exceed GitHub's limits.
- The user wants a "set and forget" automation script.
- The user needs a simple web interface to browse all content.

---

# Process

## Phase 1: Analysis & Context Gathering

Before writing any code, you must identify the target repositories.

1.  **Identify GitHub Context**:
    - Run `git remote -v` to get the current `GITHUB_USERNAME` and `GITHUB_REPO_NAME`.
2.  **Determine HuggingFace Context**:
    - Ask the user for their `HF_USERNAME` (or infer from GitHub username).
    - Ask for the target `HF_REPO_NAME` (default to matching GitHub repo name).
3.  **Check Prerequisites**:
    - verify `git` is installed.
    - verify `python` is available.

## Phase 2: Scaffolding

You will create the necessary scripts and configuration files.

**Load Templates**:

> 📖 **ACTION**: Read the template file at `skills/github-hf-dual-storage/resources/templates.md` to get the source code for the scripts below.

### 2.1 Distribution Logic (`scripts/distribute_files.py`)

- Extract the python script from the `templates.md` file.
- **CRITICAL**: Replace `${HF_USERNAME}` and `${HF_REPO_NAME}` in the code with the values identified in Phase 1.
- Write the file to `scripts/distribute_files.py`.

### 2.2 Automation Scripts (`scripts/setup.bat` / `.sh`)

- Extract the batch/shell scripts from `templates.md`.
- Write `scripts/setup.bat` (for Windows users).
- Write `scripts/setup.sh` (for Mac/Linux users).

### 2.3 Web Interface (`index.html`)

- Extract the HTML template from `templates.md`.
- **CRITICAL**: Replace `${GITHUB_USERNAME}` and `${GITHUB_REPO_NAME}` in the code.
- Write the file to `index.html` in the project root.

### 2.4 Documentation (`README.md`)

- Update the project's README.md to explain the storage strategy.
- Add a "File Storage" section explaining that files >50MB are hosted on HuggingFace.
- Add "Setup" instructions referencing the scripts (`scripts/setup.bat` or `setup.sh`).

## Phase 3: Execution & Verification

### 3.1 Initial Setup

- Instruct the user to run the setup script:
  - Windows: `scripts\setup.bat`
  - Linux/Mac: `bash scripts/setup.sh`
- Explain that this script will:
  1.  Install dependencies (`huggingface_hub`).
  2.  Upload large files to HF and remove them from Git tracking.
  3.  Commit and push changes to GitHub.

### 3.2 GitHub Pages

- Remind the user to enable GitHub Pages in their repository settings:
  - **Source**: `main` branch.
  - **Path**: `/` (root).

## Reference Files

- [📄 Templates](./resources/templates.md) - Contains all source code for scripts.
