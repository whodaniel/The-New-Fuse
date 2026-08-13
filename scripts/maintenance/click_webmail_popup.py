#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Click Webmail link
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        execute javascript "
            var links = document.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                if (links[i].innerText.indexOf('Webmail') > -1) {
                    links[i].click();
                    return 'Clicked Webmail';
                }
            }
            return 'Not found';
        "
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
time.sleep(3)