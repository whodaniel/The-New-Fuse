import re
import os

KB_PATH = "/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/AI_Knowledge_Base.md"

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
