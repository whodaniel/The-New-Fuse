#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Scroll down using JavaScript
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- Scroll down multiple times to get to bottom
        execute javascript "window.scrollTo(0, document.body.scrollHeight);"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Scrolled")

time.sleep(1)

# Get more content after scrolling
script2 = '''
tell application "Google Chrome"
    tell active tab of window 1
        set pageText to execute javascript "document.body.innerText"
    end tell
    return pageText as string
end tell
'''
result2 = run(['osascript', '-e', script2], capture_output=True, text=True)
stdout = result2.stdout

# Extract emails (look for @ patterns in the text)
import re
emails = re.findall(r'[\w.-]+@(?:findproductsandservices\.com|fineproductsandservices\.com|localproductsandservices\.com)', stdout)
unique_emails = list(set(emails))[:30]
print(f"Found {len(unique_emails)} emails (sample):")
for e in unique_emails:
    print(f"  {e}")
    
# Check if windsurf is there
if any('windsurf' in e.lower() for e in unique_emails):
    print("\\nWINDSURF email found!")
else:
    print("\\n windsurf NOT in sample - need more scrolling")