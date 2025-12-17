#!/usr/bin/env python3
"""
Native Host for The New Fuse - Hybrid Desktop Automation System
Provides system-level automation capabilities for the Electron app
IMPROVED: Now supports correct binary message framing for Chrome Native Messaging
"""

import sys
import json
import struct
import subprocess
import os
import time
import queue
from typing import Dict, Any, List, Optional

# ============================================
# Dependency Check
# ============================================

def check_dependencies():
    """Check if required packages are installed and provide helpful errors"""
    missing = []

    try:
        import psutil
    except ImportError:
        missing.append("psutil")

    try:
        import pyautogui
    except ImportError:
        missing.append("pyautogui")

    if missing:
        error_msg = {
            "error": "Missing dependencies",
            "missing_packages": missing,
            "install_command": f"pip3 install {' '.join(missing)}",
            "message": f"Please install missing packages: {', '.join(missing)}"
        }
        # Write error in native messaging format
        encoded = json.dumps(error_msg).encode('utf-8')
        sys.stdout.buffer.write(struct.pack('@I', len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
        sys.exit(1)

    return True

# Check dependencies before proceeding
check_dependencies()

# Now safe to import
import psutil
import pyautogui

# On Windows, the default I/O mode is text. Change it to binary.
if sys.platform == "win32":
    import msvcrt
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

class NativeHost:
    """Native host for system-level automation"""

    def __init__(self):
        """Initialize the native host"""
        self.running = True

        # Configure pyautogui
        pyautogui.FAILSAFE = False  # Disable failsafe for automation
        pyautogui.PAUSE = 0.1  # Small pause between actions

        # Terminal output capturing
        self.terminal_output = queue.Queue()

        # Prompt templates (in-memory storage for now)
        self.prompt_templates = [
            {
                "id": "agent_task",
                "name": "Agent Task Assignment",
                "template": "You are an AI agent with the following capabilities: {{capabilities}}. Please complete this task: {{task}}.",
                "variables": [
                    {"name": "capabilities", "type": "array", "required": True},
                    {"name": "task", "type": "string", "required": True}
                ]
            }
        ]

    # -------------------------------------------------------------------------
    # Chrome Native Messaging Protocol Helpers
    # -------------------------------------------------------------------------
    def read_message(self):
        """Read a message from stdin with the 4-byte length prefix."""
        try:
            # Read first 4 bytes (message length)
            raw_length = sys.stdin.buffer.read(4)
            if len(raw_length) == 0:
                return None

            # Unpack the 4 bytes into an integer (little-endian)
            message_length = struct.unpack('@I', raw_length)[0]

            # Read the message content exactly the size of message_length
            message = sys.stdin.buffer.read(message_length).decode('utf-8')

            return json.loads(message)
        except Exception:
            return None

    def send_response(self, request_id: str, success: bool, output: str = "", error: str = "", exit_code: int = 0):
        """Send response back to Chrome with the 4-byte length prefix."""
        response = {
            "id": request_id,
            "success": success,
            "output": str(output)[:2000] if output else "",  # Increased limit slightly
            "error": str(error)[:1000] if error else "",
            "exitCode": exit_code,
            "timestamp": time.time()
        }

        try:
            # Serialize JSON
            json_response = json.dumps(response, separators=(',', ':'))
            encoded_content = json_response.encode('utf-8')

            # Pack length into 4 bytes (little-endian)
            encoded_length = struct.pack('@I', len(encoded_content))

            # Write length followed by content to stdout
            sys.stdout.buffer.write(encoded_length)
            sys.stdout.buffer.write(encoded_content)
            sys.stdout.buffer.flush()

        except Exception:
            # If writing fails, we can't really communicate back efficiently
            pass

    # -------------------------------------------------------------------------
    # Command Handlers (Preserved from original)
    # -------------------------------------------------------------------------

    def restart_server(self, args: List[str]) -> Dict[str, Any]:
        """Restart a development server by port (Example Logic)"""
        try:
            port = int(args[0]) if args else 3000
            killed = []
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    connections = proc.info.get('connections', [])
                    if connections:
                        for conn in connections:
                            if conn.laddr.port == port:
                                proc.kill()
                                killed.append(f"{proc.info['name']} ({proc.info['pid']})")
                                break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            return {
                "success": True,
                "output": f"Killed processes on {port}: {', '.join(killed)}" if killed else f"No process on {port}",
                "exitCode": 0
            }
        except Exception as e:
            return {"success": False, "error": str(e), "exitCode": 1}

    def kill_process(self, args: List[str]) -> Dict[str, Any]:
        """Kill a process by name or PID"""
        try:
            if not args:
                return {"success": False, "error": "Process name/PID required", "exitCode": 1}
            target = args[0]
            killed = []

            # PID attempt
            try:
                pid = int(target)
                p = psutil.Process(pid)
                p.kill()
                killed.append(str(pid))
            except ValueError:
                # Name attempt
                for p in psutil.process_iter(['pid', 'name']):
                    try:
                        if target.lower() in p.info['name'].lower():
                            p.kill()
                            killed.append(f"{p.info['name']} ({p.info['pid']})")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue

            if killed:
                return {"success": True, "output": f"Killed: {', '.join(killed)}", "exitCode": 0}
            return {"success": False, "error": f"No process found: {target}", "exitCode": 1}

        except Exception as e:
            return {"success": False, "error": str(e), "exitCode": 1}

    def check_system(self, args: List[str]) -> Dict[str, Any]:
        """Run system diagnostics"""
        try:
            diagnostics = {
                "cpu_percent": psutil.cpu_percent(interval=None),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage(os.getcwd()).percent,
                "uptime": time.time() - psutil.boot_time()
            }
            if args:
                port_stats = {}
                for p_str in args:
                    try:
                        port = int(p_str)
                        in_use = any(c.laddr.port == port for c in psutil.net_connections())
                        port_stats[f"port_{port}"] = in_use
                    except ValueError:
                        pass
                diagnostics["port_statuses"] = port_stats

            return {"success": True, "output": json.dumps(diagnostics), "exitCode": 0}
        except Exception as e:
            return {"success": False, "error": str(e), "exitCode": 1}

    def open_application(self, args: List[str]) -> Dict[str, Any]:
        """Launch an application"""
        try:
            if not args:
                return {"success": False, "error": "App name required", "exitCode": 1}

            app = args[0]
            extra = args[1:]

            if sys.platform == "darwin":
                cmd = ["open", "-a", app] + extra
            elif sys.platform == "win32":
                cmd = ["start", app] + extra
            else:
                cmd = [app] + extra

            subprocess.Popen(cmd) # Non-blocking open
            return {"success": True, "output": f"Launched {app}", "exitCode": 0}
        except Exception as e:
            return {"success": False, "error": str(e), "exitCode": 1}

    def file_operation(self, args: List[str]) -> Dict[str, Any]:
        """File Ops: exists, create_dir, delete"""
        try:
            if len(args) < 2:
                return {"success": False, "error": "Op and path required", "exitCode": 1}

            op, path = args[0], args[1]
            if op == "exists":
                return {"success": True, "output": str(os.path.exists(path)), "exitCode": 0}
            elif op == "create_dir":
                os.makedirs(path, exist_ok=True)
                return {"success": True, "output": f"Created {path}", "exitCode": 0}
            elif op == "delete":
                if os.path.isfile(path): os.remove(path)
                elif os.path.isdir(path): os.rmdir(path)
                return {"success": True, "output": f"Deleted {path}", "exitCode": 0}
            return {"success": False, "error": f"Unknown op {op}", "exitCode": 1}
        except Exception as e:
            return {"success": False, "error": str(e), "exitCode": 1}

    def execute_custom_command(self, command: str, args: List[str]) -> Dict[str, Any]:
        """Execute arbitrary shell command (Be careful!)"""
        try:
            full = [command] + args
            res = subprocess.run(full, capture_output=True, text=True, timeout=10)
            return {
                "success": res.returncode == 0,
                "output": res.stdout,
                "error": res.stderr,
                "exitCode": res.returncode
            }
        except Exception as e:
            return {"success": False, "error": str(e), "exitCode": 1}

    # -------------------------------------------------------------------------
    # Main Handler Loop
    # -------------------------------------------------------------------------
    def handle_request(self, request: Dict[str, Any]):
        try:
            req_id = request.get("id", "unknown")
            cmd = request.get("command")
            args = request.get("args", [])

            # Route commands
            if cmd == "restart_server":
                res = self.restart_server(args)
            elif cmd == "kill_process":
                res = self.kill_process(args)
            elif cmd == "check_system" or cmd == "system_status":
                res = self.check_system(args)
            elif cmd == "open_application":
                res = self.open_application(args)
            elif cmd == "file_operation":
                res = self.file_operation(args)
            elif cmd == "get_prompt_templates":
                res = {"success": True, "output": json.dumps(self.prompt_templates), "exitCode": 0}
            else:
                # Default generic/custom command
                res = self.execute_custom_command(cmd, args)

            self.send_response(req_id, res["success"], res.get("output",""), res.get("error",""), res.get("exitCode", 0))

        except Exception as e:
             self.send_response(request.get("id", "unknown"), False, "", f"Handler Error: {e}", 1)

    def run(self):
        """Main loop - read binary messages"""
        while self.running:
            try:
                msg = self.read_message()
                if msg is None:
                    # End of stream or error
                    break
                self.handle_request(msg)
            except KeyboardInterrupt:
                break
            except Exception:
                # If reading fails critically, we exit
                break

if __name__ == "__main__":
    host = NativeHost()
    host.run()
