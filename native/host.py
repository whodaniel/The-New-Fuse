#!/usr/bin/env python3

import json
import sys
import subprocess
import signal
import logging
import os
import threading
import time

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
    def __init__(self, name, command, cwd):
        self.name = name
        self.command = command
        self.cwd = os.path.normpath(os.path.join(os.path.dirname(__file__), cwd))
        self.process = None
        self.status = "stopped"
        self.output_thread = None

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
        else:
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