import os
import re
from collections import Counter

# Configuration
frontend_dir = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src'
ignore_pattern = re.compile(r'@ts-ignore|@ts-nocheck')
import_pattern = re.compile(r'from\s+[\'"]([^\'"]+)[\'"]')

# 1. Map all files with @ts-ignore
ignored_files = []
for root, _, files in os.walk(frontend_dir):
    for filename in files:
        if filename.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if ignore_pattern.search(content):
                        # Get relative path for clean display
                        rel_path = os.path.relpath(filepath, frontend_dir)
                        ignored_files.append(rel_path)
            except Exception:
                continue

# 2. Score them by how often they are imported by other files
# This helps identify "foundation" files that break many things
import_scores = Counter()
for root, _, files in os.walk(frontend_dir):
    for filename in files:
        if filename.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    # Very basic absolute/relative heuristic resolver
                    for match in import_pattern.findall(f.read()):
                        # We just want to know if 'match' matches one of our ignored files
                        # (this is an approximation without full path resolution)
                        for target in ignored_files:
                            target_base = os.path.basename(target).replace('.tsx', '').replace('.ts', '')
                            if match.endswith(target_base):
                                import_scores[target] += 1
            except Exception:
                continue

# 3. Sort by score
# If multiple have same score, sort alphabetically
sorted_strike_list = sorted(ignored_files, key=lambda x: (import_scores[x], x), reverse=True)

print("--- 🎯 TOP 10 CRITICAL TYPESCRIPT DEBT TARGETS ---")
print("| Rank | Imports | File Path |")
print("|---|---|---|")
for i, file in enumerate(sorted_strike_list[:10], 1):
    score = import_scores[file]
    print(f"| {i} | {score} | `{file}` |")
