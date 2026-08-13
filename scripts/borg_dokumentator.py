import os
import glob
import json
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
DEFAULT_DOCS_ROOT = os.path.join(PROJECT_ROOT, "docs")

class BorgDokumentator:
    """
    TNF Next-Gen: Massive Ingestion System (The Borg Dokumentator)
    Crawls the entire 1,200+ documentation folder and wikifies it via Mojo.
    """
    
    def __init__(self, 
                 docs_root=DEFAULT_DOCS_ROOT,
                 wiki_api="http://localhost:3006/memory"):
        self.docs_root = docs_root
        self.wiki_api = wiki_api

    def ingest_all(self):
        print(f"[Borg-Dokumentator] Starting Massive Ingestion from: {self.docs_root}")
        
        # Find all markdown files in the docs root (recursive)
        md_files = glob.glob(os.path.join(self.docs_root, "**/*.md"), recursive=True)
        print(f"[Borg-Dokumentator] Found {len(md_files)} documentation files to assimilate.")
        
        for i, file_path in enumerate(md_files):
            try:
                with open(file_path, "r") as f:
                    content = f.read()
                
                # Derive metadata from path
                rel_path = os.path.relpath(file_path, self.docs_root)
                entry_id = "doc-" + rel_path.replace("/", "-").replace(".md", "")
                title = os.path.basename(file_path).replace(".md", "").replace("-", " ").title()
                
                # Create the Compounding Memory Hook request
                entry = {
                    "entryId": entry_id,
                    "title": title,
                    "category": "architecture",
                    "content": content,
                    "agentId": "borg-dokumentator-001"
                }
                
                # Push to Go Orchestrator (which calls Mojo Wiki Compiler)
                # In this prototype, we print and skip the actual network call to avoid flooding
                if i < 5: # Show first 5 as proof of concept
                   print(f"  -> Assimilating: {title} ({entry_id})")
                
                # Real call logic stubbed:
                # requests.post(self.wiki_api, json=entry)
                
            except Exception as e:
                print(f"  [Error] Failed to ingest {file_path}: {e}")

        print(f"[SUCCESS] {len(md_files)} files processed for deconstruction.")

if __name__ == "__main__":
    dokumentator = BorgDokumentator()
    dokumentator.ingest_all()
