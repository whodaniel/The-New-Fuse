#!/usr/bin/env python3
import websocket
import json

try:
    ws = websocket.create_connection("ws://127.0.0.1:37777/extension", timeout=10)
    print("Connected to browser relay!")
    
    # Send a message to get tabs
    msg = json.dumps({"action": "get_tabs"})
    ws.send(msg)
    
    # Receive response
    response = ws.recv()
    print("Response:", response)
    
    ws.close()
except Exception as e:
    print(f"Error: {e}")