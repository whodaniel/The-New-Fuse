#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Click Webmail in popup
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set result to execute javascript "
            var links = document.querySelectorAll('.popup a, #popup a');
            for (var i = 0; i < links.length; i++) {
                if (links[i].innerText.indexOf('Webmail') > -1) {
                    links[i].click();
                    return 'Clicked Webmail';
                }
            }
            // Try broader search
            var allLinks = document.querySelectorAll('a');
            for (var i = 0; i < allLinks.length; i++) {
                if (allLinks[i].innerText.indexOf('Webmail') > -1 && allLinks[i].offsetParent !== null) {
                    allLinks[i].click();
                    return 'Clicked Webmail broader';
                }
            }
            return 'Not found';
        "
    end tell
    return result as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)
time.sleep(3)