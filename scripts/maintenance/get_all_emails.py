#!/usr/bin/env python3
from subprocess import run, PIPE

# Refresh the page and get all emails from table rows
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set emails to execute javascript "
            var rows = document.querySelectorAll('table tbody tr');
            var list = [];
            rows.forEach(function(row) {
                var cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    var firstCell = cells[0].innerText.trim();
                    if (firstCell.indexOf('@') > -1) {
                        list.push(firstCell);
                    }
                }
            });
            return list.join('\\n');
        "
    end tell
    return emails as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
emails = result.stdout.strip().split('\\n')
print(f"Found {len(emails)} accounts")
print("\\nLast 30 emails:")
for e in emails[-30:]:
    print(e)