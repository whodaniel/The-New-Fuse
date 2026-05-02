#!/usr/bin/env python3
from subprocess import run, PIPE

# Go to page 19 (last page) by adding page parameter
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set URL to "https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts?page=19"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Loading page 19...")