#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Click Options for the first account row
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- Find and click the first Options link
        execute javascript "
            var optionsBtns = document.querySelectorAll('a');
            for (var i = 0; i < optionsBtns.length; i++) {
                if (optionsBtns[i].innerText.indexOf('Options') > -1) {
                    optionsBtns[i].click();
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