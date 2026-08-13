#!/usr/bin/env python3
from subprocess import run, PIPE

# Get the menu links
script = '''
tell application "Google Chrome"
    activate
    delay 1
    tell active tab of window 1
        set links to execute javascript "
            var as = document.querySelectorAll('a');
            var result = '';
            as.forEach(function(a) {
                if (a.href.indexOf('mail') > -1 || a.innerText.indexOf('mail') > -1) {
                    result += a.href + ' => ' + a.innerText + '\\n';
                }
            });
            return result;
        "
    end tell
    return links as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout[:2000])
print(result.stderr[:500] if result.stderr else "")