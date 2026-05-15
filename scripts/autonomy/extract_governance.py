import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")

def extract_governance():
    if not os.path.exists(KB_PATH):
        return []
    
    with open(KB_PATH, "r") as f:
        content = f.read()
    
    sections = content.split("---")
    gov_insights = []
    
    for sec in sections:
        match = re.search(r"## #(\d+): (.*)", sec)
        if not match: continue
        idx = match.group(1)
        title = match.group(2)
        
        # Extract Governance Insight
        insight_match = re.search(r"- \*\*Governance:\*\* (.*)", sec)
        if insight_match:
            gov_insights.append({
                "index": idx,
                "title": title.strip(),
                "insight": insight_match.group(1).strip()
            })
            
    return gov_insights

if __name__ == "__main__":
    insights = extract_governance()
    for item in insights:
        print(f"GOV_ITEM|{item['index']}|{item['title']}|{item['insight']}")
