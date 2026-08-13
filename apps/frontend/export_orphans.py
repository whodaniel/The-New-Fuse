import os, json

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
        orphaned_pages.append(os.path.relpath(page, pages_dir))

orphaned_pages.sort()

with open('orphaned_pages.json', 'w') as f:
    json.dump(orphaned_pages, f, indent=2)

print(f"Exported {len(orphaned_pages)} orphaned pages to orphaned_pages.json")
