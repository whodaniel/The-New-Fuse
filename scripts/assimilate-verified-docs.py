import os
import re
import json
from signature_wrapper import A2ASignatureWrapper

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
WIKI_DIR = os.path.join(PROJECT_ROOT, "packages/compounding-memory/wiki")
WIKI_INBOX = os.path.join(PROJECT_ROOT, "data/wiki-inbox")
DOCS_INDEX = os.path.join(PROJECT_ROOT, "DOCUMENTATION_INDEX.md")

def assimilate_docs():
    print("🧬 [Assimilator] Starting Doc-to-Wiki Rebirth...")
    
    if not os.path.exists(DOCS_INDEX):
        print(f"❌ Docs index not found: {DOCS_INDEX}")
        return

    with open(DOCS_INDEX, "r") as f:
        content = f.read()

    # Extract all links [Title](./docs/file.md)
    links = re.findall(r"\[(.*?)\]\(\.(.*?)\)", content)
    
    # Initialize DACC-v1 Signer
    signer = A2ASignatureWrapper("AGENT-DOC-ASSIMILATOR", "sovereign-secret")

    for title, rel_path in links:
        abs_path = os.path.abspath(os.path.join(PROJECT_ROOT, rel_path.lstrip("/")))
        
        if not os.path.exists(abs_path):
            print(f"⚠️ Skipping missing doc: {abs_path}")
            continue

        print(f"📥 Assimilating: {title} ({rel_path})")
        
        with open(abs_path, "r") as f:
            doc_content = f.read()

        # Create Compounding Log Entry
        entry_id = "doc-" + re.sub(r'[^a-z0-9]', '-', title.lower())
        
        entry = {
            "id": entry_id,
            "title": f"Verified Doc: {title}",
            "category": "verified-documentation",
            "content": doc_content,
            "backlinks": ["documentation-index", "sovereign-state"],
            "metadata": {
                "source_path": rel_path,
                "agentId": "AGENT-DOC-ASSIMILATOR",
                "timestamp": os.path.getmtime(abs_path)
            }
        }

        # Save to Wiki Inbox for the Borg Architect to compile
        inbox_path = os.path.join(WIKI_INBOX, f"{entry_id}.json")
        os.makedirs(WIKI_INBOX, exist_ok=True)
        
        with open(inbox_path, "w") as f:
            json.dump(entry, f, indent=2)
            
    print(f"✅ [Assimilator] Sent {len(links)} docs to the Wiki Inbox.")

if __name__ == "__main__":
    assimilate_docs()
