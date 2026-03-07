#!/usr/bin/env python3
"""
Example Python Agent - AG-UI Protocol Demo

This agent connects to The New Fuse AG-UI server and generates
self-contained HTML visualizations in real-time.

Requirements:
    pip install websockets asyncio

Usage:
    python python-agent-example.py
"""

import asyncio
import websockets
import json
import uuid
from datetime import datetime


class AGUIAgent:
    """Simple AG-UI Protocol Agent"""

    def __init__(self, agent_id: str, server_url: str = "ws://localhost:8765"):
        self.agent_id = agent_id
        self.server_url = server_url
        self.ws = None

    async def connect(self):
        """Connect to AG-UI server with agent identification"""
        headers = {"X-Agent-Id": self.agent_id}
        self.ws = await websockets.connect(self.server_url)
        # Note: headers are commented out due to compatibility issues with newer websockets versions in this environment
        # self.ws = await websockets.connect(self.server_url, extra_headers=headers)
        print(f"✅ Agent '{self.agent_id}' connected to AG-UI server")

    async def disconnect(self):
        """Gracefully disconnect from server"""
        if self.ws:
            await self.ws.close()
            print(f"👋 Agent '{self.agent_id}' disconnected")

    async def send_request(self, method: str, params: dict) -> dict:
        """Send AG-UI request and wait for response"""
        request = {
            "id": str(uuid.uuid4()),
            "type": "request",
            "method": method,
            "params": params
        }

        await self.ws.send(json.dumps(request))
        response_str = await self.ws.recv()
        response = json.loads(response_str)

        if response.get("type") == "error":
            raise Exception(f"AG-UI Error: {response['error']['message']}")

        return response.get("result", {})

    async def generate_agent_flow_visualization(self):
        """Generate agent communication flow visualization"""
        data = {
            "nodes": [
                {"id": "agent1", "name": "Data Collector", "type": "worker", "status": "active"},
                {"id": "agent2", "name": "Analyzer", "type": "processor", "status": "active"},
                {"id": "agent3", "name": "Reporter", "type": "output", "status": "idle"},
                {"id": "orchestrator", "name": "TNF Orchestrator", "type": "master", "status": "active"}
            ],
            "edges": [
                {"source": "orchestrator", "target": "agent1", "type": "command", "weight": 3},
                {"source": "agent1", "target": "agent2", "type": "data", "weight": 5},
                {"source": "agent2", "target": "agent3", "type": "data", "weight": 4},
                {"source": "agent3", "target": "orchestrator", "type": "status", "weight": 2}
            ]
        }

        result = await self.send_request("visualization.generate", {
            "type": "agent-flow",
            "data": data,
            "title": f"Agent Communication Flow - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "aiInsights": """
                <div style="padding: 20px; background: #f0f7ff; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1a73e8;">🤖 AI Analysis</h3>
                    <p><strong>Current System State:</strong> All agents operational</p>
                    <ul>
                        <li><strong>Data Collector:</strong> Processing 150 requests/min</li>
                        <li><strong>Analyzer:</strong> 95% accuracy, low latency</li>
                        <li><strong>Reporter:</strong> Idle, awaiting processed data</li>
                        <li><strong>Orchestrator:</strong> Coordinating 4 active workflows</li>
                    </ul>
                    <p><strong>Recommendation:</strong> System is healthy. Consider scaling Reporter
                    to handle upcoming data burst from Analyzer.</p>
                </div>
            """
        })

        return result

    async def generate_service_architecture_map(self):
        """Generate service architecture treemap visualization"""
        data = {
            "name": "The New Fuse",
            "children": [
                {
                    "name": "Frontend",
                    "value": 2500,
                    "children": [
                        {"name": "React Components", "value": 1200},
                        {"name": "State Management", "value": 800},
                        {"name": "UI Kit", "value": 500}
                    ]
                },
                {
                    "name": "Backend",
                    "value": 3500,
                    "children": [
                        {"name": "API Endpoints", "value": 1500},
                        {"name": "Agent Orchestrator", "value": 1000},
                        {"name": "Database Layer", "value": 1000}
                    ]
                },
                {
                    "name": "Infrastructure",
                    "value": 1500,
                    "children": [
                        {"name": "Docker Services", "value": 600},
                        {"name": "Redis Cache", "value": 400},
                        {"name": "PostgreSQL", "value": 500}
                    ]
                },
                {
                    "name": "Agents",
                    "value": 2000,
                    "children": [
                        {"name": "Task Agents", "value": 1200},
                        {"name": "MCP Integrations", "value": 800}
                    ]
                }
            ]
        }

        result = await self.send_request("visualization.generate", {
            "type": "service-map",
            "data": data,
            "title": f"Service Architecture Map - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "aiInsights": """
                <div style="padding: 20px; background: #fff4e6; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #e65100;">📊 Architecture Insights</h3>
                    <p><strong>Code Distribution:</strong></p>
                    <ul>
                        <li><strong>Backend:</strong> 36% (3,500 LOC) - Largest component</li>
                        <li><strong>Frontend:</strong> 26% (2,500 LOC)</li>
                        <li><strong>Agents:</strong> 21% (2,000 LOC)</li>
                        <li><strong>Infrastructure:</strong> 16% (1,500 LOC)</li>
                    </ul>
                    <p><strong>Recommendation:</strong> Backend is well-structured. Consider
                    extracting common agent patterns into shared library to reduce duplication.</p>
                </div>
            """
        })

        return result

    async def get_session_state(self, key: str):
        """Get session state variable"""
        result = await self.send_request("session.getState", {"key": key})
        return result.get("value")

    async def set_session_state(self, key: str, value: any):
        """Set session state variable"""
        await self.send_request("session.setState", {"key": key, "value": value})

    async def get_system_health(self):
        """Get AG-UI system health status"""
        result = await self.send_request("system.health", {})
        return result


async def main():
    """Main demo flow"""
    print("=" * 70)
    print("🚀 AG-UI Protocol Demo - Python Agent Example")
    print("=" * 70)
    print()

    # Create agent instance
    agent = AGUIAgent(agent_id="python-demo-agent")

    try:
        # Connect to AG-UI server
        await agent.connect()
        print()

        # Check system health
        print("📊 Checking system health...")
        health = await agent.get_system_health()
        print(f"   Status: {health.get('status', 'unknown')}")
        print(f"   Active Sessions: {health.get('activeSessions', 0)}")
        print()

        # Set session state
        print("💾 Setting session state...")
        await agent.set_session_state("demo_start_time", datetime.now().isoformat())
        await agent.set_session_state("visualizations_generated", 0)
        print("   ✅ Session state initialized")
        print()

        # Generate agent flow visualization
        print("🎨 Generating Agent Communication Flow visualization...")
        result1 = await agent.generate_agent_flow_visualization()
        if result1.get("success"):
            print(f"   ✅ Visualization created: {result1['filePath']}")
            print(f"   📄 Open in browser: file://{result1['filePath']}")
        print()

        # Generate service architecture map
        print("🎨 Generating Service Architecture Map visualization...")
        result2 = await agent.generate_service_architecture_map()
        if result2.get("success"):
            print(f"   ✅ Visualization created: {result2['filePath']}")
            print(f"   📄 Open in browser: file://{result2['filePath']}")
        print()

        # Update session state
        await agent.set_session_state("visualizations_generated", 2)
        viz_count = await agent.get_session_state("visualizations_generated")
        print(f"📈 Session Update: Generated {viz_count} visualizations")
        print()

        # Summary
        print("=" * 70)
        print("✅ Demo Complete!")
        print("=" * 70)
        print()
        print("What happened:")
        print("  1. ✅ Connected to AG-UI server via WebSocket")
        print("  2. ✅ Checked system health status")
        print("  3. ✅ Managed session state (set/get)")
        print("  4. ✅ Generated 2 self-contained HTML visualizations")
        print("  5. ✅ Each visualization is permanent, shareable, offline-ready")
        print()
        print("Next Steps:")
        print("  • Open the generated HTML files in your browser")
        print("  • Customize the data for your use case")
        print("  • Integrate into your agent workflows")
        print("  • Share visualizations with your team")
        print()

    except ConnectionRefusedError:
        print("❌ ERROR: Could not connect to AG-UI server")
        print()
        print("Please ensure:")
        print("  1. The New Fuse backend is running")
        print("  2. AG-UI server is started on port 8765")
        print("  3. Run: pnpm run dev (from The New Fuse root)")
        print()

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        # Disconnect
        await agent.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
