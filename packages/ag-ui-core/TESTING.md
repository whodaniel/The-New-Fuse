# AG-UI Core Testing Guide

This guide explains how to validate the AG-UI protocol integration using the
provided example agents.

## Prerequisites

- Node.js & pnpm
- Python 3.x
- Built `@the-new-fuse/ag-ui-core` package

## 1. Build the Package

```bash
cd packages/ag-ui-core
pnpm install
pnpm run build
```

## 2. Start the Orchestrator Server

You can run the standalone orchestrator script:

```bash
node scripts/start-server.js
```

Expected output:

```
✅ AG-UI Orchestrator running on port 8765
```

## 3. Run the Python Agent Example

In a new terminal:

```bash
cd packages/ag-ui-core/examples
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python python-agent-example.py
```

## 4. Verify Results

The Python agent should:

1. Connect to the server
2. Send visualization requests
3. Print the path to the generated HTML files

Example output:

```
✅ Visualization created: /tmp/agent-flow-xxxx.html
```

Open the generated HTML files in your browser to verify they render correctly.

## 5. Troubleshooting

- **Connection Refused**: Ensure the server script is running and port 8765 is
  free.
- **Module Not Found**: Ensure `pnpm run build` completed successfully in
  `packages/ag-ui-core`.
