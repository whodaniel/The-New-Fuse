#!/usr/bin/env python3
from subprocess import run, PIPE

# Get the page source from the active tab
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set pageSource to execute javascript "document.body.innerText"
    end tell
    return pageSource as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("STDOUT:", result.stdout[:3000] if result.stdout else "Empty")
print("STDERR:", result.stderr[:1000] if result.stderr else "None")