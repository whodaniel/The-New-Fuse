#!/usr/bin/env python3
from subprocess import run, PIPE

# Use the search field to filter for windsurfree9
script = '''
tell application "Google Chrome"
    activate
    tell active tab of window 1
        set searchInput to execute javascript "
            var inputs = document.querySelectorAll('input');
            for (var i = 0; i < inputs.length; i++) {
                var placeholder = inputs[i].placeholder || '';
                if (placeholder.indexOf('Search') > -1 || placeholder.indexOf('search') > -1) {
                    inputs[i].value = 'windsurfree9';
                    inputs[i].dispatchEvent(new Event('input'));
                    inputs[i].dispatchEvent(new Event('change'));
                    return 'Typed in search';
                }
            }
            return 'Not found';
        "
    end tell
    return searchInput as string
end tell
'''
result = run(['osascript', '-e', script], capture_output=True, text=True)
print(result.stdout)