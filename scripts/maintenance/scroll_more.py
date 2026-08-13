#!/usr/bin/env python3
from subprocess import run, PIPE
import time
import re

# Press Page Down multiple times to load more
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- Press page down multiple times
        set the result to ""
        repeat 20 times
            execute javascript "window.scrollBy(0, 500);"
        end repeat
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Scrolled")

time.sleep(2)

# Now get the HTML again
script2 = '''
tell application "Google Chrome"
    tell active tab of window 1
        set htmlSrc to execute javascript "document.documentElement.outerHTML"
    end tell
    return htmlSrc as string
end tell
'''
result2 = run(['osascript', '-e', script2], capture_output=True, text=True)
html = result2.stdout

emails = re.findall(r'[\w.-]+@(?:findproductsandservices\.com|fineproductsandservices\.com|localproductsandservices\.com)', html)
unique = sorted(set(emails))
print(f"Found {len(unique)} unique emails")

# Show last 30 (bottom of alphabetical list)
if len(unique) > 30:
    print(f"\\nLast 30 emails (bottom of list):")
    for e in unique[-30:]:
        print(f"  {e}")
else:
    print(f"\\nAll emails ({len(unique)}):")
    for e in unique:
        print(f"  {e}")