#!/usr/bin/env python3
from subprocess import run, PIPE

# Get the Webmail link element and click it
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        execute javascript "
            var all = document.querySelectorAll('*');
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                if (el.tagName === 'A' && el.textContent.indexOf('Webmail') > -1) {
                    var rect = el.getBoundingClientRect();
                    return 'Found at ' + rect.left + ',' + rect.top;
                }
            }
            return 'Not found';
        "
    end tell
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)