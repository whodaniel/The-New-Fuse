#!/usr/bin/env python3
from subprocess import run, PIPE

# Switch to the webmail tab (last tab or tab with "Webmail" in title)
script = '''
tell application "Google Chrome"
    set w to window 1
    repeat with t in tabs of w
        if title of t contains "Webmail" then
            set active tab of w to t
            return "Switched to " & title of t
        end if
    end repeat
    return "Not found"
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)