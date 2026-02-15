# 推荐系统学习资料

本项目包含推荐系统相关的学习资料、讲义、论文和代码示例，涵盖推荐算法、推荐场景和推荐项目等多个方面。

## 文件存储策略

本项目采用 **GitHub + HuggingFace 双重存储** 方案管理大量文件：

| 文件类型      | 大小阈值 | 存储位置             | 标识  |
| ------------- | -------- | -------------------- | ----- |
| PDF、压缩包等 | > 50MB   | HuggingFace Datasets | 🤗 HF |
| 其他资料      | < 50MB   | GitHub Repository    | 📄    |

```
大文件 (>50MB)  ─→  HuggingFace Datasets
小文件 (<50MB)  ─→  GitHub Repository
GitHub Pages    ←─  动态索引（index.html）
```

> 💡 如果你不需要自动分发功能，也可以使用 [Git LFS 备用方案](#备用方案git-lfs)。

---

## 🚀 快速开始

### 1. 环境准备 (必需)

本项目依赖 `huggingface_hub` 进行大文件分发。请确保已安装 Python，并运行：

```bash
pip install "huggingface_hub>=0.17.0"
```

### 2. 克隆仓库

```bash
git clone https://github.com/hfhfn/rec_sys_guide.git
cd rec_sys_guide
```

### 3. 一键配置

运行以下脚本，它将自动完成 HuggingFace 认证检查、远程同步 (autostash)、文件分发、提交与推送：

**Windows：**

```bash
setup.bat
```

**Linux/macOS：**

```bash
bash setup.sh
```

### 4. 配置 GitHub Secrets (实现自动化分发)

如果您希望在 `git push` 后自动处理大文件，请访问 `https://github.com/hfhfn/rec_sys_guide/settings/secrets/actions`，添加以下 Secret：

| Secret 名称   | 值                                            | 获取方式                                            |
| ------------- | --------------------------------------------- | --------------------------------------------------- |
| `HF_TOKEN`    | 你的 HuggingFace Token（需要 **write** 权限） | [HF Tokens](https://huggingface.co/settings/tokens) |

### 5. 启用 GitHub Pages

Settings → Pages → Source 选择 **"GitHub Actions"** → `Save`。
项目已包含 `.nojekyll` 文件和 `deploy-pages.yml` 工作流，推送到 main 后会自动部署。
部署完成后访问：https://hfhfn.github.io/rec_sys_guide

---

## 📥 文件下载

### 🌐 网页浏览（推荐）

访问 [GitHub Pages](https://hfhfn.github.io/rec_sys_guide)，支持：

- 🔍 快速搜索文件名
- 📂 树形结构浏览
- 📥 一键下载（自动识别 GitHub / HuggingFace 来源）
- 🤗 HF 标签标识大文件

### 💻 命令行下载

**下载 HuggingFace 上的大文件：**

```bash
pip install huggingface_hub
huggingface-cli download hfhfn/rec_sys_guide --repo-type dataset --local-dir ./rec_sys_materials
```

或使用 Python：

```python
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="hfhfn/rec_sys_guide",
    repo_type="dataset",
    local_dir="./rec_sys_materials"
)
```

---

## 🔄 自动更新流程

推送代码后，GitHub Actions 自动同步 HuggingFace（v4.1 只读模式，不提交/推送）：

```
git add + git commit + git push
        ↓
GitHub Actions 自动触发
        ↓
distribute_files.py 判断文件大小
        ↓
大文件 → 同步至 HuggingFace  |  已删除文件 → 从 HF 清理
        ↓
CI 不提交/推送 (只读模式)
用户本地 setup.bat 负责 manifest 提交
```

手动触发分发：

```bash
python scripts/distribute_files.py
```

> 详细配置和高级用法请参考 [分发系统详细指南](docs/DISTRIBUTE_GUIDE.md)

---

## 📋 目录结构

```
rec_sys_guide/
├── 推荐算法/                          # 推荐算法相关资料
├── 推荐场景/                          # 推荐场景应用示例
├── 推荐项目/                          # 推荐项目实现
├── .github/workflows/
│   ├── distribute-files.yml           # GitHub Actions 自动分发工作流
│   └── deploy-pages.yml              # GitHub Pages 静态部署工作流
├── scripts/
│   └── distribute_files.py            # 文件分发脚本
├── data/
│   └── file_manifest.json             # 文件清单（自动生成）
├── docs/
│   └── DISTRIBUTE_GUIDE.md            # 分发系统详细指南
├── index.html                         # GitHub Pages 网页
├── setup.bat                          # Windows 一键配置
├── setup.sh                           # Linux/macOS 一键配置
├── README.md                          # 本文件
├── .nojekyll                          # 跳过 Jekyll 构建
├── .gitignore                         # Git 忽略配置
└── .gitattributes                     # Git LFS 配置（备用方案）
```

---

## 备用方案：Git LFS

如果不想使用 HuggingFace 分发方案，可以使用 **Git LFS (Large File Storage)** 直接在 GitHub 管理大文件。

### 什么是 Git LFS？

Git LFS 用指针替换大文件存储在 Git 中，实际文件内容存储在远程 LFS 服务器上。适合团队规模较小、文件总量不太大的场景。

### 安装 Git LFS

**Windows：**

```bash
# 方法1：使用 Chocolatey
choco install git-lfs

# 方法2：使用 Scoop
scoop install git-lfs

# 方法3：从官网下载
# https://git-lfs.github.com/
```

**macOS：**

```bash
brew install git-lfs
```

**Linux：**

```bash
# Ubuntu/Debian
apt-get install git-lfs

# Fedora/RHEL
yum install git-lfs

# Arch
pacman -S git-lfs
```

### 使用 Git LFS

```bash
# 1. 初始化 LFS（在项目根目录运行一次）
git lfs install

# 2. 克隆仓库（LFS 文件会自动下载）
git clone https://github.com/hfhfn/rec_sys_guide.git

# 3. 如果已经克隆但 LFS 文件未下载
git lfs pull

# 4. 查看 LFS 管理的文件
git lfs ls-files

# 5. 查看 LFS 状态
git lfs status
```

> ⚠️ 注意：GitHub 免费用户 LFS 配额为 1GB 存储 + 1GB/月带宽。如果文件总量超过限制，建议使用主方案（HuggingFace）。

### 已配置的 LFS 文件类型

当前 `.gitattributes` 已配置以下类型通过 LFS 管理：

- **文档**：`.pdf`
- **压缩包**：`.zip` `.rar` `.7z` `.tar` `.tar.gz` `.tgz`
- **镜像**：`.iso` `.img`
- **视频**：`.mp4` `.mkv` `.mov` `.avi` `.flv`
- **音频**：`.mp3` `.wav` `.flac`
- **二进制**：`.bin` `.exe` `.dll` `.so` `.dylib`

---

## ❓ 常见问题

**Q: 文件没有出现在 GitHub Pages 中？**

1. 检查文件是否已推送到 GitHub
2. 确认 GitHub Pages 已启用（Settings → Pages）
3. 检查 `data/file_manifest.json` 是否已更新
4. 查看 GitHub Actions 日志排查问题

**Q: HuggingFace 上传失败？**

```bash
# 验证 token 是否有效
huggingface-cli whoami

# 验证数据集权限
huggingface-cli repo info hfhfn/rec_sys_guide --repo-type dataset
```

**Q: 如何修改大文件阈值（默认 50MB）？**

编辑 `scripts/distribute_files.py` 中的 `SIZE_THRESHOLD` 值。

**Q: 大文件下载很慢？**

国内用户可使用 HuggingFace 镜像：

```bash
huggingface-cli download hfhfn/rec_sys_guide --repo-type dataset --local-dir ./data --endpoint https://hf-mirror.com
```

---

## 🤝 贡献

1. Fork 本仓库
2. 添加资料到相应目录
3. 提交 Pull Request
4. 系统会自动分发大文件并更新网页

## 许可证

本项目收集的资料仅供学习使用。
