import os

count = 0
for root, dirs, files in os.walk('.'):
    # Skip .git etc
    if '.git' in root.split(os.sep) or 'node_modules' in root.split(os.sep): 
        continue
    for file in files:
        if file.startswith('.'): continue
        path = os.path.join(root, file)
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if '/path/to' in content:
                content = content.replace('/path/to/', '/path/to/')
                content = content.replace('/path/to', '/path/to')
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                
        except UnicodeDecodeError:
            pass # Skip binary files
        except Exception as e:
            pass
            
print(f"Successfully sanitized {count} files.")
