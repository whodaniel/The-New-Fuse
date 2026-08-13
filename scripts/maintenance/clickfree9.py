#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Find and click Options for windsurfree9
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        execute javascript "
            var rows = document.querySelectorAll('table tbody tr');
            for (var i = 0; i < rows.length; i++) {
                var cells = rows[i].querySelectorAll('td');
                if (cells.length > 0) {
                    var email = cells[0].innerText || '';
                    if (email.indexOf('owner@example.com') > -1) {
                        var links = cells[cells.length-1].querySelectorAll('a');
                        if (links.length > 0) {
                            links[0].click();
                            return 'Clicked Options';
                        }
                    }
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