import os
import time
import shutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import sys
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
if SCRIPT_DIR not in sys.path:
    sys.path.append(SCRIPT_DIR)
from signature_wrapper import A2ASignatureWrapper
import json
import re

# Configuration
DOCS_DIR = os.path.join(PROJECT_ROOT, "docs")
WIKI_INBOX = os.path.join(PROJECT_ROOT, "data/wiki-inbox")
AGENT_ID = "AGENT-DOC-WATCHER"
SECRET = "sovereign-secret"

class DocSyncHandler(FileSystemEventHandler):
    def __init__(self):
        self.signer = A2ASignatureWrapper(AGENT_ID, SECRET)

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            self.process_doc(event.src_path)

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            self.process_doc(event.src_path)

    def process_doc(self, abs_path):
        rel_path = os.path.relpath(abs_path, PROJECT_ROOT)
        print(f"[Doc-Watcher] 📄 Change detected: {rel_path}")
        
        try:
            with open(abs_path, "r") as f:
                content = f.read()

            title_match = re.search(r"^# (.*)", content)
            title = title_match.group(1) if title_match else os.path.basename(abs_path)
            
            entry_id = "doc-" + re.sub(r'[^a-z0-9]', '-', title.lower())
            
            entry_data = {
                "id": entry_id,
                "title": f"Live Doc: {title}",
                "category": "living-documentation",
                "content": content,
                "backlinks": ["documentation-index", "sovereign-state"],
                "metadata": {
                    "source_path": rel_path,
                    "agentId": AGENT_ID,
                    "timestamp": os.path.getmtime(abs_path)
                }
            }

            handoff = self.signer.wrap("COMPOUNDING_LOG_ENTRY", entry_data)
            
            # Save to Wiki Inbox
            os.makedirs(WIKI_INBOX, exist_ok=True)
            with open(os.path.join(WIKI_INBOX, f"{entry_id}.json"), "w") as f:
                json.dump(handoff, f, indent=2)
            
            print(f"[Doc-Watcher] ✅ Forwarded to Wiki Inbox: {entry_id}")
        except Exception as e:
            print(f"[Doc-Watcher] ❌ Error processing {rel_path}: {str(e)}")

def start_watching():
    print(f"[Doc-Watcher] 🧐 Monitoring docs for changes in: {DOCS_DIR}")
    event_handler = DocSyncHandler()
    observer = Observer()
    observer.schedule(event_handler, DOCS_DIR, recursive=True)
    # Also watch root MD files
    observer.schedule(event_handler, PROJECT_ROOT, recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    start_watching()
