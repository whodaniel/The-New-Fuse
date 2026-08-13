#!/usr/bin/env python3
from subprocess import run, PIPE

# Click at position around Webmail link
script = '''
tell application "System Events"
    tell process "Google Chrome"
        set w to front window
        set c to make new item at property list specifier of w with properties {class:"cell", index:0}
        -- Click at coordinates
        click at {1250, 465}
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Clicked at {1250, 465}")