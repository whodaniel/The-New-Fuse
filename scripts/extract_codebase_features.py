import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
MAP_PATH = os.path.join(PROJECT_ROOT, "apps", "frontend", "src", "data", "codebase_map.json")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "scripts", "native", "codebase_training_data.json")

def extract_features():
    print(f"[🧬] Extracting features from Codebase Map...")
    with open(MAP_PATH, 'r') as f:
        data = json.load(f)
    
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    
    # We want to map Node Label -> Relationships
    # This will be used to 'train' our synthesized weights
    training_data = []
    
    node_map = {n['id']: n for n in nodes}
    
    for edge in edges:
        source = node_map.get(edge['source'])
        target = node_map.get(edge['target'])
        
        if source and target:
            training_data.append({
                "source": source['data']['label'],
                "target": target['data']['label'],
                "type": edge.get('label', 'parent-child')
            })
            
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(training_data, f, indent=2)
        
    print(f"[✅] Extracted {len(training_data)} relationships to {OUTPUT_PATH}")

if __name__ == "__main__":
    extract_features()
