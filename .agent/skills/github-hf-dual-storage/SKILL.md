---
name: github-hf-dual-storage
description: 将任何 GitHub 仓库转换为双端存储系统 (大文件上传至 HuggingFace，代码/网页保留在 GitHub)。v3.2 支持完整自动化部署、详细设置指南及同步删除。
metadata:
  version: "3.2"
  author: "Antigravity"
---

# GitHub + HuggingFace Dual-Storage Skill

## 1. 概述与架构

本技能指导您将标准的 GitHub 仓库转换为针对大数据集或二进制文件优化的双端存储系统。

- **大文件 (>50MB)**: 自动上传至 HuggingFace Datasets，并通过 `.gitignore` 排除。
- **自动化分发 (v3.2)**: 集成 GitHub Actions，实现 push 代码后自动分流。
- **新手友好文档 (v3.2)**: 生成包含完整环境配置、Secret 设置及一键脚本说明的 `README.md`。
- **Premium 统一界面**: 基于 GitHub Pages 的玻璃拟态 UI，支持暗色模式与文件夹匹配搜索。

> 📖 **参考**: 阅读 `references/architecture.md` 以了解详细系统设计。

## 2. 执行阶段 (Phases)

### Phase 1: 环境分析与仓库识别

1. **GitHub 上下文**: 运行 `git remote -v` 获取当前仓库的用户名和名称。
2. **HuggingFace 上下文**: 询问用户 `HF_USERNAME` (默认同 GitHub) 和 `HF_REPO_NAME` (默认匹配仓库名)。

### Phase 2: 脚手架搭建 (Scaffolding)

按需读取 `assets/` 目录下的模板并注入配置：

1. **分发脚本 (`scripts/distribute_files.py`)**: 写入逻辑同 v3.1，确保 `HF_REPO_ID` 正确。
2. **初始化脚本 (`setup.bat` & `setup.sh`)**: 确保脚本包含对 `huggingface_hub` 的自动安装。
3. **Web 界面 (`index.html`)**: 注入 GitHub 用户名和仓库名。
4. **自动化流水线 (`.github/workflows/distribute-files.yml`)**: 注入项目特定变量，提供全自动分发能力。
5. **标准文档 (`README.md`)**: 替换变量生成包含前置环境安装、Secrets 配置及使用指南的引导文件。

### Phase 3: 初始化执行与验证

- 引导用户先运行 `pip install huggingface_hub` (或通过一键脚本自动完成)。
- 引导用户运行一键配置脚本。
- **关键**: 指导用户在 GitHub 仓库设置 `HF_TOKEN` 和 `HF_USERNAME` Secrets。
- 引导开启 GitHub Pages 访问。

## 3. 最佳实践

- **鉴权**: 优先使用 `HF_TOKEN` 环境变量。
- **更新**: 定期运行同步删除逻辑以节省 HuggingFace 存储空间。
- **文档**: 始终提供清晰的 `README.md` 以便协同开发者理解分发逻辑。
