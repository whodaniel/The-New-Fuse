import os, json

with open("orphaned_pages.json", "r") as f:
    pages = json.load(f)

keep_list = [
    "TNFCommandCenter",
    "FairtableDashboard", 
    "Tasks/Calendar",
    "Home",
    "AgentsListPage",
    "GeneralSettingsPage",
    "ComponentsNav",
    "ResourceSearch",
    "SkillsBrowser",
    "WorkflowBrowser",
    "AgentTemplatesBrowser",
    "auth/GitHubCallback",
    "MemoryInspector",
    "dashboard/CreateAgent"
]

to_delete = []

for page in pages:
    # Check if page matches any string in keep_list
    should_keep = False
    for keep_item in keep_list:
        if keep_item.lower() == page.lower():
            should_keep = True
            break
    
    if not should_keep:
        to_delete.append(page)

base_dir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/pages'
deleted_count = 0

print("Deleting the following files:")
for page in to_delete:
    file_path = os.path.join(base_dir, f"{page}.tsx")
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f" - DELETED: {page}.tsx")
        deleted_count += 1
    else:
        print(f" - NOT FOUND: {page}.tsx")

print(f"\nSuccessfully deleted {deleted_count} files.")
