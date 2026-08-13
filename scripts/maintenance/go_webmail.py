#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Try to go directly to webmail for that email
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set URL to "https://findproductsandservices.com:2096"
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("Navigating to webmail...")
print(result.stdout)
print(result.stderr)

time.sleep(3)

# Get the page title to see if we're at webmail
script2 = '''
tell application "Google Chrome"
    tell active tab of window 1
        return title as string
    end tell
'''
result2 = run(['osascript', '-e', script2], capture_output=True, text=True)
print("Title:", result2.stdout)