import json

with open("orphaned_pages.json", "r") as f:
    pages = json.load(f)

for page in pages:
    if "ResourceSearch" in page or "SkillsBrowser" in page or "WorkflowBrowser" in page or "AgentTemplatesBrowser" in page:
        print(f"FOUND EXACT: {page}")

