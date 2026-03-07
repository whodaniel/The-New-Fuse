# AG-UI Agent Examples

Practical examples demonstrating how to build agents that connect to The New
Fuse AG-UI server.

## Python Agent Example

A complete Python agent that demonstrates:

- WebSocket connection to AG-UI server
- AG-UI protocol message format
- Session state management
- Real-time visualization generation
- Error handling and graceful disconnection

### Requirements

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install websockets
```

### Usage

1. **Start The New Fuse Backend:**

   ```bash
   cd /path/to/The-New-Fuse
   pnpm run docker:start  # Start infrastructure
   pnpm run dev           # Start all services
   ```

2. **Run the Python Agent:**

   ```bash
   python python-agent-example.py
   ```

3. **Open Generated Visualizations:** The agent will create self-contained HTML
   files in `/tmp/`
   ```bash
   # Example output:
   # ✅ Visualization created: /tmp/agent-flow-1234567890.html
   # 📄 Open in browser: file:///tmp/agent-flow-1234567890.html
   ```

### What It Does

The example agent performs the following sequence:

1. **Connects** to AG-UI server at `ws://localhost:8765`
2. **Checks** system health status
3. **Manages** session state (set/get variables)
4. **Generates** Agent Communication Flow visualization
5. **Generates** Service Architecture Map visualization
6. **Disconnects** gracefully

### Output

```
======================================================================
🚀 AG-UI Protocol Demo - Python Agent Example
======================================================================

✅ Agent 'python-demo-agent' connected to AG-UI server

📊 Checking system health...
   Status: healthy
   Active Sessions: 1

💾 Setting session state...
   ✅ Session state initialized

🎨 Generating Agent Communication Flow visualization...
   ✅ Visualization created: /tmp/agent-flow-1703264123.html
   📄 Open in browser: file:///tmp/agent-flow-1703264123.html

🎨 Generating Service Architecture Map visualization...
   ✅ Visualization created: /tmp/service-map-1703264124.html
   📄 Open in browser: file:///tmp/service-map-1703264124.html

📈 Session Update: Generated 2 visualizations

======================================================================
✅ Demo Complete!
======================================================================
```

### Customization

#### Generate Your Own Data Visualizations

Edit the data structures in `python-agent-example.py`:

**Agent Flow Data:**

```python
data = {
    "nodes": [
        {"id": "agent1", "name": "Your Agent", "type": "worker", "status": "active"},
        # ... add your agents
    ],
    "edges": [
        {"source": "agent1", "target": "agent2", "type": "data", "weight": 5},
        # ... add your connections
    ]
}
```

**Service Architecture Data:**

```python
data = {
    "name": "Your System",
    "children": [
        {
            "name": "Component 1",
            "value": 1000,  # Size/weight
            "children": [...]
        },
        # ... add your components
    ]
}
```

#### Add AI Insights

Customize the AI analysis section:

```python
aiInsights = """
    <div style="padding: 20px; background: #f0f7ff; border-radius: 8px;">
        <h3>🤖 Your Analysis</h3>
        <p>Your custom insights here...</p>
    </div>
"""
```

### AG-UI Protocol Methods

The example demonstrates these AG-UI methods:

#### `system.health`

Get system status and active sessions count.

```python
health = await agent.get_system_health()
# Returns: {"status": "healthy", "activeSessions": 1, ...}
```

#### `session.setState`

Store data in agent session.

```python
await agent.set_session_state("my_key", "my_value")
```

#### `session.getState`

Retrieve session data.

```python
value = await agent.get_session_state("my_key")
```

#### `visualization.generate`

Create self-contained HTML visualization.

```python
result = await agent.send_request("visualization.generate", {
    "type": "agent-flow",  # or "service-map", "workflow-deps", etc.
    "data": {...},
    "title": "My Visualization",
    "aiInsights": "<p>AI analysis</p>"
})
# Returns: {"success": true, "filePath": "/tmp/...", "html": "<!DOCTYPE..."}
```

### Visualization Types

