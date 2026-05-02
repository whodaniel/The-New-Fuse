#!/usr/bin/env python3
# stream_watch_stealth.py: Watches voice_stream.txt and injects text into TARGETED window.
# v9.0: The Targeted Buffer Bridge (Focus-Free + Auto-Return)

import os
import time
import subprocess
import glob

def resolve_state_dir() -> str:
    explicit = os.environ.get("VOICEBRIDGE_STATE_DIR", "").strip()
    if explicit:
        return os.path.expanduser(explicit)

    env_root = os.environ.get("VOICEBRIDGE_PROJECT_ROOT", "").strip() or os.environ.get("THE_NEW_FUSE_HOME", "").strip()
    if env_root:
        root = os.path.expanduser(env_root)
        if os.path.isdir(root):
            return os.path.join(root, ".voicebridge")

    cur = os.getcwd()
    while cur and cur != "/":
        if os.path.basename(cur) == "The-New-Fuse" and os.path.isdir(os.path.join(cur, "apps")):
            return os.path.join(cur, ".voicebridge")
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent

    for candidate in (
        os.path.expanduser("~/The-New-Fuse"),
        os.path.expanduser("~/Desktop/The-New-Fuse"),
        os.path.expanduser("~/Projects/The-New-Fuse"),
    ):
        if os.path.isdir(candidate):
            return os.path.join(candidate, ".voicebridge")

    for pattern in (
        "~/Desktop/*/The-New-Fuse",
        "~/Projects/*/The-New-Fuse",
        "~/*/The-New-Fuse",
    ):
        for candidate in glob.glob(os.path.expanduser(pattern)):
            if os.path.isdir(os.path.join(candidate, "apps")):
                return os.path.join(candidate, ".voicebridge")

    return os.path.expanduser("~/.local/share/The-New-Fuse/.voicebridge")


STATE_DIR = resolve_state_dir()
STREAM_FILE = os.path.join(STATE_DIR, "voice_stream.txt")
WINDOW_NAME = "GEMINI_ORCHESTRATOR"
WINDOW_NAME = "GEMINI_ORCHESTRATOR"
SUBMIT_TIMEOUT = 1.5  # Snappier auto-submit

class TurboBridge:
    def __init__(self):
        # Open a persistent pipe to osascript to eliminate spawn overhead
        self.proc = subprocess.Popen(
            ['osascript', '-i'], 
            stdin=subprocess.PIPE, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        print("🚀 Turbo Engine Engaged: Persistent OsaScript Pipe Open.")

    def run_script(self, script):
        try:
            self.proc.stdin.write(script + "\n")
            self.proc.stdin.flush()
        except Exception as e:
            print(f"❌ Turbo Error: {e}")

    def inject_text(self, text):
        safe_text = text.replace('"', '\\"')
        script = f'''
        tell application "System Events" to tell process "Terminal"
            keystroke "{safe_text} "
        end tell
        '''
        self.run_script(script)

    def submit(self):
        script = 'tell application "System Events" to tell process "Terminal" to key code 36'
        self.run_script(script)

def main():
    if not os.path.exists(STREAM_FILE):
        os.makedirs(os.path.dirname(STREAM_FILE), exist_ok=True)
        open(STREAM_FILE, 'w').close()

    file_handle = open(STREAM_FILE, 'r')
    file_handle.seek(0, os.SEEK_END)

    bridge = TurboBridge()
    last_activity_time = time.time()
    needs_submission = False

    print(f"⚡ Turbo Monitoring {STREAM_FILE}...")

    try:
        while True:
            line = file_handle.readline()
            if line:
                word = line.strip()
                if word:
                    bridge.inject_text(word)
                    last_activity_time = time.time()
                    needs_submission = True
                continue
            
            if needs_submission and (time.time() - last_activity_time > SUBMIT_TIMEOUT):
                bridge.submit()
                needs_submission = False
            
            time.sleep(0.05) # 20Hz polling for zero lag
                
    except KeyboardInterrupt:
        print("\n👋 Turbo Bridge stopped.")
        file_handle.close()
        bridge.proc.terminate()
                
    except KeyboardInterrupt:
        print("\n👋 Stealth Bridge stopped.")
        file_handle.close()

if __name__ == "__main__":
    main()
