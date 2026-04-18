import os
import re

def migrate_file(filepath):
    # Skip standard UI component definitions themselves
    if '/components/ui/' in filepath and not filepath.endswith('index.tsx') and not filepath.endswith('index.ts'):
         return

    with open(filepath, 'r') as f:
        content = f.read()

    # Rule: Replace any import from '@/components/ui/...' with global consolidated package
    # Handles both single and double quotes.
    # Excludes images and specific sub-dirs (e.g. premium, layout) if needed.
    
    new_content = re.sub(
        r"from ['\"]@/components/ui/([a-zA-Z-]+)['\"]",
        r"from '@the-new-fuse/ui-consolidated'",
        content
    )
    
    # Also handle the main index import
    new_content = re.sub(
        r"from ['\"]@/components/ui['\"]",
        r"from '@the-new-fuse/ui-consolidated'",
        new_content
    )

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Migrated: {filepath}")

def main():
    src_dir = 'apps/frontend/src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                migrate_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
