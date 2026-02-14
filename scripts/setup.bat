@echo off
REM Dual-Storage Setup Script v3.0 (Windows)
REM 环境检查 + 依赖安装 + 首次分发 (Windows)

setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ============================================
echo   GitHub + HuggingFace 自动分发系统 v3.0
echo ============================================
echo.

REM --- 1. 检查 Python ---
echo [1/5] 正在检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo   OK: %%i

REM --- 2. 安装依赖 ---
echo.
echo [2/5] 正在检查并安装依赖...
pip install -q "huggingface_hub>=0.17.0"
echo   OK: huggingface_hub 安装/更新完成

REM --- 3. HuggingFace 认证 ---
echo.
echo [3/5] HuggingFace 身份认证
if defined HF_TOKEN (
    echo   已检测到 HF_TOKEN 环境变量，跳过配置。
    goto :skip_hf_auth
)

python -c "from huggingface_hub import HfApi; HfApi().whoami()" >nul 2>&1
if not errorlevel 1 (
    echo   已通过 huggingface-cli 登录，跳过配置。
    goto :skip_hf_auth
)

echo   未检测到 HF 认证信息。
echo   a) 现在运行 huggingface-cli login 登录
echo   b) 跳过上传 (仅生成清单)
set /p hf_choice="  请选择 [a/b] (默认 b): "
if /i "%hf_choice%"=="a" (
    huggingface-cli login
) else (
    echo   已跳过认证。
)

:skip_hf_auth

REM --- 4. 运行分发逻辑 ---
echo.
echo [4/5] 正在执行文件分发与同步...
echo   说明：此操作将自动上传大文件并清理远程冗余文件。
cd /d "%~dp0.."
python scripts\distribute_files.py
echo   OK: 分发任务执行完成

REM --- 5. 提交并同步到 GitHub ---
echo.
echo [5/5] 正在提交更改到 Git...
git add .
git diff --cached --quiet
if errorlevel 1 (
    echo.
    set /p commit_msg="请输入提交信息 (直接回车默认: Auto: Initial v3.0 setup): "
    if "!commit_msg!"=="" set commit_msg=Auto: Initial v3.0 setup
    git commit -m "!commit_msg!"
    echo.
    echo 正在推送到 GitHub...
    git push origin main
    if errorlevel 1 (
        echo [ERROR] 推送至 GitHub 失败，请检查网络或权限。
    ) else (
        echo   OK: 全部分发与同步完成！
    )
) else (
    echo   无需提交，配置文件已是最新。
)

echo.
echo ============================================
echo   全部完成！您的双端存储系统已就绪。
echo ============================================
echo.
pause
