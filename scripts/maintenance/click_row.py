#!/usr/bin/env python3
from subprocess import run, PIPE

# Find the row with windsurfree9 and click its Options
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set result to execute javascript "
            var rows = document.querySelectorAll('table tbody tr');
            for (var i = 0; i < rows.length; i++) {
                var cells = rows[i].querySelectorAll('td');
                if (cells.length > 0) {
                    var email = cells[0].innerText || '';
                    if (email.indexOf('owner@example.com') > -1) {
                        var links = cells[cells.length-1].querySelectorAll('a');
                        if (links.length > 0) {
                            links[0].click();
                            return 'Found and clicked';
                        }
                    }
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