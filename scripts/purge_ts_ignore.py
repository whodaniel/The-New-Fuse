import os
import re

def purge_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    skip_next = False
    modified = False
    
    # regex for import/export at the start of the line (with optional whitespace)
    import_export_re = re.compile(r'^\s*(import|export)\b')
    ts_ignore_re = re.compile(r'\s*// @ts-ignore.*')
    
    for i in range(len(lines)):
        if skip_next:
            skip_next = False
            # Check if this line is a ts-ignore
            if lines[i].strip().startswith('// @ts-ignore'):
                modified = True
                continue
            else:
                new_lines.append(lines[i])
                continue
        
        line = lines[i]
        match = import_export_re.match(line)
        
        if match:
            # If the line contains @ts-ignore, remove it
            if '// @ts-ignore' in line:
                # Remove the comment and any whitespace before it
                new_line = ts_ignore_re.sub('', line.rstrip('\n\r')) + '\n'
                if new_line != line:
                    modified = True
                    line = new_line
            
            new_lines.append(line)
            # Mark next line to be checked for removal if it is @ts-ignore
            skip_next = True
        else:
            new_lines.append(line)
            skip_next = False
            
    if modified or len(new_lines) != len(lines):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
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
