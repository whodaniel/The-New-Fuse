#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Find windsurfree9 and click Options
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- First search for windsurfree9
        execute javascript "window.find('windsurfree9');"
        delay 1
        -- Then find the Options link and click it
        var links = document.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            if (links[i].innerText.indexOf('Options') > -1) {
                links[i].click();
                return 'Clicked Options';
            }
        }
        return 'Not found';
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
time.sleep(2)