import subprocess
import json
import os
import sys
import time

def call_stitch(tool_name, tool_args, api_key=None, timeout=120):
    """
    Calls the stitch-mcp server via JSON-RPC over stdio.
    """
    if not api_key:
        api_key = os.environ.get("STITCH_API_KEY")
    
    if not api_key:
        print("Error: STITCH_API_KEY not found in environment or arguments.")
        sys.exit(1)
        
    env = os.environ.copy()
    env["STITCH_API_KEY"] = api_key
    
    # Start the MCP server
    try:
        process = subprocess.Popen(
            ["stitch-mcp", "--quiet"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            bufsize=1 # Line buffered
        )
    except FileNotFoundError:
        print("Error: 'stitch-mcp' executable not found in PATH.")
        sys.exit(1)

    # Wait for the server to be ready
    start_time = time.time()
    while True:
        if time.time() - start_time > 10:
            print("Error: Timed out waiting for 'Server ready' from stitch-mcp.")
            process.terminate()
            sys.exit(1)
        line = process.stderr.readline()
        if "Server ready" in line:
            break

    # 1. JSON-RPC: initialize
    init_req = {
        "jsonrpc": "2.0",
        "id": 0,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "stitch-direct-skill", "version": "1.0"}
        }
    }
    process.stdin.write(json.dumps(init_req) + "\n")
    
    # Wait for initialize response
    while True:
        line = process.stdout.readline()
        if not line: break
        try:
            resp = json.loads(line)
            if resp.get("id") == 0:
                break
        except: continue

    # 2. JSON-RPC: tools/call
    call_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": tool_args
        }
    }
    process.stdin.write(json.dumps(call_req) + "\n")

    # Wait for the tool response
    result = None
    start_time = time.time()
    while True:
        if time.time() - start_time > timeout:
            print(f"Error: Tool call '{tool_name}' timed out after {timeout} seconds.")
            break
            
        line = process.stdout.readline()
        if not line: break
        try:
            resp = json.loads(line)
            if resp.get("id") == 1:
                if "error" in resp:
                    print(f"Error: {json.dumps(resp['error'])}")
                else:
                    result = resp.get("result")
                break
        except: continue

    process.terminate()
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 stitch_rpc.py <tool_name> [tool_args_json]")
        sys.exit(1)
        
    tool = sys.argv[1]
    args = json.loads(sys.argv[2] if len(sys.argv) > 2 else "{}")
    
    res = call_stitch(tool, args)
    if res:
        print(json.dumps(res, indent=2))
