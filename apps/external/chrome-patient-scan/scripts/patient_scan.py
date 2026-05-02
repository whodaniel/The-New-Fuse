import subprocess
import time
import sys
import json

def run_osascript(script):
    try:
        process = subprocess.Popen(['osascript', '-e', script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate(timeout=30)
        return stdout.strip(), stderr.strip()
    except Exception as e:
        return "", str(e)

def get_clipboard():
    res, _ = run_osascript('return the clipboard')
    return res

def scan_window(win_name_part, wait_time=3):
    """
    Scans all tabs in a window matching win_name_part.
    """
    # Bring window to front
    script = f'''
    tell application "System Events"
        tell process "Google Chrome"
            set frontmost to true
            try
                set win to (first window whose name contains "{win_name_part}")
                perform action "AXRaise" of win
            on error
                return "Not Found"
            end try
        end tell
    end tell
    '''
    res, _ = run_osascript(script)
    if res == "Not Found":
        return []
        
    time.sleep(1)
    
    seen_tabs = set()
    results = []
    
    # Loop for max 100 tabs per window
    for _ in range(100):
        # Get URL via Address Bar (Cmd+L, Cmd+C)
        copy_script = '''
        tell application "System Events"
            tell process "Google Chrome"
                set frontmost to true
                keystroke "l" using {command down}
                delay 0.3
                keystroke "c" using {command down}
                delay 0.3
            end tell
        end tell
        '''
        run_osascript(copy_script)
        url = get_clipboard()
        
        # Get Title from window name
        title_script = 'tell application "System Events" to return name of window 1 of process "Google Chrome"'
        title, _ = run_osascript(title_script)
        
        key = f"{url}|{title}"
        if key in seen_tabs:
            break
        seen_tabs.add(key)
        
        # Patience: Wait for page to settle/load
        time.sleep(wait_time)
        
        # Final Title/URL check after wait
        title, _ = run_osascript(title_script)
        
        dead_status = "Alive"
        low_title = title.lower()
        low_url = url.lower()
        if any(x in low_title for x in ["404", "not found", "is for sale", "origin is unreachable", "site not found", "suspended"]):
            dead_status = "Dead"
        if any(x in low_url for x in ["hugedomains.com", "dan.com"]):
            dead_status = "Dead"
            
        results.append({
            "url": url,
            "title": title,
            "status": dead_status
        })
        
        # Next tab (Ctrl+Tab)
        next_tab_script = 'tell application "System Events" to tell process "Google Chrome" to keystroke tab using {control down}'
        run_osascript(next_tab_script)
        time.sleep(0.5)
        
    return results

def get_all_window_names():
    script = 'tell application "System Events" to tell process "Google Chrome" to return name of every window'
    res, _ = run_osascript(script)
    if not res: return []
    return [name.strip() for name in res.split(", ") if name.strip()]

if __name__ == "__main__":
    # If arguments provided, use them as window name filters. Otherwise scan all.
    targets = sys.argv[1:] if len(sys.argv) > 1 else get_all_window_names()
    
    all_results = []
    for t in targets:
        if t:
            all_results.extend(scan_window(t))
            
    print(json.dumps(all_results, indent=2))
