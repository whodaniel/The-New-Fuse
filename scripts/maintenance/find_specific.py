#!/usr/bin/env python3
from subprocess import run, PIPE

# Use find to search
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        execute javascript "window.find('windsurffree9');"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)