| Type              | Description                       | Data Format                      |
| ----------------- | --------------------------------- | -------------------------------- |
| `agent-flow`      | Agent communication network graph | `{nodes: [...], edges: [...]}`   |
| `service-map`     | Service architecture treemap      | `{name: "...", children: [...]}` |
| `workflow-deps`   | Workflow dependency graph         | `{nodes: [...], edges: [...]}`   |
| `bundle-analysis` | Bundle size treemap               | `{name: "...", children: [...]}` |
| `monitoring`      | Real-time metrics dashboard       | `{metrics: {...}}`               |

### Error Handling

The example includes comprehensive error handling:

```python
try:
    await agent.connect()
    # ... operations
except websockets.exceptions.ConnectionRefusedError:
    print("❌ Could not connect to AG-UI server")
    print("Ensure backend is running: pnpm run dev")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
finally:
    await agent.disconnect()
```

### Building Your Own Agent

Use this example as a template:

```python
from python_agent_example import AGUIAgent

class MyCustomAgent(AGUIAgent):
    async def my_workflow(self):
        # 1. Collect data
        data = self.collect_my_data()

        # 2. Generate visualization
        result = await self.send_request("visualization.generate", {
            "type": "agent-flow",
            "data": data,
            "title": "My Workflow Results",
            "aiInsights": self.analyze_data(data)
        })

        # 3. Save or share result
        return result["filePath"]

# Use it
agent = MyCustomAgent("my-agent-id")
await agent.connect()
filepath = await agent.my_workflow()
await agent.disconnect()
```

## Node.js/TypeScript Agent Example

A complete TypeScript agent demonstrating the same features as the Python
example, but using Node.js WebSocket client.

### Requirements

```bash
npm install
# or
pnpm install
```

Or install manually:

```bash
npm install ws uuid
npm install -D @types/ws @types/uuid tsx typescript
```

### Usage

1. **Start The New Fuse Backend:**

   ```bash
   cd /path/to/The-New-Fuse
   pnpm run docker:start
   pnpm run dev
   ```

2. **Run the Node.js Agent:**
   ```bash
   npm run node
   # or with tsx directly
   npx tsx nodejs-agent-example.ts
   ```

### Features

The Node.js example demonstrates:

- TypeScript class-based agent design
- Promise-based async/await patterns
- WebSocket client with message handling
- Request/response correlation using UUID
- Timeout handling for long-running requests
- Graceful error handling and disconnection

### What It Generates

The Node.js agent creates two visualizations:

1. **Agent Communication Flow** - Network graph of agent interactions
2. **Workflow Dependency Graph** - Critical path analysis of workflows

Both are self-contained HTML files with embedded D3.js visualizations.

## Integration with The New Fuse

These examples can be integrated into:

- **Workflow Steps**: Generate visualizations as workflow outputs
- **Agent Tasks**: Create reports as agent artifacts
- **Scheduled Jobs**: Automated periodic visualization generation
- **API Endpoints**: On-demand visualization via REST API

## Troubleshooting

### "Connection Refused"

**Problem:** Agent can't connect to AG-UI server

**Solution:**

1. Ensure backend is running: `pnpm run dev`
2. Check AG-UI is on port 8765: `netstat -an | grep 8765`
3. Verify no firewall blocking WebSocket connections

### "Module not found: websockets"

**Problem:** Python dependencies not installed

**Solution:**

```bash
pip install -r requirements.txt
```

### "No such file or directory: /tmp/..."

**Problem:** Visualization file path not found

**Solution:**

- The file is created on the **server side** (where backend runs)
- If backend is remote, use SCP/SFTP to download files
- Or configure `VIZ_OUTPUT_DIR` in backend `.env` to shared location

## Next Steps

1. **Customize the data** to match your system
2. **Add your AI analysis** to the insights section
3. **Integrate into workflows** as automated reporting
4. **Build multi-agent systems** that collaborate via AG-UI
5. **Create dashboards** by combining multiple visualizations

## Learn More

- [AG-UI Protocol Specification](https://docs.ag-ui.com)
- [The New Fuse Documentation](../../../README.md)
- [Visualization Templates](../../../visualizations/)
- [AG-UI Core Package](../README.md)
