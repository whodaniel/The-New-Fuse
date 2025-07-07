#!/usr/bin/env python3
"""
Native Host for The New Fuse - Hybrid Desktop Automation System
Provides system-level automation capabilities for the Electron app
"""

import sys
import json
import subprocess
import os
import signal
import time
import psutil
import pyautogui
from typing import Dict, Any, List, Optional

class NativeHost:
    """Native host for system-level automation"""
    
    def __init__(self):
        """Initialize the native host"""
        self.running = True
        
        # Configure pyautogui
        pyautogui.FAILSAFE = False  # Disable failsafe for automation
        pyautogui.PAUSE = 0.1  # Small pause between actions
        
    def send_response(self, request_id: str, success: bool, output: str = "", error: str = "", exit_code: int = 0):
        """Send response back to Electron app"""
        response = {
            "id": request_id,
            "success": success,
            "output": output,
            "error": error,
            "exitCode": exit_code,
            "timestamp": time.time()
        }
        
        try:
            print(json.dumps(response), flush=True)
        except Exception as e:
            # Fallback response if JSON serialization fails
            fallback = {
                "id": request_id,
                "success": False,
                "error": f"Response serialization failed: {str(e)}"
            }
            print(json.dumps(fallback), flush=True)
    
    def restart_server(self, args: List[str]) -> Dict[str, Any]:
        """Restart a development server by port"""
        try:
            port = int(args[0]) if args else 3000
            
            # Find and kill process using the port
            killed_processes = []
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    connections = proc.info['connections']
                    if connections:
                        for conn in connections:
                            if conn.laddr.port == port:
                                proc.kill()
                                killed_processes.append(f"{proc.info['name']} (PID: {proc.info['pid']})")
                                break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            if killed_processes:
                return {
                    "success": True,
                    "output": f"Killed processes on port {port}: {', '.join(killed_processes)}",
                    "exitCode": 0
                }
            else:
                return {
                    "success": True,
                    "output": f"No processes found running on port {port}",
                    "exitCode": 0
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to restart server: {str(e)}",
                "exitCode": 1
            }
    
    def kill_process(self, args: List[str]) -> Dict[str, Any]:
        """Kill a process by name or PID"""
        try:
            if not args:
                return {
                    "success": False,
                    "error": "Process name or PID required",
                    "exitCode": 1
                }
            
            target = args[0]
            killed_processes = []
            
            # Try to kill by PID first
            try:
                pid = int(target)
                proc = psutil.Process(pid)
                proc.kill()
                killed_processes.append(f"{proc.name()} (PID: {pid})")
            except ValueError:
                # Kill by name
                for proc in psutil.process_iter(['pid', 'name']):
                    try:
                        if target.lower() in proc.info['name'].lower():
                            proc.kill()
                            killed_processes.append(f"{proc.info['name']} (PID: {proc.info['pid']})")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
            
            if killed_processes:
                return {
                    "success": True,
                    "output": f"Killed processes: {', '.join(killed_processes)}",
                    "exitCode": 0
                }
            else:
                return {
                    "success": False,
                    "error": f"No processes found matching: {target}",
                    "exitCode": 1
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to kill process: {str(e)}",
                "exitCode": 1
            }
    
    def check_system(self, args: List[str]) -> Dict[str, Any]:
        """Run system diagnostics"""
        try:
            diagnostics = {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:').percent,
                "process_count": len(psutil.pids()),
                "uptime": time.time() - psutil.boot_time()
            }
            
            # Check specific ports if provided
            if args:
                port_statuses = {}
                for arg in args:
                    try:
                        port = int(arg)
                        port_in_use = False
                        for conn in psutil.net_connections():
                            if conn.laddr.port == port:
                                port_in_use = True
                                break
                        port_statuses[f"port_{port}"] = port_in_use
                    except ValueError:
                        continue
                
                diagnostics["port_statuses"] = port_statuses
            
            return {
                "success": True,
                "output": json.dumps(diagnostics, indent=2),
                "exitCode": 0
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"System check failed: {str(e)}",
                "exitCode": 1
            }
    
    def open_application(self, args: List[str]) -> Dict[str, Any]:
        """Launch an application"""
        try:
            if not args:
                return {
                    "success": False,
                    "error": "Application name required",
                    "exitCode": 1
                }
            
            app_name = args[0]
            additional_args = args[1:] if len(args) > 1 else []
            
            # Platform-specific application launching
            if sys.platform == "darwin":  # macOS
                cmd = ["open", "-a", app_name] + additional_args
            elif sys.platform == "win32":  # Windows
                cmd = ["start", app_name] + additional_args
            else:  # Linux
                cmd = [app_name] + additional_args
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr,
                "exitCode": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Application launch timed out",
                "exitCode": 1
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to open application: {str(e)}",
                "exitCode": 1
            }
    
    def file_operation(self, args: List[str]) -> Dict[str, Any]:
        """Perform file system operations"""
        try:
            if len(args) < 2:
                return {
                    "success": False,
                    "error": "Operation and path required",
                    "exitCode": 1
                }
            
            operation = args[0]
            path = args[1]
            
            if operation == "exists":
                exists = os.path.exists(path)
                return {
                    "success": True,
                    "output": f"Path exists: {exists}",
                    "exitCode": 0
                }
            elif operation == "create_dir":
                os.makedirs(path, exist_ok=True)
                return {
                    "success": True,
                    "output": f"Directory created: {path}",
                    "exitCode": 0
                }
            elif operation == "delete":
                if os.path.isfile(path):
                    os.remove(path)
                elif os.path.isdir(path):
                    os.rmdir(path)
                return {
                    "success": True,
                    "output": f"Deleted: {path}",
                    "exitCode": 0
                }
            else:
                return {
                    "success": False,
                    "error": f"Unknown operation: {operation}",
                    "exitCode": 1
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"File operation failed: {str(e)}",
                "exitCode": 1
            }
    
    def execute_custom_command(self, command: str, args: List[str]) -> Dict[str, Any]:
        """Execute a custom shell command"""
        try:
            # Build the full command
            full_command = [command] + args
            
            result = subprocess.run(
                full_command,
                capture_output=True,
                text=True,
                timeout=30,  # 30 second timeout
                shell=False
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr,
                "exitCode": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Command execution timed out",
                "exitCode": 1
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Command execution failed: {str(e)}",
                "exitCode": 1
            }
    
    def handle_request(self, request: Dict[str, Any]):
        """Handle a request from the Electron app"""
        try:
            request_id = request.get("id", "unknown")
            command = request.get("command")
            args = request.get("args", [])
            
            if command == "restart_server":
                result = self.restart_server(args)
            elif command == "kill_process":
                result = self.kill_process(args)
            elif command == "check_system":
                result = self.check_system(args)
            elif command == "open_application":
                result = self.open_application(args)
            elif command == "file_operation":
                result = self.file_operation(args)
            else:
                # Treat as custom command
                result = self.execute_custom_command(command, args)
            
            self.send_response(
                request_id,
                result["success"],
                result.get("output", ""),
                result.get("error", ""),
                result.get("exitCode", 0)
            )
            
        except Exception as e:
            self.send_response(
                request.get("id", "unknown"),
                False,
                "",
                f"Request handling failed: {str(e)}",
                1
            )
    
    def run(self):
        """Main loop - read requests from stdin and send responses to stdout"""
        try:
            while self.running:
                try:
                    line = sys.stdin.readline()
                    if not line:
                        break
                    
                    request = json.loads(line.strip())
                    self.handle_request(request)
                    
                except json.JSONDecodeError as e:
                    self.send_response("unknown", False, "", f"Invalid JSON: {str(e)}")
                except Exception as e:
                    self.send_response("unknown", False, "", f"Unexpected error: {str(e)}")
                    
        except KeyboardInterrupt:
            self.running = False
        except Exception as e:
            self.send_response("unknown", False, "", f"Host error: {str(e)}")

if __name__ == "__main__":
    host = NativeHost()
    host.run()
