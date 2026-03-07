#!/usr/bin/env python3

import json
import sys
import subprocess
import signal
import logging
import os
import threading
import time
import shutil
import psutil

# Set up logging
logging.basicConfig(filename='host.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class ServiceManager:
    def __init__(self):
        self.services = {
            "api": Service("api", "bun --hot src/index.ts", "../apps/api"),
            "backend": Service("backend", "bun --watch src/simple-main.ts", "../apps/backend")
        }

    def start_service(self, service_name):
        service = self.services.get(service_name)
        if service:
            return service.start()
        return {"success": False, "error": f"Service {service_name} not found."}

    def stop_service(self, service_name):
        service = self.services.get(service_name)
        if service:
            return service.stop()
        return {"success": False, "error": f"Service {service_name} not found."}

    def get_service_status(self, service_name):
        service = self.services.get(service_name)
        if service:
            return service.get_status()
        return {"success": False, "error": f"Service {service_name} not found."}

    def get_all_service_statuses(self):
        statuses = {}
        for name, service in self.services.items():
            statuses[name] = service.get_status()
        return {"success": True, "statuses": statuses}

class Service:
    def __init__(self, name, command, cwd, service_id=None, description="", endpoint="", tools=None):
        self.name = name
        self.command = command
        self.cwd = os.path.normpath(os.path.join(os.path.dirname(__file__), cwd))
        self.process = None
        self.status = "stopped"
        self.output_thread = None
        self.connections = 0
        self.requests = 0
        self.errors = 0
        self.start_time = None
        self.id = service_id if service_id else name # Use name as ID if not provided
        self.description = description
        self.endpoint = endpoint
        self.tools = tools if tools is not None else []

    def start(self):
        if self.process and self.process.poll() is None:
            return {"success": False, "error": f"{self.name} service is already running."}
        try:
            logging.info(f"Starting {self.name} service with command: {self.command} in {self.cwd}")
            self.process = subprocess.Popen(
                self.command,
                shell=True,
                cwd=self.cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            self.status = "running"
            self.start_time = time.time()
            self.connections = 0 # Reset on start
            self.requests = 0    # Reset on start
            self.errors = 0      # Reset on start
            self.output_thread = threading.Thread(target=self._stream_output, daemon=True)
            self.output_thread.start()
            return {"success": True, "message": f"{self.name} service started."}
        except Exception as e:
            logging.error(f"Failed to start {self.name} service: {e}")
            self.status = "failed"
            return {"success": False, "error": str(e)}

    def stop(self):
        if not self.process or self.process.poll() is not None:
            return {"success": False, "error": f"{self.name} service is not running."}
        try:
            logging.info(f"Stopping {self.name} service (PID: {self.process.pid})")
            self.process.terminate()
            self.process.wait(timeout=10)
            if self.process.poll() is None:
                self.process.kill()
            self.status = "stopped"
            self.start_time = None
            return {"success": True, "message": f"{self.name} service stopped."}
        except Exception as e:
            logging.error(f"Failed to stop {self.name} service: {e}")
            self.status = "failed"
            return {"success": False, "error": str(e)}

    def get_status(self):
        if self.process and self.process.poll() is None:
            self.status = "running"
        elif self.process and self.process.poll() is not None:
            self.status = "stopped" # Process has exited
        
        uptime = 0
        if self.status == "running" and self.start_time:
            uptime = time.time() - self.start_time

        # Simulate some metrics for now
        if self.status == "running":
            self.connections = max(1, self.connections + 1) if self.name == "api" else self.connections
            self.requests = max(1, self.requests + 5) if self.name == "api" else self.requests
            if self.requests > 100 and self.name == "api": # Simulate occasional errors
                self.errors = int(self.requests * 0.01)

        return {
            "success": True,
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "endpoint": self.endpoint,
            "tools": self.tools,
            "status": self.status,
            "uptime": uptime,
            "connections": self.connections,
            "requests": self.requests,
            "errors": self.errors
        }

    def _stream_output(self):
        for line in self.process.stdout:
            logging.info(f"[{self.name}][stdout] {line.strip()}")
        for line in self.process.stderr:
            logging.error(f"[{self.name}][stderr] {line.strip()}")
        logging.info(f"{self.name} output streaming finished.")

class ServiceManager:
    def __init__(self):
        self.services = {
            "api": Service("api", "bun --hot src/index.ts", "../apps/api", "api-gateway", "API Gateway for TNF services", "http://localhost:3005", ["auth", "data", "mcp"]),
            "backend": Service("backend", "bun --watch src/simple-main.ts", "../apps/backend", "backend-app", "Core backend application for TNF", "http://localhost:3004", ["users", "workflows", "prompts"])
        }

    def start_service(self, service_name):
        service = self.services.get(service_name)
        if service:
            return service.start()
        return {"success": False, "error": f"Service {service_name} not found."}

    def stop_service(self, service_name):
        service = self.services.get(service_name)
        if service:
            return service.stop()
        return {"success": False, "error": f"Service {service_name} not found."}

    def get_service_status(self, service_name):
        service = self.services.get(service_name)
        if service:
            return service.get_status()
        return {"success": False, "error": f"Service {service_name} not found."}

    def get_all_service_statuses(self):
        statuses = {}
        for name, service in self.services.items():
            statuses[name] = service.get_status()
        return {"success": True, "statuses": statuses}

    def start(self):
        if self.process and self.process.poll() is None:
            return {"success": False, "error": f"{self.name} service is already running."}
        try:
            logging.info(f"Starting {self.name} service with command: {self.command} in {self.cwd}")
            self.process = subprocess.Popen(
                self.command,
                shell=True,
                cwd=self.cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            self.status = "running"
            self.output_thread = threading.Thread(target=self._stream_output, daemon=True)
            self.output_thread.start()
            return {"success": True, "message": f"{self.name} service started."}
        except Exception as e:
            logging.error(f"Failed to start {self.name} service: {e}")
            self.status = "failed"
            return {"success": False, "error": str(e)}

    def stop(self):
        if not self.process or self.process.poll() is not None:
            return {"success": False, "error": f"{self.name} service is not running."}
        try:
            logging.info(f"Stopping {self.name} service (PID: {self.process.pid})")
            self.process.terminate()
            self.process.wait(timeout=10)
            if self.process.poll() is None:
                self.process.kill()
            self.status = "stopped"
            return {"success": True, "message": f"{self.name} service stopped."}
        except Exception as e:
            logging.error(f"Failed to stop {self.name} service: {e}")
            self.status = "failed"
            return {"success": False, "error": str(e)}

    def get_status(self):
        if self.process and self.process.poll() is None:
            self.status = "running"
        elif self.process and self.process.poll() is not None:
            self.status = "stopped" # Process has exited
        return {"success": True, "status": self.status}

    def _stream_output(self):
        for line in self.process.stdout:
            logging.info(f"[{self.name}][stdout] {line.strip()}")
        for line in self.process.stderr:
            logging.error(f"[{self.name}][stderr] {line.strip()}")
        logging.info(f"{self.name} output streaming finished.")

service_manager = ServiceManager()

def execute_command_sync(cmd, cwd=None):
    try:
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd)
        stdout, stderr = process.communicate()
        return_code = process.returncode

        result = {
            "stdout": stdout.decode().strip(),
            "stderr": stderr.decode().strip(),
            "return_code": return_code
        }
    except Exception as e:
        result = {"error": str(e)}

    return result

# List of critical processes or services to avoid interacting with
critical_processes = [
    "sudo", "rm -rf", "format", "mkfs", "dd", "shutdown", "reboot",
    "system_daemon", "security_service", "database_server", "network_manager"
]

def is_critical_command(cmd):
    # Check if the command contains any critical process names
    for process in critical_processes:
        if process in cmd:
            return True
    return False

def graceful_terminate_process(process):
    try:
        process.send_signal(signal.SIGINT)
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()

# Initialize services at startup (optional, can be done via commands)
# service_manager.start_service("api")
# service_manager.start_service("backend")

while True:  # Keep listening for messages
    message = sys.stdin.readline()
    try:
        data = json.loads(message.strip())
        command = data.get("command")
        args = data.get("args", [])
        request_id = data.get("id")

        response = {"id": request_id, "success": True}

        if command == "start_service":
            service_name = args[0]
            response = service_manager.start_service(service_name)
        elif command == "stop_service":
            service_name = args[0]
            response = service_manager.stop_service(service_name)
        elif command == "get_service_status":
            service_name = args[0]
            response = service_manager.get_service_status(service_name)
        elif command == "get_all_service_statuses":
            response = service_manager.get_all_service_statuses()
        elif command == "execute_native_command":
            cmd_to_execute = args[0]
            cwd_to_execute = args[1] if len(args) > 1 else None
            if is_critical_command(cmd_to_execute):
                response = {"success": False, "error": "Command involves critical process, execution denied"}
            else:
                cmd_result = execute_command_sync(cmd_to_execute, cwd_to_execute)
                response["result"] = cmd_result
        elif command == "system_status":
            response = service_manager.get_all_service_statuses() # Return status of all services
        elif command == "get_resources":
            response["resources"] = [
                {"name": "CPU Cores", "value": os.cpu_count(), "unit": "cores", "description": "Number of CPU cores available"},
                {"name": "Total Memory", "value": round(psutil.virtual_memory().total / (1024.**3), 2), "unit": "GB", "description": "Total physical memory"},
                {"name": "Disk Usage (Root)", "value": round(shutil.disk_usage('/').free / (1024.**3), 2), "unit": "GB", "description": "Free space on root partition"},
                {"name": "Network Interfaces", "value": len(psutil.net_if_addrs()), "unit": "interfaces", "description": "Number of active network interfaces"}
            ]
        elif command == "get_tools":
            response["tools"] = [
                {"name": "Terminal", "description": "Access to the system terminal", "type": "cli"},
                {"name": "File Explorer", "description": "Browse and manage files", "type": "gui"},
                {"name": "Web Browser", "description": "Browse the internet", "type": "gui"},
                {"name": "Code Editor", "description": "Edit and manage code files", "type": "ide"}
            ]
        elif command == "tnf_connect":
            # config = json.loads(args[0]) # Placeholder for actual connection logic
            response["message"] = "TNF connected (placeholder)"
        elif command == "tnf_disconnect":
            response["message"] = "TNF disconnected (placeholder)"
        elif command == "tnf_status":
            response["status"] = "connected" # Placeholder
        elif command == "mcp_connect":
            # config = json.loads(args[0]) # Placeholder for actual connection logic
            response["message"] = "MCP connected (placeholder)"
        elif command == "mcp_disconnect":
            response["message"] = "MCP disconnected (placeholder)"
        elif command == "mcp_status":
            response["status"] = "connected" # Placeholder
        elif command == "add_port":
            port = int(args[0])
            response["message"] = f"Port {port} added to monitor (placeholder)"
        elif command == "remove_port":
            port = int(args[0])
            response["message"] = f"Port {port} removed from monitor (placeholder)"
        elif command == "list_ports":
            response["ports"] = [] # Placeholder
        elif command == "port_status":
            response["statuses"] = {} # Placeholder
        elif command == "element_detected":
            # element_data = json.loads(args[0]) # Placeholder
            response["message"] = "Element detected (placeholder)"
        elif command == "chrome_message":
            # message = json.loads(args[0]) # Placeholder
            response["message"] = "Chrome message sent (placeholder)"
        elif command == "chat_message":
            # message = args[0] # Placeholder
            response["message"] = "Chat message processed (placeholder)"
        elif command == "chat_history":
            response["history"] = [] # Placeholder
        elif command == "read_resource":
            uri = args[0]
            if uri.startswith("file://"):
                file_path = uri[len("file://"):]
                try:
                    with open(file_path, 'r') as f:
                        response["content"] = f.read()
                except Exception as e:
                    response = {"success": False, "error": str(e)}
            else:
                response = {"success": False, "error": "Only file:// URIs are supported for now"}
        elif command == "call_tool":
            tool_name = args[0]
            tool_args = json.loads(args[1]) if len(args) > 1 else {}
            
            if tool_name == "Terminal":
                if sys.platform == "darwin":
                    subprocess.Popen(["open", "-a", "Terminal"])
                    response["message"] = "Opened Terminal"
                elif sys.platform == "win32":
                    subprocess.Popen(["start", "cmd"], shell=True)
                    response["message"] = "Opened Command Prompt"
                else:
                    subprocess.Popen(["xterm"], shell=True) # Generic for Linux
                    response["message"] = "Opened Terminal"
            elif tool_name == "File Explorer":
                if sys.platform == "darwin":
                    subprocess.Popen(["open", os.path.expanduser("~")])
                    response["message"] = "Opened Finder"
                elif sys.platform == "win32":
                    subprocess.Popen(["explorer", os.path.expanduser("~")], shell=True)
                    response["message"] = "Opened File Explorer"
                else:
                    subprocess.Popen(["xdg-open", os.path.expanduser("~")]) # Generic for Linux
                    response["message"] = "Opened File Manager"
            elif tool_name == "Web Browser":
                url = tool_args.get("url", "https://www.google.com")
                if sys.platform == "darwin":
                    subprocess.Popen(["open", url])
                    response["message"] = f"Opened Web Browser to {url}"
                elif sys.platform == "win32":
                    os.startfile(url)
                    response["message"] = f"Opened Web Browser to {url}"
                else:
                    subprocess.Popen(["xdg-open", url])
                    response["message"] = f"Opened Web Browser to {url}"
            elif tool_name == "Code Editor":
                # This would typically open a specific IDE like VS Code
                # For now, just a placeholder
                response["message"] = "Code Editor opened (placeholder)"
            else:
                response = {"success": False, "error": f"Unknown tool: {tool_name}"}
        elif command == "get_real_extensions":
            extensions = []
            if sys.platform == 'darwin':
                chrome_extensions_path = os.path.expanduser('~/Library/Application Support/Google/Chrome/Default/Extensions')
                if os.path.exists(chrome_extensions_path):
                    for ext_id in os.listdir(chrome_extensions_path):
                        ext_path = os.path.join(chrome_extensions_path, ext_id)
                        if os.path.isdir(ext_path):
                            # Find the latest version directory
                            versions = [d for d in os.listdir(ext_path) if os.path.isdir(os.path.join(ext_path, d))]
                            if versions:
                                latest_version = sorted(versions, key=lambda v: [int(p) for p in v.split('.')])[-1]
                                manifest_path = os.path.join(ext_path, latest_version, 'manifest.json')
                                if os.path.exists(manifest_path):
                                    try:
                                        with open(manifest_path, 'r') as f:
                                            manifest = json.load(f)
                                        extensions.append({
                                            "name": manifest.get('name', 'Unknown'),
                                            "version": manifest.get('version', 'N/A'),
                                            "id": ext_id,
                                            "description": manifest.get('description', ''),
                                            "enabled": True, # Assume enabled if found
                                            "type": "chrome-installed"
                                        })
                                    except Exception as e:
                                        logging.error(f"Error reading manifest for {ext_id}: {e}")
            response["extensions"] = extensions
            response = {"success": False, "error": f"Unknown command: {command}"}

        print(json.dumps(response))
        sys.stdout.flush()

    except json.JSONDecodeError:
        logging.error("Invalid JSON received from stdin")
        print(json.dumps({"id": None, "success": False, "error": "Invalid JSON"}))
        sys.stdout.flush()
    except Exception as e:
        logging.error(f"Error processing command: {e}", exc_info=True)
        print(json.dumps({"id": request_id, "success": False, "error": str(e)}))
        sys.stdout.flush()