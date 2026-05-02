#!/usr/bin/env python3
from subprocess import run, PIPE

script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set found to execute javascript "
            var body = document.body.innerText;
            if (body.indexOf('windsurf') > -1) {
                return 'FOUND: ' + body.indexOf('windsurf');
            } else {
                return 'NOT FOUND - scrolling...';
            }
        "
    end tell
    return found as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)