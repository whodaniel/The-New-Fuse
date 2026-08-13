#!/usr/bin/env python3
from subprocess import run, PIPE

# Get all input fields
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set inputs to execute javascript "
            var inputs = document.querySelectorAll('input');
            var result = '';
            inputs.forEach(function(i) {
                result += '|' + (i.type || 'none') + '|' + (i.placeholder || '') + '|';
            });
            return result;
        "
    end tell
    return inputs as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout[:1000])