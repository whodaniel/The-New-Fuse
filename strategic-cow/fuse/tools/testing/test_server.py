#!/usr/bin/env python3
"""
Test Server Utility for The New Fuse
-----------------------------------
This script starts two simple HTTP servers on ports 8000 and 8001. It is intended for development and testing of the Localhost Port Monitor feature in The New Fuse Chrome Extension.

Usage:
    python3 test_server.py

- The servers will run in the background on separate threads.
- Output will indicate which ports are active.
- Logging is suppressed for clean output.
- Press Ctrl+C to stop both servers.

Intended Audience:
    Developers working on or testing The New Fuse extension's local port monitoring capabilities.

Author: The New Fuse Team
"""

import http.server
import socketserver
import threading

# A simple handler that does nothing but allow the server to run.
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress logging to keep the output clean
        return

def run_server(port):
    """Runs a simple HTTP server on a given port."""
    try:
        # Use socketserver to allow reusing the address quickly
        with socketserver.TCPServer(("", port), QuietHandler) as httpd:
            print(f"Serving at port {port}")
            httpd.serve_forever()
    except OSError as e:
        print(f"Could not start server on port {port}: {e}")

if __name__ == "__main__":
    ports = [8000, 8001]
    threads = []

    print("Starting test servers on ports 8000 and 8001...")
    for port in ports:
        thread = threading.Thread(target=run_server, args=(port,))
        threads.append(thread)
        thread.start()

    print("Press Ctrl+C to stop.")