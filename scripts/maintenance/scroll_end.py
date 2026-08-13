#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Scroll to find windsurf
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        execute javascript "window.scrollTo(0, document.body.scrollHeight);"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
time.sleep(1)