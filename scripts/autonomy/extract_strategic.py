import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")

def extract_strategic():
    if not os.path.exists(KB_PATH):
        return []
    
    with open(KB_PATH, "r") as f:
        content = f.read()
    
    sections = content.split("---")
    strategic_insights = []
    
    for sec in sections:
        match = re.search(r"## #(\d+): (.*)", sec)
        if not match: continue
        idx = match.group(1)
        title = match.group(2)
        
        # Extract Strategic Insight
        insight_match = re.search(r"- \*\*Strategic:\*\* (.*)", sec)
        if insight_match:
            strategic_insights.append({
                "index": idx,
                "title": title.strip(),
                "insight": insight_match.group(1).strip()
            })
            
    return strategic_insights

if __name__ == "__main__":
    insights = extract_strategic()
    for item in insights:
        print(f"STRATEGIC_ITEM|{item['index']}|{item['title']}|{item['insight']}")
