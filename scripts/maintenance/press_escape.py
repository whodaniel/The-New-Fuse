#!/usr/bin/env python3
from subprocess import run, PIPE

# Press Escape to close popup
script = '''
tell application "System Events"
    tell process "Google Chrome"
        keystroke "<escape>"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Pressed Escape")