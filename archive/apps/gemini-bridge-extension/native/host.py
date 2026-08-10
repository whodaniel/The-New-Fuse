#!/usr/bin/env python3
import sys
import json
import subprocess
import pyautogui

def send_response(response):
    sys.stdout.write(json.dumps(response) + '\n')
    sys.stdout.flush()

def main():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            request = json.loads(line)
            command = request.get('command')
            if command == 'restart_vite':
                result = subprocess.run(['npm', 'run', 'dev'], capture_output=True, text=True)
                send_response({'success': result.returncode == 0, 'output': result.stdout})
            elif command == 'screenshot':
                screenshot = pyautogui.screenshot()
                path = '/tmp/thenewfuse_screenshot.png'
                screenshot.save(path)
                send_response({'success': True, 'path': path})
            elif command == 'move_mouse':
                x, y = request.get('x'), request.get('y')
                pyautogui.moveTo(x, y)
                send_response({'success': True})
            else:
                send_response({'success': False, 'error': 'Unknown command'})
        except Exception as e:
            send_response({'success': False, 'error': str(e)})

if __name__ == '__main__':
    main()
