#!/usr/bin/env python3
from subprocess import run, PIPE

# Check where we are
script = '''
tell application "Google Chrome"
    tell active tab of window 1
        return URL as string
    end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("URL:", result.stdout)