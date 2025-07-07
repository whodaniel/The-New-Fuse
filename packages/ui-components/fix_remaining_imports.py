#\!/usr/bin/env python3

import os
import re
import sys
from pathlib import Path

def fix_imports_in_file(file_path):
    """Fix import statements in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixes_made = 0
        
        # Pattern 1: from './file' -> from './file.js'
        # Pattern 2: from '../file' -> from '../file.js'
        # Look for imports that don't already end with .js, .ts, .tsx, .jsx, .css, .scss, etc.
        
        # Single quotes pattern for relative imports
        pattern1 = r"from\s+['\"](\.\./[^'\"]*?)(?<\!\.js)(?<\!\.ts)(?<\!\.tsx)(?<\!\.jsx)(?<\!\.css)(?<\!\.scss)(?<\!\.json)['\"]"
        replacement1 = r"from '\1.js'"
        content, count1 = re.subn(pattern1, replacement1, content)
        fixes_made += count1
        
        pattern2 = r"from\s+['\"](\./[^'\"]*?)(?<\!\.js)(?<\!\.ts)(?<\!\.tsx)(?<\!\.jsx)(?<\!\.css)(?<\!\.scss)(?<\!\.json)['\"]"
        replacement2 = r"from '\1.js'"
        content, count2 = re.subn(pattern2, replacement2, content)
        fixes_made += count2
        
        # Handle export patterns too
        pattern3 = r"export\s+\*\s+from\s+['\"](\.\./[^'\"]*?)(?<\!\.js)(?<\!\.ts)(?<\!\.tsx)(?<\!\.jsx)(?<\!\.css)(?<\!\.scss)(?<\!\.json)['\"]"
        replacement3 = r"export * from '\1.js'"
        content, count3 = re.subn(pattern3, replacement3, content)
        fixes_made += count3
        
        pattern4 = r"export\s+\*\s+from\s+['\"](\./[^'\"]*?)(?<\!\.js)(?<\!\.ts)(?<\!\.tsx)(?<\!\.jsx)(?<\!\.css)(?<\!\.scss)(?<\!\.json)['\"]"
        replacement4 = r"export * from '\1.js'"
        content, count4 = re.subn(pattern4, replacement4, content)
        fixes_made += count4
        
        # Write back only if changes were made
        if content \!= original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {fixes_made} imports in {file_path}")
            return fixes_made
        else:
            print(f"No fixes needed in {file_path}")
            return 0
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0

def main():
    # Read list of files to process
    files_to_process = []
    try:
        with open('/tmp/files_with_imports.txt', 'r') as f:
            files_to_process = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print("File list not found")
        return
    
    total_fixes = 0
    files_processed = 0
    
    for file_path in files_to_process:
        if os.path.exists(file_path):
            fixes = fix_imports_in_file(file_path)
            total_fixes += fixes
            files_processed += 1
        else:
            print(f"File not found: {file_path}")
    
    print(f"\nSummary:")
    print(f"Files processed: {files_processed}")
    print(f"Total fixes applied: {total_fixes}")

if __name__ == "__main__":
    main()
