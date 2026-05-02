import os
import re

KB_PATH = "/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/AI_Knowledge_Base.md"

def get_existing_indices():
    with open(KB_PATH, "r") as f:
        content = f.read()
        return [int(m) for m in re.findall(r"## #(\d+):", content)]

existing = get_existing_indices()
print(f"FORGE_CHECK: {len(existing)} indices already in Knowledge Base.")
print(f"LATEST_INDICES: {existing[-5:]}")
