#!/usr/bin/env python3
from subprocess import run, PIPE
import time
import re

# Get the page HTML source
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set htmlSrc to execute javascript "document.documentElement.outerHTML"
    end tell
    return htmlSrc as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)

html = result.stdout

# Look for email patterns in the HTML - typically in table cells
emails = re.findall(r'[\w.-]+@(?:findproductsandservices\.com|fineproductsandservices\.com|localproductsandservices\.com)', html)
unique = sorted(set(emails))
print(f"Found {len(unique)} unique emails")

# Find where windsurf would be alphabetically - it starts with 'windsurffree9'
# Let's find emails that start with 'w' or similar
w_emails = [e for e in unique if e.lower().startswith('w') or e.lower().startswith('wind')]
print(f"\\nEmails starting with 'w': {w_emails[:20]}")

# Let's see the last 20 emails (bottom of list - alphabetically sorted)
if len(unique) > 20:
    print(f"\\nLast 20 emails (bottom of list):")
    for e in unique[-20:]:
        print(f"  {e}")
else:
    print(f"\\nAll emails:")
    for e in unique:
        print(f"  {e}")