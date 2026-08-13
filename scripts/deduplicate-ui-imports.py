import os
import re

def deduplicate_imports(filepath):
    if not filepath.endswith(('.tsx', '.ts')):
         return

    with open(filepath, 'r') as f:
        lines = f.readlines()

    ui_imports = []
    other_lines = []
    
    # Simple deduplication for '@/components/ui'
    for line in lines:
        if "@/components/ui" in line and "import {" in line:
            # Extract parts: import { A, B } from ...
            match = re.search(r"import {(.*?)} from ['\"]@/components/ui['\"]", line)
            if match:
                parts = [p.strip() for p in match.group(1).split(',')]
                ui_imports.extend(parts)
                continue
        other_lines.append(line)

    if not ui_imports:
        return

    # Filter unique and non-empty
    unique_imports = sorted(list(set([p for p in ui_imports if p])))
    
    # Reconstruct the combined import
    import_line = f"import {{ {', '.join(unique_imports)} }} from '@/components/ui';\n"
    
    # Insert at the top of other_lines or where the first ui import was.
    # We'll just put it at line 1 for simplicity of this script.
    
    new_lines = [import_line] + other_lines
    
    with open(filepath, 'w') as f:
        f.writelines(new_lines)
    print(f"Deduplicated UI imports: {filepath}")

def main():
    src_dir = 'apps/frontend/src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            deduplicate_imports(os.path.join(root, file))

if __name__ == '__main__':
    main()
