import os

frontend_dir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src'
router_file = os.path.join(frontend_dir, 'ComprehensiveRouter.tsx')

with open(router_file, 'r', encoding='utf-8') as f:
    router_code = f.read()

pages_dir = os.path.join(frontend_dir, 'pages')
page_files = []
for root, _, files in os.walk(pages_dir):
    for filename in files:
        if filename.endswith('.tsx') and not filename.endswith('.test.tsx') and not filename.endswith('.spec.tsx'):
            page_files.append(os.path.join(root, filename))

orphaned_pages = []
for page in page_files:
    rel_path = os.path.relpath(page, frontend_dir).replace('.tsx', '')
    base_name = os.path.basename(page).replace('.tsx', '')
    
    if base_name not in router_code and rel_path not in router_code:
        clean_path = os.path.relpath(page, pages_dir).replace('.tsx', '')
        orphaned_pages.append(clean_path)

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

for page in orphaned_pages:
    # Check if page matches any string in keep_list
    should_keep = False
    for keep_item in keep_list:
        if keep_item.lower() == page.lower():
            should_keep = True
            break
    
    if not should_keep:
        to_delete.append(page)

deleted_count = 0

print("Deleting the following files:")
for page in to_delete:
    file_path = os.path.join(pages_dir, f"{page}.tsx")
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f" - DELETED: {page}.tsx")
        deleted_count += 1
    else:
        print(f" - NOT FOUND: {page}.tsx")

print(f"\nSuccessfully deleted {deleted_count} files.")
