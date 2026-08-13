#!/usr/bin/env python3
import os
import sys

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Restore .js imports back
    new_content = content.replace(".ts'", ".js'")
    new_content = new_content.replace('.ts"', '.js"')
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Restored: {file_path}")

def main():
    src_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    for root, dirs, files in os.walk(src_dir):
        # Skip test files
        if '.test.' in root or '.spec.' in root:
            continue
        for file in files:
            if file.endswith('.ts'):
                fix_imports(os.path.join(root, file))

if __name__ == '__main__':
    main()

def main():
    src_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    for root, dirs, files in os.walk(src_dir):
        # Skip test files
        if '.test.' in root or '.spec.' in root:
            continue
        for file in files:
            if file.endswith('.ts'):
                fix_imports(os.path.join(root, file))

if __name__ == '__main__':
    main()