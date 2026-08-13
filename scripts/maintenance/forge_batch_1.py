import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

TRANSCRIPTS_DIR = os.path.join(KB_ROOT, "video-transcripts")
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")

def get_transcripts():
    files = sorted([f for f in os.listdir(TRANSCRIPTS_DIR) if f.endswith(".txt")])
    return files

def get_existing_indices():
    with open(KB_PATH, "r") as f:
        return set(int(m) for m in re.findall(r"## #(\d+):", f.read()))

transcripts = get_transcripts()
existing = get_existing_indices()

# Filter for transcripts not in KB
pending = []
for f in transcripts:
    idx_match = re.search(r"(\d+)_", f)
    if idx_match:
        idx = int(idx_match.group(1))
        if idx not in existing:
            pending.append((idx, f))

# Output first 5 for the agent to process
for idx, name in pending[:5]:
    print(f"FORGE_TARGET: {idx} | {name}")
