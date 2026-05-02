#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Find windsurfree9 in page
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        execute javascript "window.find('windsurfree9');"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Searched")
time.sleep(1)