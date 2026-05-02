#!/usr/bin/env python3
from subprocess import run, PIPE

# Find windsurfree9
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set found to execute javascript "window.find('windsurfree9@findproductsandservices.com');"
    end tell
    return found as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)