#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Scroll up or find and click options
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        execute javascript "window.find('windsorfree9@');"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
time.sleep(1)