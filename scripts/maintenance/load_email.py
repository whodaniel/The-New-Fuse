#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Go to email accounts page
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set URL to "https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Loading...")
time.sleep(3)