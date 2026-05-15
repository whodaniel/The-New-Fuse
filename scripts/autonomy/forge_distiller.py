import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")

def get_existing_indices():
    with open(KB_PATH, "r") as f:
        content = f.read()
        return [int(m) for m in re.findall(r"## #(\d+):", content)]

existing = get_existing_indices()
print(f"FORGE_CHECK: {len(existing)} indices already in Knowledge Base.")
print(f"LATEST_INDICES: {existing[-5:]}")
