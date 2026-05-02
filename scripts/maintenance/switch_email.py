#!/usr/bin/env python3
from subprocess import run, PIPE

# Switch back to email accounts tab
script = '''
tell application "Google Chrome"
    set w to window 1
    repeat with t in tabs of w
        if title of t contains "Email Accounts" then
            set active tab of w to t
            return "Switched"
        end if
    end repeat
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)