#!/usr/bin/env python3
from subprocess import run, PIPE

# Try to find the email by executing JavaScript to search/scroll
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- Try to find the email using JavaScript
        set searchResult to execute javascript "
            var rows = document.querySelectorAll('table tbody tr');
            var emails = [];
            rows.forEach(function(row) {
                var cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    emails.push(cells[0].innerText);
                }
            });
            return emails.join(',');
        "
    end tell
    return searchResult as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print("STDOUT:", result.stdout[:2000] if result.stdout else "Empty")
print("STDERR:", result.stderr[:500] if result.stderr else "None")