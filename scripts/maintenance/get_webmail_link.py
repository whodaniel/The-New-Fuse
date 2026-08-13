#!/usr/bin/env python3
from subprocess import run, PIPE
import time

# Get the webmail link URL from popup
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set links to execute javascript "
            var links = document.querySelectorAll('a');
            var result = '';
            for (var i = 0; i < links.length; i++) {
                var txt = links[i].innerText || '';
                var href = links[i].href || '';
                if (txt.indexOf('Webmail') > -1) {
                    result += txt + '|' + href + '---';
                }
            }
            return result;
        "
    end tell
    return links as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)