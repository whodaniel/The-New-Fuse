import os
import json
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
WIKI_DIR = os.path.join(PROJECT_ROOT, "packages", "compounding-memory", "wiki")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "data", "memory-graph.json")

def generate_graph():
    if not os.path.exists(WIKI_DIR):
        print(f"[Viz] Wiki dir not found: {WIKI_DIR}")
        return

    nodes = []
    links = []
    
    # Track categories to create clusters
    categories = {}
    
    # 1. Parse all Markdown files
    files = [f for f in os.listdir(WIKI_DIR) if f.endswith(".md") and f != "INDEX.md"]
    
    for file_name in files:
        file_path = os.path.join(WIKI_DIR, file_name)
        entry_id = file_name.replace(".md", "")
        
        with open(file_path, "r") as f:
            content = f.read()
            
        # Extract title (first H1)
        title_match = re.search(r"^# (.*)", content)
        title = title_match.group(1) if title_match else entry_id
        
        # Extract category
        cat_match = re.search(r"\*\*Category:\*\* (.*)", content)
        category = cat_match.group(1) if cat_match else "General"
        
        if category not in categories:
            categories[category] = []
            
        categories[category].append({
            "id": entry_id,
            "content": title,
            "metadata": {
                "confidence": 1.0,
                "source": "wiki"
            }
        })
        
        # Extract backlinks [[link]]
        backlinks = re.findall(r"\[\[(.*?)\]\]", content)
        for link in backlinks:
            links.append({
                "source": entry_id,
                "target": link,
                "value": 0.8
            })

    # 2. Format for MemoryVisualizer (clusters array)
    cluster_data = []
    for cat_name, items in categories.items():
        cluster_data.append({
            "id": f"cluster_{cat_name.lower()}",
            "label": cat_name,
            "items": items
        })

    # Save to data directory
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(cluster_data, f, indent=2)
        
    print(f"[Viz] Memory graph updated: {len(files)} entries, {len(cluster_data)} clusters.")

if __name__ == "__main__":
    generate_graph()
