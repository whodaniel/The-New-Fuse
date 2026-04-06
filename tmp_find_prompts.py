import os
import re
import glob

d = '/Users/<owner>/.gemini/antigravity/conversations/'
files = glob.glob(d + '*.pb') + glob.glob(d + '*.tmp')
files.sort(key=os.path.getmtime, reverse=True)

# ignore the known 9 and current
ignore = [
    '274bfb08', 'b5b868a0', '7bcef52b', '8a1a15cb', '0ab28725',
    '6f9bc633', '9e809a55', 'd6e6fde3', '5b48aded', '76d70554'
]

count = 0
for f in files:
    if any(i in f for i in ignore): continue
    count += 1
    if count > 5: break
    try:
        with open(f, 'rb') as fp:
            data = fp.read()
            # extract readable strings >= 40 chars
            strings = re.findall(b'[ -~]{40,}', data)
            print(f"--- File: {os.path.basename(f)} ({len(data)} bytes) ---")
            
            # Since the user prompts are usually at the end of the pb, 
            # we'll look closely at the last 30 readable strings
            valid_strings = []
            for s in strings:
                try:
                    text = s.decode('utf-8')
                    valid_strings.append(text)
                except:
                    pass
                    
            for text in valid_strings[-30:]:
                print(">> " + text[:150].replace('\n', ' '))
    except Exception as e:
        print(f"Error {f}: {e}")
