#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Go to auth.openai.com login page
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set URL to "https://auth.openai.com/login"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Loading auth.openai.com...")
time.sleep(3)