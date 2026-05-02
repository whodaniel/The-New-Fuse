#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Use Cmd+F to find the email
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        execute javascript "window.find('windsurf');"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)

time.sleep(1)

# Now get the visible content after finding
script2 = '''
tell application "Google Chrome"
    tell active tab of window 1
        set visibleText to execute javascript "document.body.innerText"
    end tell
    return visibleText as string
end tell
'''
result2 = run(['osascript', '-e', script2], capture_output=True, text=True)
# Find the relevant section
stdout = result2.stdout
if 'windsurf' in stdout.lower():
    idx = stdout.lower().find('windsurf')
    print("Found around:", stdout[max(0,idx-50):idx+200])
else:
    print("Not found. Content sample:", stdout[:1000])