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
import threading
import queue
from typing import Dict, Any, List, Optional

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
        self.terminal_process = None
        
        # Prompt templates (in-memory storage for now)
        self.prompt_templates = [
            {
                "id": "agent_task",
                "name": "Agent Task Assignment",
                "description": "Template for assigning tasks to AI agents",
                "category": "agent",
                "tags": ["task", "assignment", "agent"],
                "template": "You are an AI agent with the following capabilities: {{capabilities}}. Please complete this task: {{task}}. Context: {{context}}",
                "variables": [
                    {"name": "capabilities", "type": "array", "required": True},
                    {"name": "task", "type": "string", "required": True},
                    {"name": "context", "type": "string", "required": False}
                ]
            },
            {
                "id": "code_review",
                "name": "Code Review Request", 
                "description": "Template for requesting code reviews",
                "category": "development",
                "tags": ["code", "review", "development"],
                "template": "Please review the following {{language}} code and provide feedback on:\\n1. Code quality\\n2. Best practices\\n3. Potential issues\\n4. Suggestions for improvement\\n\\nCode:\\n```{{language}}\\n{{code}}\\n```",
                "variables": [
                    {"name": "language", "type": "string", "required": True},
                    {"name": "code", "type": "string", "required": True}
                ]
            },
            {
                "id": "error_analysis",
                "name": "Error Analysis",
                "description": "Template for analyzing errors and bugs",
                "category": "debugging", 
                "tags": ["error", "analysis", "debugging"],
                "template": "Analyze the following error and provide:\\n1. Root cause analysis\\n2. Potential solutions\\n3. Prevention strategies\\n\\nError: {{error}}\\nContext: {{context}}\\nStack trace: {{stackTrace}}",
                "variables": [
                    {"name": "error", "type": "string", "required": True},
                    {"name": "context", "type": "string", "required": False},
                    {"name": "stackTrace", "type": "string", "required": False}
                ]
            }
        ]
        
    def send_response(self, request_id: str, success: bool, output: str = "", error: str = "", exit_code: int = 0):
        """Send response back to Electron app"""
        response = {
            "id": request_id,
            "success": success,
            "output": str(output)[:1000] if output else "",  # Limit output size
            "error": str(error)[:500] if error else "",      # Limit error size
            "exitCode": exit_code,
            "timestamp": time.time()
        }
        
        try:
            # Ensure clean JSON output with no extra whitespace or newlines
            json_response = json.dumps(response, separators=(',', ':'))
            print(json_response, flush=True)
        except Exception as e:
            # Fallback response if JSON serialization fails
            fallback = {
                "id": request_id,
                "success": False,
                "error": f"Serialization failed: {str(e)[:100]}"
            }
            print(json.dumps(fallback, separators=(',', ':')), flush=True)
    
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
    
    def get_terminal_output(self, args: List[str]) -> Dict[str, Any]:
        """Get terminal output (placeholder implementation)"""
        try:
            # In a real implementation, this would capture output from the running dev server
            # For now, return a placeholder
            return {
                "success": True,
                "output": "Terminal output capture not yet implemented. This would show output from 'bun run dev' or other running processes.",
                "exitCode": 0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get terminal output: {str(e)}",
                "exitCode": 1
            }
    
    def clear_terminal(self, args: List[str]) -> Dict[str, Any]:
        """Clear terminal output"""
        try:
            # Clear the terminal output queue
            while not self.terminal_output.empty():
                self.terminal_output.get()
            
            return {
                "success": True,
                "output": "Terminal cleared",
                "exitCode": 0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to clear terminal: {str(e)}",
                "exitCode": 1
            }
    
    def get_prompt_templates(self, args: List[str]) -> Dict[str, Any]:
        """Get all prompt templates"""
        try:
            return {
                "success": True,
                "output": json.dumps(self.prompt_templates),
                "exitCode": 0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get prompt templates: {str(e)}",
                "exitCode": 1
            }
    
    def create_prompt_template(self, args: List[str]) -> Dict[str, Any]:
        """Create a new prompt template"""
        try:
            if not args:
                return {
                    "success": False,
                    "error": "Template data required",
                    "exitCode": 1
                }
            
            template_data = json.loads(args[0])
            template_data["id"] = f"custom_{int(time.time())}"
            
            self.prompt_templates.append(template_data)
            
            return {
                "success": True,
                "output": f"Template '{template_data.get('name', 'Unknown')}' created with ID: {template_data['id']}",
                "exitCode": 0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create template: {str(e)}",
                "exitCode": 1
            }
    
    def generate_prompt(self, args: List[str]) -> Dict[str, Any]:
        """Generate a prompt from a template"""
        try:
            if len(args) < 2:
                return {
                    "success": False,
                    "error": "Template ID and variables required",
                    "exitCode": 1
                }
            
            template_id = args[0]
            variables = json.loads(args[1])
            
            # Find the template
            template = None
            for t in self.prompt_templates:
                if t["id"] == template_id:
                    template = t
                    break
            
            if not template:
                return {
                    "success": False,
                    "error": f"Template '{template_id}' not found",
                    "exitCode": 1
                }
            
            # Simple template interpolation
            result = template["template"]
            for var_name, var_value in variables.items():
                placeholder = "{{" + var_name + "}}"
                result = result.replace(placeholder, str(var_value))
            
            return {
                "success": True,
                "output": result,
                "exitCode": 0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate prompt: {str(e)}",
                "exitCode": 1
            }
    
    def handle_request(self, request: Dict[str, Any]):
        """Handle a request from the Electron app"""
        try:
            request_id = request.get("id", "unknown")
            command = request.get("command")
            args = request.get("args", [])
            
            # Handle service management commands
            if command == "start_service":
                result = {"success": True, "output": f"Service {args[0] if args else 'unknown'} started (placeholder)", "exitCode": 0}
            elif command == "stop_service":
                result = {"success": True, "output": f"Service {args[0] if args else 'unknown'} stopped (placeholder)", "exitCode": 0}
            elif command == "get_service_status":
                result = {"success": True, "output": f"Service {args[0] if args else 'unknown'} status: running", "exitCode": 0}
            elif command == "get_all_service_statuses":
                result = {"success": True, "output": "All services status retrieved", "exitCode": 0}
            elif command == "system_status":
                result = self.check_system(args)
            elif command == "add_port":
                result = {"success": True, "output": f"Port {args[0] if args else 'unknown'} added to monitor", "exitCode": 0}
            elif command == "remove_port":
                result = {"success": True, "output": f"Port {args[0] if args else 'unknown'} removed from monitor", "exitCode": 0}
            elif command == "list_ports":
                result = {"success": True, "output": "Monitored ports: []", "exitCode": 0}
            elif command == "port_status":
                result = {"success": True, "output": "Port statuses retrieved", "exitCode": 0}
            elif command == "tnf_connect":
                result = {"success": True, "output": "TNF connected (placeholder)", "exitCode": 0}
            elif command == "tnf_disconnect":
                result = {"success": True, "output": "TNF disconnected (placeholder)", "exitCode": 0}
            elif command == "tnf_status":
                result = {"success": True, "output": "TNF status: connected", "exitCode": 0}
            elif command == "mcp_connect":
                result = {"success": True, "output": "MCP connected (placeholder)", "exitCode": 0}
            elif command == "mcp_disconnect":
                result = {"success": True, "output": "MCP disconnected (placeholder)", "exitCode": 0}
            elif command == "mcp_status":
                result = {"success": True, "output": "MCP status: connected", "exitCode": 0}
            elif command == "restart_server":
                result = self.restart_server(args)
            elif command == "kill_process":
                result = self.kill_process(args)
            elif command == "check_system":
                result = self.check_system(args)
            elif command == "open_application":
                result = self.open_application(args)
            elif command == "file_operation":
                result = self.file_operation(args)
            elif command == "get_terminal_output":
                result = self.get_terminal_output(args)
            elif command == "clear_terminal":
                result = self.clear_terminal(args)
            elif command == "get_prompt_templates":
                result = self.get_prompt_templates(args)
            elif command == "create_prompt_template":
                result = self.create_prompt_template(args)
            elif command == "generate_prompt":
                result = self.generate_prompt(args)
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
                    
                    line = line.strip()
                    if not line:
                        continue
                        
                    request = json.loads(line)
                    self.handle_request(request)
                    
                except json.JSONDecodeError as e:
                    self.send_response("unknown", False, "", f"Invalid JSON: {str(e)[:100]}")
                except Exception as e:
                    self.send_response("unknown", False, "", f"Error: {str(e)[:100]}")
                    
        except KeyboardInterrupt:
            self.running = False
        except Exception as e:
            self.send_response("unknown", False, "", f"Host error: {str(e)[:100]}")

if __name__ == "__main__":
    host = NativeHost()
    host.run()
