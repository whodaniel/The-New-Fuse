#!/usr/bin/env python3
from subprocess import run, PIPE

# Check all tabs
script = '''
tell application "Google Chrome"
    set w to window 1
    set tabCount to 0
    repeat with w in windows
        set tabCount to tabCount + (count of tabs of w)
    end repeat
    return tabCount as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Total tabs:", result.stdout)

# Get titles of all tabs
script2 = '''
tell application "Google Chrome"
    set output to ""
    repeat with w in windows
        repeat with t in tabs of w
            set output to output & title of t & " | "
        end repeat
    end repeat
    return output as string
end tell
'''
result2 = run(['osascript', '-e', script2], capture_output=True, text=True)
print("Tab titles:", result2.stdout[:500])