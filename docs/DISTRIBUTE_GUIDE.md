# 自动文件分发系统 — 详细指南

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│ 用户添加/修改文件并推送                                          │
│ git add . && git commit && git push origin main                 │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions 自动触发 (distribute-files.yml)                   │
│ - 检测 main 分支的 push                                         │
│ - 定期每周执行                                                  │
│ - 支持手动触发                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 执行分发脚本 (scripts/distribute_files.py)                       │
│ 1. 扫描所有 .pdf / .rar / .zip / .7z 等文件                     │
│ 2. 检查文件大小 (阈值: 50MB)                                    │
└──────────────┬──────────────────────────┬───────────────────────┘
               ↓                          ↓
    ┌──────────────────┐      ┌─────────────────────┐
    │  大文件 (>50MB)   │      │  小文件 (<50MB)      │
    │   - PDF 论文      │      │  - 文档说明          │
    │   - 压缩包        │      │  - 代码示例          │
    └────────┬─────────┘      └────────┬────────────┘
             ↓                         ↓
    ┌──────────────────┐      ┌─────────────────────┐
    │ HuggingFace      │      │ GitHub Repository   │
    │ Datasets (无限)  │      │ (标准 Git 管理)     │
    └────────┬─────────┘      └────────┬────────────┘
             │                         │
             └────────────┬────────────┘
                          ↓
             ┌─────────────────────────┐
             │ file_manifest.json      │
             │ (自动生成的文件清单)     │
             └────────────┬────────────┘
                          ↓
             ┌─────────────────────────┐
             │ GitHub Pages            │
             │ index.html 动态渲染     │
             │ → 搜索 / 浏览 / 下载    │
             └─────────────────────────┘
```

---

## 前置准备

### 环境要求

- Git 2.30+
- Python 3.8+
- GitHub 账户（已有仓库 `hfhfn/rec_sys_guide`）
- HuggingFace 账户（用户名 `hfhfn`）

### 安装依赖

```bash
pip install huggingface_hub
```

---

## 配置步骤

### 1. HuggingFace 认证

```bash
# 方式1：临时设置（当前终端有效）
# Linux/macOS
export HF_TOKEN=your_token_here
# Windows PowerShell
$env:HF_TOKEN="your_token_here"

# 方式2：永久登录
huggingface-cli login
```

### 2. GitHub Actions Secrets

在仓库 Settings → Secrets and variables → Actions 中添加：

| Secret        | 值                              |
| ------------- | ------------------------------- |
| `HF_TOKEN`    | HuggingFace Token（write 权限） |
| `HF_USERNAME` | `hfhfn`                         |

### 3. 脚本参数（通常不需要修改）

`scripts/distribute_files.py` 中的默认配置：

```python
SIZE_THRESHOLD = 50 * 1024 * 1024          # 50MB 阈值
HF_REPO_ID = "hfhfn/rec_sys_guide"        # HF 数据集 ID
GITHUB_PAGES_URL = "https://hfhfn.github.io/rec_sys_guide"
```

### 4. index.html 配置（通常不需要修改）

```javascript
const username = "hfhfn"; // GitHub 用户名
const repo = "rec_sys_guide"; // 仓库名称
const branch = "main"; // 分支名称
```

---

## 使用方式

### 自动触发

GitHub Actions 在以下情况自动运行：

- **推送代码**：向 main 分支推送时（推荐相关目录变更时）
- **手动触发**：GitHub Actions 页面点击 "Run workflow"
- **定期运行**：每周日 0:00 UTC

### 手动运行

```bash
python scripts/distribute_files.py
```

输出示例：

```
🔍 分析文件分类...

📊 文件统计:
  大文件（>50MB）: 42
  小文件（<50MB）: 18

📦 大文件列表:
  - 推荐算法/极客时间-推荐系统三十六式/01.pdf (125.34MB)
  ...

📤 上传 42 个大文件到 HuggingFace...
  上传: 推荐算法/01.pdf
  ...

