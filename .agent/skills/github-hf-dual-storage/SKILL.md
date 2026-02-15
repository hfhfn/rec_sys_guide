---
name: github-hf-dual-storage
description: 将任何 GitHub 仓库转换为双端存储系统 (大文件上传至 HuggingFace，代码/网页保留在 GitHub)。v4.2 支持 .nojekyll 自动创建、HuggingFace UI 入口、完整自动化部署、智能文件删除及同步删除。
metadata:
  version: "4.2"
  author: "Antigravity"
---

# GitHub + HuggingFace Dual-Storage Skill

## Purpose

将标准 GitHub 仓库转换为双端存储系统：大文件 (>50MB) 自动路由至 HuggingFace Datasets，代码与网页保留在 GitHub。CI 仅同步 HF，不提交推送，本地完全掌控。

## When to Trigger

- 用户要求为仓库设置大文件自动分发
- 仓库含 >50MB 二进制文件 (PDF/压缩包/数据集) 需要拆分存储
- 用户希望通过 GitHub Pages 提供统一文件浏览界面
- 需要从零搭建 GitHub + HuggingFace 双端存储架构

## Execution Phases

1. **环境分析**: 运行 `git remote -v` 获取仓库信息，确认 HF 用户名与仓库名。
2. **脚手架搭建**: 读取 `assets/` 模板，注入配置后写入分发脚本、初始化脚本、Web 界面、CI 流水线和 README。
3. **初始化执行**: 指导运行 `setup.bat`/`setup.sh` 完成首次分发，配置 GitHub Secrets 与 Pages。

## Key Capabilities

- **自动路由**: >50MB 文件上传 HF，小文件保留 GitHub，`.gitignore` 自动维护
- **同步删除**: 删除本地文件后运行脚本，自动清理 `.gitignore` 规则和 HF 远程文件 (404 容错)
- **只读 CI**: GitHub Actions 仅同步 HF，不提交/推送，避免覆盖用户本地更新
- **智能时间戳**: Manifest 仅在文件内容或数量变化时更新，避免无意义 diff
- **统一 UI**: 玻璃拟态界面，支持暗色模式、文件夹匹配搜索、类型过滤、HF 徽章与 HF 数据集入口按钮
- **Pages 兼容**: `.nojekyll` + `deploy-pages.yml` 静态部署，彻底绕过 Jekyll，支持中文/特殊字符文件名
- **一键脚本**: `setup.bat`/`setup.sh` 包含 HF 认证、autostash 同步、.nojekyll 检查、分发、提交、推送全流程

## References

- **架构设计与工作流详解**: [`references/architecture.md`](references/architecture.md)
- **模板代码**: [`assets/`](assets/) 目录下所有 `.template` 文件
