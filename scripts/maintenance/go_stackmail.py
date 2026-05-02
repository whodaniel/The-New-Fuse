#!/usr/bin/env python3
from subprocess import run, PIPE

script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set URL to "https://www.stackmail.com/?_task=mail&_mbox=INBOX"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Navigating to webmail...")