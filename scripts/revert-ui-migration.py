import os
import re

def revert_file(filepath):
    # Only revert files that might have been migrated (tsx, ts)
    if not filepath.endswith(('.tsx', '.ts')):
         return

    with open(filepath, 'r') as f:
        content = f.read()

    # Rule: Revert any import from '@the-new-fuse/ui-consolidated' back to local index
    # But only if it was NOT one of the original usage files
    # Original usage files from grep: webhooks/*, BundleAnalyzer.tsx
    if 'src/components/webhooks' in filepath or 'src/components/performance/BundleAnalyzer.tsx' in filepath:
        return

    new_content = re.sub(
        r"from ['\"]@the-new-fuse/ui-consolidated['\"]",
        r"from '@/components/ui'",
        content
    )

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Reverted: {filepath}")

def main():
    src_dir = 'apps/frontend/src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            revert_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
