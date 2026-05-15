import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

LIBRARY_PATH = os.path.join(KB_ROOT, "video-library", "ai_video_library.html")
VAULT_PATH = os.path.join(KB_ROOT, "consolidated_ai_knowledge.md")
TRANSCRIPTS_DIR = os.path.join(KB_ROOT, "video-transcripts")
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")

def get_existing_indices():
    with open(KB_PATH, "r") as f:
        return set(int(m) for m in re.findall(r"## #(\d+):", f.read()))

def get_library_map():
    with open(LIBRARY_PATH, "r") as f:
        content = f.read()
    
    # Extract index, url, title
    # Example: <td class="index-col">1</td> ... <a href="URL">TITLE</a>
    matches = re.findall(r'<td class="index-col">(\d+)</td>.*?<a href="(.*?)" target="_blank">(.*?)</a>', content, re.DOTALL)
    lib_map = {}
    for idx, url, title in matches:
        lib_map[int(idx)] = {"url": url, "title": title}
    return lib_map

def get_vault_content():
    with open(VAULT_PATH, "r") as f:
        return f.read()

def find_in_vault(vault_content, title, url):
    # Vault entries usually start with "# Title" and contain "**URL:** URL"
    # We'll use a more flexible search
    sections = vault_content.split("# ")
    for sec in sections:
        if url in sec or title[:50] in sec:
            return sec.strip()
    return None

def find_raw_transcript(idx):
    for f in os.listdir(TRANSCRIPTS_DIR):
        if f.startswith(f"{idx}_") or f.startswith(f"transcript_{idx}_"):
            with open(os.path.join(TRANSCRIPTS_DIR, f), "r") as tf:
                return tf.read()
    return None

existing = get_existing_indices()
lib_map = get_library_map()
vault_content = get_vault_content()

pending = sorted([idx for idx in lib_map.keys() if idx not in existing])

batch_size = 10
batch = pending[:batch_size]

print(f"FORGE_BATCH_START: Processing indices {batch}")

for idx in batch:
    item = lib_map[idx]
    title = item["title"]
    url = item["url"]
    
    # Priority 1: Raw Transcript
    content = find_raw_transcript(idx)
    source = "RAW"
    
    # Priority 2: Vault Summary
    if not content:
        content = find_in_vault(vault_content, title, url)
        source = "VAULT"
        
    if content:
        print(f"---BATCH_ITEM_START---")
        print(f"INDEX: {idx}")
        print(f"TITLE: {title}")
        print(f"URL: {url}")
        print(f"SOURCE: {source}")
        print(f"CONTENT_PREVIEW: {content[:500]}...")
        print(f"---BATCH_ITEM_END---")
    else:
        print(f"MISSING: Index {idx} ({title}) not found in Vault or Transcripts.")
