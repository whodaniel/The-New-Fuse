import os
import re

def purge_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if not lines:
        return False
        
    import_export_re = re.compile(r'^\s*(import|export)\b')
    ts_ignore_line_re = re.compile(r'^\s*// @ts-ignore')
    ts_ignore_inline_re = re.compile(r'\s*// @ts-ignore.*')
    
    is_ie = [bool(import_export_re.match(line)) for line in lines]
    
    indices_to_remove = set()
    new_lines = []
    modified = False
    
    for i in range(len(lines)):
        # Rule 2: If that line contains // @ts-ignore, remove it (from the line)
        if is_ie[i] and '// @ts-ignore' in lines[i]:
            line_without_ignore = ts_ignore_inline_re.sub('', lines[i].rstrip('\n\r')) + '\n'
            if line_without_ignore != lines[i]:
                lines[i] = line_without_ignore
                modified = True
        
        # Rule 3: If the NEXT line after an import/export starts with // @ts-ignore, remove it
        if i > 0 and is_ie[i-1] and ts_ignore_line_re.match(lines[i]):
            indices_to_remove.add(i)
            
        # "anywhere near" - let's also handle the line BEFORE
        if i < len(lines) - 1 and is_ie[i+1] and ts_ignore_line_re.match(lines[i]):
            indices_to_remove.add(i)

    final_lines = [lines[i] for i in range(len(lines)) if i not in indices_to_remove]
    
    if modified or len(final_lines) != len(lines):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(final_lines)
        return True
    return False

def main():
    root_dirs = ['packages', 'apps']
    count = 0
    modified_count = 0
    
    for root_dir in root_dirs:
        if not os.path.exists(root_dir):
            continue
        for subdir in os.listdir(root_dir):
            src_dir = os.path.join(root_dir, subdir, 'src')
            if os.path.exists(src_dir):
                for root, dirs, files in os.walk(src_dir):
                    for file in files:
                        if file.endswith('.ts') or file.endswith('.tsx'):
                            count += 1
                            if purge_file(os.path.join(root, file)):
                                modified_count += 1
                                
    print(f"Total files checked: {count}")
    print(f"Total files modified: {modified_count}")

if __name__ == "__main__":
    main()
