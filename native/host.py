#!/usr/bin/env python3

import json
import sys
import subprocess
import signal
import logging

# Set up logging
logging.basicConfig(filename='host.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def execute_command(cmd):
    try:
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        return_code = process.returncode

        result = {
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
            "return_code": return_code
        }
    except Exception as e:
        result = {"error": str(e)}

    return result

# List of critical processes or services to avoid interacting with
critical_processes = [
    "system_daemon",
    "security_service",
    "database_server",
    "network_manager"
]

# List of available commands with explanations
commands = [
    {
        "name": "List Files",
        "command": "ls -l",
        "description": "Lists all files in the current directory in a detailed format."
    },
    {
        "name": "Check Python Version",
        "command": "python3 --version",
        "description": "Displays the installed Python version."
    },
    {
        "name": "Ping Localhost",
        "command": "ping -c 4 127.0.0.1",
        "description": "Pings the localhost to check network connectivity."
    }
]

def get_commands():
    return json.dumps(commands)

def is_critical_command(cmd):
    # Check if the command contains any critical process names
    for process in critical_processes:
        if process in cmd:
            return True
    return False

def graceful_terminate(process):
    try:
        process.send_signal(signal.SIGINT)
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()

while True:  # Keep listening for messages
    message = sys.stdin.readline()
    try:
        data = json.loads(message.strip())
        command = data.get("command")
        if command == "get_commands":
            print(get_commands())
            sys.stdout.flush()
        elif command:
            if is_critical_command(command):
                logging.warning(f"Attempted to execute critical command: {command}")
                print(json.dumps({"error": "Command involves critical process, execution denied"}))
                sys.stdout.flush()
            else:
                logging.info(f"Executing command: {command}")
                process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                result = execute_command(command)
                if result.get("return_code") != 0:
                    logging.error(f"Command execution failed: {command}")
                    graceful_terminate(process)
                print(json.dumps(result))
                sys.stdout.flush()
        else:
            logging.error("No command provided")
            print(json.dumps({"error": "No command provided"}))
            sys.stdout.flush()
    except json.JSONDecodeError:
        logging.error("Invalid JSON")
        print(json.dumps({"error": "Invalid JSON"}))
        sys.stdout.flush()