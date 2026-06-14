"""
Microsoft Agent Framework + Self-Contained Visualization Integration

This example shows how to use our visualization generator as an AG-UI tool
within Microsoft's Agent Framework.

Requirements:
    pip install agent-framework-ag-ui --pre
    pip install microsoft-agent-framework
"""

from typing import Dict, Any
import json
import subprocess
from pathlib import Path

# Microsoft Agent Framework imports
# from microsoft.agent_framework import Agent, tool
# from microsoft.agent_framework.ag_ui import AGUIHost


class VisualizationTool:
    """
    Self-Contained Visualization Generator Tool for Microsoft Agent Framework
    """

    name = "generate_visualization"
    description = (
        "Generate an interactive, self-contained HTML visualization from hierarchical data. "
        "Creates a single HTML file with embedded D3.js, data, and visualization logic. "
        "Perfect for sharing, archival, and offline viewing."
    )

    def __init__(self):
        # Path to our Node.js tool
        self.tool_path = Path(__file__).parent.parent.parent / "tools" / "ag-ui-tool.js"

    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the visualization generation tool

        Args:
            params: Tool parameters including data, title, metrics, etc.

        Returns:
            Dictionary with success status and file information
        """

        # Convert params to JSON
        params_json = json.dumps(params)

        # Call Node.js tool via subprocess
        result = subprocess.run(
            ["node", str(self.tool_path), "--params", params_json],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            return {
                "success": False,
                "error": result.stderr,
                "message": f"Tool execution failed: {result.stderr}"
            }


# Example 1: Simple Visualization Agent
class BundleAnalyzerAgent:
    """
    Agent that analyzes bundle sizes and creates visualizations
    """

    def __init__(self):
        self.viz_tool = VisualizationTool()

    async def analyze_bundle(self, bundle_data: Dict[str, Any]) -> str:
        """
        Analyze bundle data and create visualization with insights
        """

        # 1. Analyze the data (agent logic)
        total_size = self._calculate_total_size(bundle_data)
        largest_items = self._find_largest_items(bundle_data, top_n=3)

        # 2. Generate AI insights
        insights_html = f"""
        <p><strong>Total Bundle Size:</strong> {self._format_bytes(total_size)}</p>

        <p><strong>Largest Dependencies:</strong></p>
        <ul>
        {''.join(f'<li>{item["name"]}: {self._format_bytes(item["size"])}</li>' for item in largest_items)}
        </ul>

        <p><strong>Recommendations:</strong></p>
        <ul>
            <li>Consider code-splitting for large dependencies</li>
            <li>Use dynamic imports for non-critical code</li>
            <li>Evaluate alternatives for the largest libraries</li>
        </ul>
        """

        # 3. Generate visualization with insights
        result = await self.viz_tool.execute({
            "data": bundle_data,
            "title": "Bundle Size Analysis",
            "subtitle": "Interactive dependency exploration",
            "metrics": {
                "size": "Bundle Size",
                "gzipSize": "Gzipped Size",
                "count": "Module Count"
            },
            "defaultMetric": "size",
            "aiInsights": insights_html,
            "primaryColor": "#f59e0b"
        })

        if result["success"]:
            return f"✅ Analysis complete! Visualization saved to: {result['filePath']}"
        else:
            return f"❌ Failed to generate visualization: {result.get('error', 'Unknown error')}"

    def _calculate_total_size(self, data: Dict) -> int:
        """Calculate total size recursively"""
        total = data.get("size", 0)
        if "children" in data:
            for child in data["children"]:
                total += self._calculate_total_size(child)
        return total

    def _find_largest_items(self, data: Dict, top_n: int = 3) -> list:
        """Find largest leaf items"""
        items = []

        def collect_items(node):
            if "children" in node:
                for child in node["children"]:
                    collect_items(child)
            elif "size" in node:
                items.append({"name": node["name"], "size": node["size"]})

        collect_items(data)
        return sorted(items, key=lambda x: x["size"], reverse=True)[:top_n]

    @staticmethod
    def _format_bytes(bytes: int) -> str:
        """Format bytes as human-readable string"""
        for unit in ["B", "KB", "MB", "GB"]:
            if bytes < 1024:
                return f"{bytes:.2f} {unit}"
            bytes /= 1024
        return f"{bytes:.2f} TB"


# Example 2: Interactive Data Exploration Agent
async def data_exploration_agent_example():
    """
    Example: Agent that helps users explore data and creates snapshots
    """

    # Simulated agent conversation
    print("User: Show me our Q4 sales data by region")
    print("Agent: Analyzing Q4 sales data...")

    # Agent fetches and processes data
    sales_data = {
        "name": "Q4 2025 Sales",
        "children": [
            {
                "name": "North America",
                "children": [
                    {"name": "USA", "revenue": 2500000, "deals": 145},
                    {"name": "Canada", "revenue": 450000, "deals": 38}
                ]
            },
            {
                "name": "Europe",
                "children": [
                    {"name": "UK", "revenue": 890000, "deals": 67},
                    {"name": "Germany", "revenue": 1200000, "deals": 89},
                    {"name": "France", "revenue": 670000, "deals": 52}
                ]
            },
            {
                "name": "Asia Pacific",
                "children": [
                    {"name": "Japan", "revenue": 980000, "deals": 71},
                    {"name": "Australia", "revenue": 560000, "deals": 45}
                ]
            }
        ]
    }

    print("Agent: I've found Q4 sales data across 7 countries")
    print("       Total revenue: $7.25M across 507 deals")
    print("\nUser: Create a shareable visualization for the team meeting")

    # Agent generates visualization
    viz_tool = VisualizationTool()
    result = await viz_tool.execute({
        "data": sales_data,
        "title": "Q4 2025 Sales Analysis",
        "subtitle": "Revenue and deal distribution by region",
        "metrics": {
            "revenue": "Revenue ($)",
            "deals": "Number of Deals"
        },
        "defaultMetric": "revenue",
        "aiInsights": """
        <p><strong>Key Insights:</strong></p>
        <ul>
            <li>North America leads with $2.95M (41% of total revenue)</li>
            <li>Germany is the top individual country performer ($1.2M)</li>
            <li>Average deal size: $14,300</li>
        </ul>
        <p><strong>Trends:</strong></p>
        <ul>
            <li>European region shows strong growth potential</li>
            <li>Asia Pacific has highest deal close rate</li>
        </ul>
        """,
        "primaryColor": "#10b981"
    })

    print(f"\nAgent: {result['message']}")
    print(f"       File: {result['filePath']}")
    print(f"       Size: {result['fileSize'] / 1024:.2f} KB")


# Example 3: Automated CI/CD Report Generator
async def cicd_report_example():
    """
    Example: CI/CD pipeline that generates bundle reports
    """

    print("=== CI/CD Pipeline: Bundle Analysis ===\n")

    # Simulated build output
    build_data = {
        "name": "app-v2.1.0",
        "children": [
            {
                "name": "vendor",
                "children": [
                    {"name": "react", "size": 121543, "gzipSize": 39234},
                    {"name": "d3", "size": 98765, "gzipSize": 32109},
                    {"name": "framer-motion", "size": 156789, "gzipSize": 48234}
                ]
            },
            {
                "name": "app",
                "children": [
                    {"name": "main.js", "size": 45678, "gzipSize": 14532},
                    {"name": "utils.js", "size": 23456, "gzipSize": 8234}
                ]
            }
        ]
    }

    # Agent analyzes
    print("📊 Analyzing build output...")

    total_size = 446231  # Pre-calculated
    gzip_size = 142343

    # Generate insights
    insights = f"""
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 8px 0; border-radius: 4px;">
        <strong>⚠️ Warning:</strong> Bundle size increased by 5.2% since last build
    </div>

    <p><strong>Build Statistics:</strong></p>
    <ul>
        <li>Total Size: {total_size / 1024:.2f} KB</li>
        <li>Gzipped: {gzip_size / 1024:.2f} KB</li>
        <li>Compression Ratio: {(1 - gzip_size/total_size) * 100:.1f}%</li>
    </ul>

    <p><strong>Size Analysis:</strong></p>
    <ul>
        <li>Vendor libraries: 84% of total bundle</li>
        <li>Application code: 16% of total bundle</li>
        <li>framer-motion is the largest dependency (156 KB)</li>
    </ul>

    <p><strong>Optimization Suggestions:</strong></p>
    <ol>
        <li>Consider lazy-loading framer-motion</li>
        <li>Evaluate if all D3 modules are necessary</li>
        <li>Enable tree-shaking for unused code</li>
    </ol>
    """

    # Generate report
    viz_tool = VisualizationTool()
    result = await viz_tool.execute({
        "data": build_data,
        "title": "Build Report - v2.1.0",
        "subtitle": "Bundle size analysis and recommendations",
        "metrics": {
            "size": "Size",
            "gzipSize": "Gzipped"
        },
        "aiInsights": insights,
        "outputPath": "./reports/build-v2.1.0.html"
    })

    print(f"✅ {result['message']}")
    print(f"\n📄 Report generated: {result['filePath']}")
    print("   - Commit to repository")
    print("   - Post to Slack #engineering")
    print("   - Archive for historical comparison")


# Main execution examples
async def main():
    """Run example scenarios"""

    print("\n" + "="*60)
    print("Microsoft Agent Framework + Self-Contained Visualizations")
    print("="*60 + "\n")

    # Example 1: Bundle Analysis
    print("\n--- Example 1: Bundle Analyzer Agent ---\n")
    agent = BundleAnalyzerAgent()

    test_bundle = {
        "name": "app",
        "children": [
            {"name": "react", "size": 121543, "gzipSize": 39234},
            {"name": "d3", "size": 98765, "gzipSize": 32109}
        ]
    }

    result = await agent.analyze_bundle(test_bundle)
    print(result)

    # Example 2: Data Exploration
    print("\n--- Example 2: Data Exploration Agent ---\n")
    await data_exploration_agent_example()

    # Example 3: CI/CD Integration
    print("\n\n--- Example 3: CI/CD Report Generator ---\n")
    await cicd_report_example()

    print("\n" + "="*60)
    print("Examples Complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
