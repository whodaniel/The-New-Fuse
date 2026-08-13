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

orphaned_pages.sort()

md = "# 🛡️ Agent Beta: Dead Code & Orphaned Page Audit\n\n"
md += "This document lists the 48 orphaned pages. Agent Beta has exposed them via the `debug/orphans` route. **Please review each one and leave your comments.**\n\n"
md += "You can reach the main index of these pages at: http://localhost:5173/debug/orphans\n\n"

md += "All pages are exposed at `/debug/orphans/:path` where `:path` is the lowercase name below.\n\n"

md += "| Page Path | Keep? | User Comment / Action |\n"
md += "|---|---|---|\n"

for page in orphaned_pages:
    md += f"| `src/pages/{page}.tsx` | [ ] | |\n"

with open("/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/orphaned_pages_audit.md", "w") as f:
    f.write(md)

print("Generated orphaned_pages_audit.md successfully.")
