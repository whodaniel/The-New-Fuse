#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Click the page 19 link
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        execute javascript "
            var links = document.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                var txt = links[i].innerText || '';
                if (txt.indexOf('19') > -1 && links[i].offsetParent !== null) {
                    links[i].click();
                    return 'Clicked page 19';
                }
            }
            return 'Not found';
        "
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
time.sleep(2)