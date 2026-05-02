#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Scroll down page
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        execute javascript "window.scrollBy(0, 500);"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
time.sleep(1)