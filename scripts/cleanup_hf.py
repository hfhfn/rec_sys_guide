import sys
from huggingface_hub import HfApi

REPO_ID = "hfhfn/rec_sys_guide"
TOKEN = "hf_JpWlJvFkGqZzKqZzKqZzKqZzKqZzKqZz"  # 占位，实际会读取环境

def cleanup_hf():
    print(f"🧹 开始清理 HuggingFace 仓库: {REPO_ID}")
    try:
        api = HfApi()
        # 列出所有文件
        files = api.list_repo_files(repo_id=REPO_ID, repo_type="dataset")
        
        # 找出错误的文件（包含反斜杠 \ 的文件，说明是错误的 Windows 路径上传）
        files_to_delete = [f for f in files if "\\" in f]
        
        if not files_to_delete:
            print("✅ 未发现带反斜杠的错误文件，仓库很干净。")
            return

        print(f"⚠️  发现 {len(files_to_delete)} 个错误文件（应删除）:")
        for f in files_to_delete:
            print(f"  - {f}")
            
        confirm = input("\n确认删除这些文件吗？(y/n): ")
        if confirm.lower() != 'y':
            print("已取消。")
            return

        print("\n🗑️  正在删除...")
        commit_info = api.delete_file(
            path_in_repo=files_to_delete,
            repo_id=REPO_ID,
            repo_type="dataset",
            commit_message="Cleanup: remove incorrectly named files with backslashes"
        )
        print("✅ 清理完成！")
        
    except Exception as e:
        print(f"❌ 出错: {e}")
        print("提示: 确保你已登录 (huggingface-cli login) 或设置了 HF_TOKEN")

if __name__ == "__main__":
    cleanup_hf()
