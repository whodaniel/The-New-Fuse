#!/usr/bin/env python3
from subprocess import run, PIPE

# Go to last page by finding and clicking a link with ">>" or page number
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        execute javascript "
            // Find pagination links
            var links = document.querySelectorAll('.pagination a, .paginate a, a[href*=page]');
            var found = '';
            links.forEach(function(l) {
                var txt = l.innerText || l.href || '';
                if (txt.indexOf('19') > -1 || txt.indexOf('Last') > -1 || txt.indexOf('>>') > -1) {
                    l.click();
                    found = 'Clicked: ' + txt;
                }
            });
            if (!found) {
                // Try finding by text content
                var allLinks = document.querySelectorAll('a');
                allLinks.forEach(function(a) {
                    if (a.innerText && a.innerText.match(/>>/)) {
                        a.click();
                        found = 'Clicked >>';
                    }
                });
            }
            return found || 'Not found';
        "
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)