✅ 成功上传 42/42 个文件
✅ 下载清单已生成: data/file_manifest.json
```

---

## 文件清单格式

`data/file_manifest.json` 示例：

```json
{
  "hf_repo_id": "hfhfn/rec_sys_guide",
  "files": [
    {
      "name": "01.pdf",
      "path": "推荐算法/极客时间/01.pdf",
      "size_mb": 125.34,
      "url": "https://huggingface.co/datasets/hfhfn/rec_sys_guide/resolve/main/推荐算法/极客时间/01.pdf"
    }
  ]
}
```

---

## 高级配置

### 自定义文件类型

编辑 `scripts/distribute_files.py`：

```python
LARGE_FILE_TYPES = {
    '.pdf', '.rar', '.zip', '.7z',      # 压缩和文档
    '.tar.gz', '.iso',                   # 其他大文件
    '.mp4', '.mkv', '.avi',              # 视频
    '.mp3', '.wav',                      # 音频
    '.tar', '.gz'                        # 压缩包
}
```

### 自定义排除规则

```python
def categorize_files(root_dir=PROJECT_ROOT):
    for item in Path(root_dir).rglob('*'):
        if item.is_file():
            # 跳过隐藏文件夹
            if any(part.startswith('.') for part in item.parts):
                continue
            # 跳过特定目录
            if 'node_modules' in item.parts or 'venv' in item.parts:
                continue
```

### 国内镜像加速

如果 HuggingFace 下载慢，可以使用镜像：

```bash
# 命令行下载使用镜像
huggingface-cli download hfhfn/rec_sys_guide --repo-type dataset --local-dir ./data --endpoint https://hf-mirror.com
```

在 `index.html` 中替换 URL（可选）：

```javascript
const hfUrl = file.url.replace("huggingface.co", "hf-mirror.com");
```

---

## 关键文件说明

| 文件                                     | 说明                   | 更新方式             |
| ---------------------------------------- | ---------------------- | -------------------- |
| `.github/workflows/distribute-files.yml` | GitHub Actions 工作流  | 手动（一次性配置）   |
| `scripts/distribute_files.py`            | 文件分发逻辑           | 手动（按需调整）     |
| `data/file_manifest.json`                | 文件清单（含 HF 链接） | 自动（每次分发）     |
| `.gitignore`                             | 排除大文件             | 自动（每次分发追加） |
| `index.html`                             | GitHub Pages 网页      | 自动（动态加载清单） |

---

## 故障排查

### 文件未在网页中显示

```bash
# 检查 file_manifest.json 是否存在
ls data/file_manifest.json          # Linux/macOS
dir data\file_manifest.json         # Windows

# 确认 GitHub Pages 已启用
# Settings → Pages → 选择 main 分支
```

### HuggingFace 上传失败

```bash
# 验证 token
huggingface-cli whoami

# 验证数据集权限（应该是 public）
huggingface-cli repo info hfhfn/rec_sys_guide --repo-type dataset
```

### GitHub Actions 运行失败

1. 检查 `HF_TOKEN` 是否正确设置
2. 确认 HF Token 有 "write" 权限
3. 确认 HF 数据集是公开的
4. 查看 Actions → Workflow run → 详细日志

### 部署检查清单

```
前置准备
☐ Python 3.8+ 已安装
☐ huggingface_hub 已安装

HuggingFace 配置
☐ 账户已创建
☐ 数据集已创建（公开）
☐ Token 已生成（write 权限）

GitHub 配置
☐ Secrets 已添加 (HF_TOKEN, HF_USERNAME)
☐ GitHub Pages 已启用
☐ .github/workflows/ 文件已提交

验证
☐ GitHub Actions 运行成功
☐ HuggingFace 收到文件
☐ file_manifest.json 已生成
☐ GitHub Pages 正常显示
☐ 所有下载链接有效
```

---

## 更多资源

- [HuggingFace 官方文档](https://huggingface.co/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Issues](https://github.com/hfhfn/rec_sys_guide/issues)
