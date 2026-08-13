#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Try to get tables directly
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set tableData to execute javascript "
            var tables = document.querySelectorAll('table');
            var result = 'Tables: ' + tables.length + '\\n';
            tables.forEach(function(t, i) {
                var rows = t.querySelectorAll('tbody tr, tr');
                result += 'Table ' + i + ' rows: ' + rows.length + '\\n';
                rows.forEach(function(r, j) {
                    var cells = r.querySelectorAll('td');
                    if (cells.length > 0) {
                        result += 'Row ' + j + ': ' + cells[0].innerText + '\\n';
                    }
                });
            });
            return result;
        "
    end tell
    return tableData as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout[:3000])
print(result.stderr[:500] if result.stderr else "")