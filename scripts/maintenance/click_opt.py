#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Click the Options link (last cell in the row)
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- Find all Option links and click the first visible one near windsurfree9
        execute javascript "
            var links = document.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                var txt = links[i].innerText || '';
                if (txt.indexOf('Options') > -1 && links[i].offsetParent !== null) {
                    links[i].click();
                    return 'Clicked Options';
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