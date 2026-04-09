import asyncio
import websockets
import json
import ssl

WS_URL = "wss://tnf-cloud-sandbox-v2-production.up.railway.app/ws"

async def call_tool(ws, name, args):
    req_id = str(uuid.uuid4())
    msg = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {
            "name": name,
            "arguments": args
        }
    }
    await ws.send(json.dumps(msg))

    # We need to loop because init response might come first or heartbeats
    async for response in ws:
        data = json.loads(response)
        if data.get("id") == req_id:
            return data

async def main():
    # Create unverified context
    ssl_context = ssl._create_unverified_context()

    print(f"Connecting to {WS_URL}...")
    async with websockets.connect(WS_URL, ssl=ssl_context) as ws:
        print("Connected!")
        # Init
        await ws.send(json.dumps({
            "jsonrpc": "2.0",
            "id": "init",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "fixer", "version": "1.0"}
            }
        }))

        # Install
        print("Installing Playwright...")
        # Note: running as app-user, need to ensure paths are writable.
        # Home is likely /home/app-user (from logs).
        # We also need to fix npx cache permissions which caused EACCES
        cmd = 'export NPM_CONFIG_CACHE=/tmp/npm-cache && export PLAYWRIGHT_BROWSERS_PATH=/home/app-user/pw-browsers && mkdir -p $PLAYWRIGHT_BROWSERS_PATH && echo "Installing..." && npx playwright install chromium --with-deps && echo "INSTALLED to $PLAYWRIGHT_BROWSERS_PATH"'

        res = await call_tool(ws, "run_command", {"command": cmd})
        print(f"Result: {res}")

if __name__ == "__main__":
    asyncio.run(main())
