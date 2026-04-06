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
        # Save relative to pages/
        clean_path = os.path.relpath(page, pages_dir).replace('.tsx', '')
        orphaned_pages.append(clean_path)

orphaned_pages.sort()

router_out = os.path.join(frontend_dir, 'routers', 'OrphanAuditRouter.tsx')

# Generate the Router Component
imports = ["import { lazy, Suspense } from 'react';\nimport { Route, Routes, Link } from 'react-router-dom';\n"]
routes = []
list_items = []

for i, page in enumerate(orphaned_pages):
    comp_name = f"OrphanPage{i}"
    # page looks like "IDE/TheiaIDE" or "Home"
    imports.append(f"const {comp_name} = lazy(() => import('../pages/{page}').catch(() => ({{ default: () => <div>Failed to load {page}</div> }})));")
    
    url_path = page.lower()
    routes.append(f'      <Route path="{url_path}" element={{<{comp_name} />}} />')
    list_items.append(f'        <li><Link to="/debug/orphans/{url_path}" className="text-blue-500 hover:underline">{page}</Link></li>')

router_content = """// AUTO-GENERATED: Temporary router to audit orphaned components
""" + "\n".join(imports) + """

const OrphanIndex = () => (
  <div className="p-8 font-sans">
    <h1 className="text-2xl font-bold mb-4">Orphaned Pages Audit List ({count})</h1>
    <p className="mb-4 text-gray-600">The following components exist in <code className="bg-gray-100 p-1">src/pages</code> but are not wired in the ComprehensiveRouter. Click each to view in isolation.</p>
    <ul className="list-disc pl-5 space-y-1">
""".replace('{count}', str(len(orphaned_pages))) + "\n".join(list_items) + """
    </ul>
  </div>
);

export const OrphanAuditRouter = () => {
  return (
    <Suspense fallback={<div className="p-8">Loading orphaned component...</div>}>
      <Routes>
        <Route path="/" element={<OrphanIndex />} />
""" + "\n".join(routes) + """
      </Routes>
    </Suspense>
  );
};

export default OrphanAuditRouter;
"""

with open(router_out, 'w', encoding='utf-8') as f:
    f.write(router_content)

print(f"Generated OrphanAuditRouter.tsx with {len(orphaned_pages)} routes.")
