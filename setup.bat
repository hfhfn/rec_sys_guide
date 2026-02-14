@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ============================================
echo   rec_sys_guide - Setup
echo   Architecture: v4.1 (Autostash Optimized)
echo ============================================
echo.

:: 1. Check Python
echo [1/7] Checking Python...
python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Python not found. Install Python 3.8+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo   OK: %%i

:: 2. Check Dependencies
echo.
echo [2/7] Checking Dependencies...
python -c "import huggingface_hub" >nul 2>&1
if !errorlevel! neq 0 (
    echo   Installing huggingface_hub...
    pip install -q "huggingface_hub>=0.17.0"
) else (
    echo   OK: huggingface_hub is installed
)

:: 3. HuggingFace Authentication
echo.
echo [3/7] HuggingFace Authentication
if defined HF_TOKEN (
    echo   HF_TOKEN environment variable detected, skipping auth.
    goto :skip_hf_auth
)

python -c "from huggingface_hub import HfApi; HfApi().whoami()" >nul 2>&1
if !errorlevel! equ 0 (
    echo   Already logged in via huggingface-cli, skipping auth.
    goto :skip_hf_auth
)

echo   No HF authentication detected.
echo   a) Run huggingface-cli login now
echo   b) Skip upload (generate manifest only)
set /p hf_choice="  Choose [a/b] (default b): "
if /i "!hf_choice!"=="a" (
    huggingface-cli login
) else (
    echo   Skipped authentication.
)

:skip_hf_auth

:: 4. Sync Remote (Architecture v4.1: Autostash mode)
echo.
echo [4/7] Syncing Remote (git pull --rebase --autostash)...
git pull --rebase --autostash origin main
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Sync failed. Resolve conflicts manually: git rebase --abort
    pause
    exit /b 1
) else (
    echo   OK: Synced successfully
)

:: 5. Run Distribution
echo.
echo [5/7] Running Distribution Script...
cd /d "%~dp0"
python scripts\distribute_files.py
if !errorlevel! neq 0 (
    echo [WARNING] Distribution had errors.
)

:: 6. Local Commit
echo.
echo [6/7] Preparing Commit...
git add .
git diff --cached --quiet
if !errorlevel! neq 0 (
    echo   Changes detected.
    set /p commit_msg="  Enter message (default: Auto update): "
    if "!commit_msg!"=="" set commit_msg=Auto update
    git commit -m "!commit_msg!"
    echo   OK: Committed locally
) else (
    echo   OK: No changes to commit
)

:: 7. Push to GitHub
echo.
echo [7/7] Pushing to GitHub...
git push origin main
if !errorlevel! neq 0 (
    echo [WARNING] Push failed. Retry: git push origin main
) else (
    echo   OK: Push successful
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
pause
