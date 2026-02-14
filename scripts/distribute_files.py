#!/usr/bin/env python3
"""
自动分发脚本 v3.0
核心功能：
1. 扫描全项目文件
2. 大文件 (>50MB) -> 上传 HuggingFace -> 写入 .gitignore -> 从 Git 索引移除
3. 同步删除 (Sync Deletion)：清理 HuggingFace 上已在本地移除的文件
4. 生成带元数据的 data/file_manifest.json
"""
import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

# --- 配置 ---
SIZE_THRESHOLD = 50 * 1024 * 1024  # 50MB
HF_REPO_ID = "hfhfn/rec_sys_guide"
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# 排除目录
EXCLUDE_DIRS = {'.git', '.idea', '.vscode', 'venv', 'node_modules', '__pycache__', '.serena'}

def get_file_size(path):
    return path.stat().st_size

def run_git_cmd(args):
    """运行 git 命令，忽略错误"""
    try:
        subprocess.run(['git'] + args, cwd=PROJECT_ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def scan_files():
    large_files = []
    small_files = []
    
    print(f"🔍 正在扫描文件 (阈值: {SIZE_THRESHOLD/1024/1024:.0f}MB)...")
    
    for path in PROJECT_ROOT.rglob('*'):
        if not path.is_file():
            continue
            
        # 排除路径
        parts = path.relative_to(PROJECT_ROOT).parts
        if any(p.startswith('.') and p != '.gitignore' and p != '.gitattributes' for p in parts):
            continue
        if any(ex in parts for ex in EXCLUDE_DIRS):
            continue
            
        try:
            size = get_file_size(path)
            if size >= SIZE_THRESHOLD:
                large_files.append(path)
            else:
                small_files.append(path)
        except OSError:
            pass
            
    return large_files, small_files

def upload_to_hf(files):
    if not files:
        return
    
    print(f"\n🚀 正在上传 {len(files)} 个大文件到 HuggingFace ({HF_REPO_ID})...")
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        
        # 验证登录状态
        user = api.whoami()
        print(f"   已登录用户: {user['name']}")
        
        for file_path in files:
            rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
            print(f"   📤 上传: {rel_path} ({get_file_size(file_path)/1024/1024:.1f} MB)")
            
            api.upload_file(
                path_or_fileobj=str(file_path),
                path_in_repo=rel_path,
                repo_id=HF_REPO_ID,
                repo_type="dataset",
                commit_message=f"Upload large file: {os.path.basename(rel_path)}"
            )
        print("✅ 上传完成")
        return True
    except ImportError:
        print("❌ 错误: 未安装 huggingface_hub。请运行: pip install huggingface_hub")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 上传出错: {str(e)}")
        return False

def sync_deletion_on_hf(local_large_files):
    """同步删除 HuggingFace 上已在本地移除的文件"""
    print("\n🧹 正在同步删除 HuggingFace 上的冗余文件...")
    try:
        from huggingface_hub import HfApi, list_repo_files
        api = HfApi()
        
        # 获取远程文件列表
        remote_files = list_repo_files(repo_id=HF_REPO_ID, repo_type="dataset")
        local_rel_paths = {f.relative_to(PROJECT_ROOT).as_posix() for f in local_large_files}
        
        # 排除一些特殊文件，如 .gitattributes, README.md 等远程可能存在但脚本不管理的文件
        files_to_delete = []
        for rf in remote_files:
            if rf in local_rel_paths:
                continue
            
            # 如果远程文件在本地不存在，且不是核心配置文件，则标记删除
            # 注意：这里可以根据需要细化过滤规则
            if rf.endswith(('.gitattributes', 'README.md', '.gitignore')):
                continue
                
            files_to_delete.append(rf)
            
        if not files_to_delete:
            print("   ✨ 远程仓库已是最新，无需删除冗余文件。")
            return

        for rf in files_to_delete:
            print(f"   🗑️ 删除冗余文件: {rf}")
            api.delete_file(
                path_in_repo=rf,
                repo_id=HF_REPO_ID,
                repo_type="dataset",
                commit_message=f"Remove redundant file: {os.path.basename(rf)}"
            )
        print(f"✅ 同步删除完成 (共删除 {len(files_to_delete)} 个文件)")
        
    except Exception as e:
        print(f"⚠️ 同步删除出错: {str(e)}")

def update_gitignore_and_git(large_files):
    if not large_files:
        return

    print("\n🛡️  正在处理 Git 追踪及 .gitignore...")
    gitignore_path = PROJECT_ROOT / '.gitignore'
    
    # 始终清理旧的自动生成的规则区域并重新生成
    existing_content = []
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            existing_content = f.readlines()

    # 找到自动生成区域的起始位置
    header = "# [Auto] Large files managed by HuggingFace\n"
    new_content = []
    in_auto_section = False
    for line in existing_content:
        if line == header:
            in_auto_section = True
            continue
        if in_auto_section and line.strip() == "":
            in_auto_section = False
            # 保持空行，但标记区域结束
            continue
        if not in_auto_section:
            new_content.append(line)

    # 添加新规则
    new_rules = []
    for file_path in large_files:
        rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        new_rules.append(rel_path)
        # 从索引中移除
        run_git_cmd(['rm', '--cached', str(file_path)])

    # 写入文件
    with open(gitignore_path, 'w', encoding='utf-8') as f:
        f.writelines(new_content)
        if new_rules:
            if not new_content[-1].endswith('\n'):
                f.write('\n')
            f.write("\n" + header)
            for rule in sorted(new_rules):
                f.write(f"{rule}\n")
    
    print(f"   📝 已更新 .gitignore，包含 {len(new_rules)} 个大文件规则")

def generate_manifest(large_files):
    print("\n📋 生成增强型文件清单 (data/file_manifest.json)...")
    manifest = {
        "hf_repo_id": HF_REPO_ID,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "files": []
    }
    
    for file_path in large_files:
        rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        size_mb = get_file_size(file_path) / (1024 * 1024)
        hf_url = f"https://huggingface.co/datasets/{HF_REPO_ID}/resolve/main/{rel_path}"
        
        manifest["files"].append({
            "name": file_path.name,
            "path": rel_path,
            "extension": file_path.suffix.lower().lstrip('.'),
            "size_mb": round(size_mb, 2),
            "url": hf_url,
            "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        })
        
    manifest_dir = PROJECT_ROOT / 'data'
    manifest_dir.mkdir(exist_ok=True)
    
    with open(manifest_dir / 'file_manifest.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("✅ 清单生成完毕")

def main():
    # 1. 扫描
    large, small = scan_files()
    print(f"   -> 发现 {len(large)} 个大文件, {len(small)} 个小文件")
    
    # 2. 上传 HF
    if large:
        upload_to_hf(large)
        
        # 3. 同步删除冗余
        sync_deletion_on_hf(large)
        
        # 4. 处理 Git (移除追踪 + 更新 ignore)
        update_gitignore_and_git(large)
        
        # 5. 生成清单
        generate_manifest(large)
    else:
        print("🎉 没有发现大于 50MB 的文件。")
        # 即使没有大文件，也可能需要清理远程已经删除的文件
        sync_deletion_on_hf([])
        # 并且生成一个空的清单（或者保留结构）
        generate_manifest([])

    print("\n✅ 所有步骤完成！")
    print("👉 现在你可以放心地运行: git add . && git commit -m 'update' && git push")

if __name__ == "__main__":
    main()
