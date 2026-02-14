# System Architecture

The GitHub + HuggingFace Dual-Storage system aims to solve the file size limitations of GitHub by using HuggingFace Datasets as an secondary storage for large binary files.

## 1. Storage Strategy

- **GitHub**: Stores code, small documentations, and the web interface (`index.html`).
- **HuggingFace**: Stores large files (>50MB). These files are excluded from Git tracking via `.gitignore`.

## 2. Key Components

### 2.1 Backend: `distribute_files.py`

This script is the engine of the system. It performs:

- **Scanning**: Identifies files exceeding the 50MB threshold.
- **Uploading**: Pushes large files to the specified HuggingFace dataset repository.
- **Sync Deletion**: Compares local files with the HuggingFace repository and removes files on HF that are no longer present locally.
- **Manifest Generation**: Creates `data/file_manifest.json` containing metadata for all large files.
- **Git Management**: Automatically updates `.gitignore` and removes large files from the Git cache.

### 2.2 Frontend: `index.html`

A modern, glassmorphism-styled web interface that:

- Fetches code files directly from the GitHub API.
- Fetches large file metadata from `file_manifest.json`.
- Provides a unified tree view of both storage sources.
- Supports dark mode, searching, and type filtering.

## 3. Workflow

1.  **Configure**: Run setup script to initialize the project structure.
2.  **Authenticate**: Log in to HuggingFace or set `HF_TOKEN`.
3.  **Distribute**: Script moves large files to HF and updates manifest.
4.  **Publish**: Commit small changes to GitHub and enable GitHub Pages.
