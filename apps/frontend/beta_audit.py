import os, re, glob

frontend_dir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src'
router_file = os.path.join(frontend_dir, 'ComprehensiveRouter.tsx')

with open(router_file, 'r', encoding='utf-8') as f:
    router_code = f.read()

print("--- PHASE 1: ORPHANED PAGE COMPONENTS ---")
pages_dir = os.path.join(frontend_dir, 'pages')
page_files = []
for root, _, files in os.walk(pages_dir):
    for filename in files:
        if filename.endswith('.tsx') and not filename.endswith('.test.tsx') and not filename.endswith('.spec.tsx'):
            page_files.append(os.path.join(root, filename))

orphaned_pages = []
for page in page_files:
    # Check if this page is imported in ComprehensiveRouter
    # The route might be lazy loaded or directly imported
    # E.g. import { HomePage } from './pages/HomePage';
    # Or const HomePage = lazy(() => import('./pages/HomePage'));
    rel_path = os.path.relpath(page, frontend_dir).replace('.tsx', '')
    base_name = os.path.basename(page).replace('.tsx', '')
    
    # Just a simple check if the basename or rel_path occurs in the router code
    if base_name not in router_code and rel_path not in router_code:
        orphaned_pages.append(os.path.relpath(page, frontend_dir))

print(f"Found {len(orphaned_pages)} potentially orphaned pages.")
for p in orphaned_pages[:10]:
    print(" -", p)
if len(orphaned_pages) > 10: print("   ...")

print("\n--- PHASE 1: DEPRECATED COMPONENTS ---")
check_deprecated = [
    'components/nav-menu.tsx',
    'components/MobileNav.tsx',
    'pages/Landing.tsx',
    'pages/LandingPage.tsx',
    'pages/LandingRedesigned.tsx'
]
for p in check_deprecated:
    full_p = os.path.join(frontend_dir, p)
    if os.path.exists(full_p):
        print(f"EXISTS: {p}")
    else:
        print(f"REMOVED: {p}")

print("\n--- PHASE 2: DESIGN SYSTEM COHESION ---")
print("Scanning for raw hex colors outside design system in pages/")
hex_regex = re.compile(r'#[0-9a-fA-F]{3,6}\b')
hex_violations = 0
for page in page_files:
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
        hexes = hex_regex.findall(content)
        # Filter out common safe ones like #fff
        hexes = [h for h in hexes if str(h).lower() not in ['#fff', '#ffffff', '#000', '#000000']]
        if hexes:
            hex_violations += 1

print(f"Files with hardcoded hex colors (potential design system violations): {hex_violations}")

print("\n--- PHASE 5: TYPESCRIPT HEALTH CHECK ---")
tsignoring = 0
for root, _, files in os.walk(frontend_dir):
    for filename in files:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            path = os.path.join(root, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if '@ts-nocheck' in content or '@ts-ignore' in content:
                    tsignoring += 1
print(f"Files with @ts-ignore or @ts-nocheck: {tsignoring}")
