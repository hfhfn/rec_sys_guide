@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo.
echo ============================================
echo   rec_sys_guide - Setup
echo   Architecture: v4.3 (Long Paths + Gitignore Escaping)
echo ============================================
echo.

:: 1. Check Python
echo [1/9] Checking Python...
python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Python not found. Install Python 3.8+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo   OK: %%i

:: 2. Check Dependencies
echo.
echo [2/9] Checking Dependencies...
python -c "import huggingface_hub" >nul 2>&1
if !errorlevel! neq 0 (
    echo   Installing huggingface_hub...
    pip install -q "huggingface_hub>=0.17.0"
) else (
    echo   OK: huggingface_hub is installed
)

:: 3. HuggingFace Authentication
echo.
echo [3/9] HuggingFace Authentication
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

:: 4. Enable long paths (Windows MAX_PATH 260 fix)
echo.
echo [4/9] Enabling Git long paths...
git config core.longpaths true
echo   OK: core.longpaths enabled

:: 5. Sync Remote (Architecture v4.1: Autostash mode)
echo.
echo [5/9] Syncing Remote (git pull --rebase --autostash)...
git pull --rebase --autostash origin main
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Sync failed. Resolve conflicts manually: git rebase --abort
    pause
    exit /b 1
) else (
    echo   OK: Synced successfully
)

:: 6. Ensure .nojekyll exists
echo.
echo [6/9] Checking .nojekyll...
if not exist "%~dp0.nojekyll" (
    type nul > "%~dp0.nojekyll"
    echo   Created .nojekyll
) else (
    echo   OK: .nojekyll exists
)

:: 7. Run Distribution
echo.
echo [7/9] Running Distribution Script...
cd /d "%~dp0"
python scripts\distribute_files.py
if !errorlevel! neq 0 (
    echo [WARNING] Distribution had errors.
)

:: 8. Local Commit
echo.
echo [8/9] Preparing Commit...
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

:: 9. Push to GitHub
echo.
echo [9/9] Pushing to GitHub...
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
