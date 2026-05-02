#!/usr/bin/env python3
from subprocess import run, PIPE

# Go to the last page by clicking the last page link or changing page number
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        -- Try to find and click a "Last" or ">>" link or change page
        execute javascript "
            var links = document.querySelectorAll('a, button, input[type=submit]');
            var found = '';
            links.forEach(function(l) {
                var txt = l.innerText || l.value || '';
                if (txt.indexOf('19') > -1 || txt.indexOf('Last') > -1 || txt.indexOf('>>') > -1 || txt.indexOf('»') > -1) {
                    found += txt + ' | ';
                }
            });
            return found;
        "
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout[:500])