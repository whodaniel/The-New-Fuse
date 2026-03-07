# AG-UI Integration Guide

## Quick Start: Add Visualization Generation to Your Agent

### 5-Minute Setup

**Step 1:** Test the AG-UI tool standalone
```bash
cd /path/to/self-contained-visualizations
chmod +x tools/ag-ui-tool.js
node tools/ag-ui-tool.js
```

This will generate a test visualization and show you the output format.

**Step 2:** Use with Microsoft Agent Framework (Python)
```python
from tools.ag_ui_tool import VisualizationTool

# Create tool instance
viz_tool = VisualizationTool()

# Generate visualization
result = await viz_tool.execute({
    "data": your_hierarchical_data,
    "title": "My Analysis",
    "aiInsights": "AI-generated insights here"
})

print(f"Generated: {result['filePath']}")
```

**Step 3:** Add to your agent's toolset
```python
from microsoft.agent_framework import Agent

agent = Agent(
    name="DataAnalyzer",
    tools=[
        VisualizationTool(),  # Add our tool
        # ... your other tools
    ]
)
```

Now your agent can generate visualizations!

---

## Integration Patterns

### Pattern 1: Agent-Curated Reports

**Use Case:** Agent analyzes data → creates visualization with insights

```python
async def create_analysis_report(data):
    # 1. Agent analyzes
    insights = await agent.analyze(data)

    # 2. Agent generates visualization
    result = await viz_tool.execute({
        "data": data,
        "title": "Analysis Report",
        "aiInsights": insights.to_html(),
        "metrics": insights.suggested_metrics
    })

    # 3. Return shareable artifact
    return result["filePath"]
```

**Benefits:**
- ✅ AI-powered analysis
- ✅ Permanent artifact
- ✅ Shareable via email/Slack
- ✅ No ongoing dependencies

### Pattern 2: Session Snapshots

**Use Case:** Live AG-UI session → user requests permanent snapshot

```python
# During live AG-UI session
@agent.tool
async def save_snapshot(session_state):
    """Save current exploration as HTML file"""

    result = await viz_tool.execute({
        "data": session_state.current_view,
        "title": f"Snapshot - {datetime.now()}",
        "aiInsights": session_state.conversation_summary
    })

    return f"Saved snapshot: {result['filePath']}"
```

**User flow:**
```
User: "Show me Q4 sales by region"
Agent: [Interactive exploration]
User: "Save this for the team meeting"
Agent: "✅ Saved snapshot: q4-sales-2025-12-21.html"
```

### Pattern 3: CI/CD Integration

**Use Case:** Automated reporting in build pipelines

```yaml
# GitHub Actions
- name: Generate Bundle Report
  run: |
    python scripts/analyze_bundle.py \
      --output reports/bundle-${{ github.sha }}.html

# The Python script uses our AG-UI tool
# to generate the visualization
```

**Benefits:**
- ✅ Automated generation
- ✅ Historical tracking (commit to repo)
- ✅ Easy comparison over time
- ✅ No dashboard to maintain

---

## Examples by Framework

### Microsoft Agent Framework (.NET)

```csharp
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI;

public class VisualizationTool : ITool
{
    public string Name => "generate_visualization";

    public async Task<ToolResult> InvokeAsync(
        ToolInvocationContext context,
        CancellationToken cancellationToken)
    {
        var data = context.Parameters["data"];
        var title = context.Parameters["title"];

        // Call our Node.js tool
        var result = await ExecuteNodeTool(data, title);

        return new ToolResult
        {
            Success = result.Success,
            Output = result.FilePath
        };
    }
}
```

### LangGraph (Python)

```python
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool

@tool
async def generate_visualization(
    data: dict,
    title: str,
    insights: str = None
) -> str:
    """Generate self-contained HTML visualization"""

    viz_tool = VisualizationTool()
    result = await viz_tool.execute({
        "data": data,
        "title": title,
        "aiInsights": insights
    })

    return result["filePath"]

# Add to graph
from langgraph.graph import StateGraph

graph = StateGraph()
graph.add_node("tools", ToolNode([generate_visualization]))
```

### CrewAI (Python)

```python
from crewai import Agent, Task, Tool

visualization_tool = Tool(
    name="Generate Visualization",
    description="Create interactive HTML visualizations",
    func=lambda data: viz_tool.execute(data)
)

analyst = Agent(
    role="Data Analyst",
    goal="Analyze data and create reports",
    tools=[visualization_tool]
)

task = Task(
    description="Analyze bundle sizes and create visualization",
    agent=analyst
)
```

---

## Advanced Usage

### Custom AI Insights Template

```python
def format_insights(analysis_results):
    """Format AI analysis as HTML for visualization"""

    return f"""
    <div class="ai-insights">
        <h3>🤖 AI Analysis</h3>

        <div class="metric-cards">
            <div class="card">
                <strong>Total Size</strong>
                <span>{analysis_results.total_size}</span>
            </div>
            <div class="card">
                <strong>Largest Item</strong>
                <span>{analysis_results.largest_item}</span>
            </div>
        </div>

        <h4>Key Findings</h4>
        <ul>
        {''.join(f'<li>{finding}</li>' for finding in analysis_results.findings)}
        </ul>

        <h4>Recommendations</h4>
        <ol>
        {''.join(f'<li>{rec}</li>' for rec in analysis_results.recommendations)}
        </ol>

        <div class="confidence">
            Confidence: {analysis_results.confidence}%
        </div>
    </div>
    """
```

### Multi-Report Generation

```python
async def generate_multi_view_report(data):
    """Generate multiple visualizations from same data"""

    views = [
        {
            "title": "Size Analysis",
            "metric": "size",
            "color": "#f59e0b"
        },
        {
            "title": "Count Analysis",
            "metric": "count",
            "color": "#10b981"
        },
        {
            "title": "Performance Analysis",
            "metric": "performance",
            "color": "#3b82f6"
        }
    ]

    results = []
    for view in views:
        result = await viz_tool.execute({
            "data": data,
            "title": view["title"],
            "defaultMetric": view["metric"],
            "primaryColor": view["color"],
            "outputPath": f"output/{view['title'].lower().replace(' ', '-')}.html"
        })
        results.append(result)

    return results
```

### Session Recording

```python
class SessionRecorder:
    """Record AG-UI session and generate artifacts"""

    def __init__(self):
        self.events = []
        self.snapshots = []

    async def record_event(self, event):
        """Record session event"""
        self.events.append(event)

    async def create_snapshot(self, name):
        """Create visualization snapshot"""

        current_data = self._build_data_from_events()

        result = await viz_tool.execute({
            "data": current_data,
            "title": f"Session Snapshot: {name}",
            "aiInsights": self._summarize_conversation()
        })

        self.snapshots.append(result)
        return result

    async def export_session(self):
        """Export entire session as HTML"""

        return {
            "events": self.events,
            "snapshots": self.snapshots,
            "summary": self._generate_summary()
        }
```

---

## Data Format Requirements

### Required Structure

```javascript
{
  "name": "root",           // Required
  "children": [             // Optional (leaf nodes don't need this)
    {
      "name": "Category",   // Required
      "size": 100,          // Optional - any numeric properties
      "count": 5,           // become available as metrics
      "custom": 42,
      "children": [...]     // Nested structure
    }
  ]
}
```

### Converting from Common Formats

**From flat list to hierarchy:**

```python
def build_hierarchy(items, group_by):
    """Convert flat list to hierarchical structure"""

    hierarchy = {"name": "root", "children": []}

    for item in items:
        # Group items by category
        category = item[group_by]

        # Find or create category node
        cat_node = next(
            (c for c in hierarchy["children"] if c["name"] == category),
            None
        )

        if not cat_node:
            cat_node = {"name": category, "children": []}
            hierarchy["children"].append(cat_node)

        # Add item
        cat_node["children"].append({
            "name": item["name"],
            "size": item["size"],
            "count": item.get("count", 1)
        })

    return hierarchy
```

**From nested dict to AG-UI format:**

```python
def dict_to_hierarchy(data, name="root"):
    """Convert nested dict to hierarchical structure"""

    if isinstance(data, dict):
        children = []
        metrics = {}

        for key, value in data.items():
            if isinstance(value, (dict, list)):
                children.append(dict_to_hierarchy(value, key))
            elif isinstance(value, (int, float)):
                metrics[key] = value

        result = {"name": name, **metrics}
        if children:
            result["children"] = children

        return result
    elif isinstance(data, list):
        return {
            "name": name,
            "children": [dict_to_hierarchy(item, f"Item {i}") for i, item in enumerate(data)]
        }
    else:
        return {"name": name, "value": data}
```

---

## Deployment Patterns

### Pattern 1: Serverless Function

```python
# AWS Lambda / Azure Functions
async def lambda_handler(event, context):
    """Generate visualization on demand"""

    data = json.loads(event["body"])

    viz_tool = VisualizationTool()
    result = await viz_tool.execute(data)

    # Upload to S3
    s3_url = upload_to_s3(result["filePath"])

    return {
        "statusCode": 200,
        "body": json.dumps({
            "url": s3_url,
            "size": result["fileSize"]
        })
    }
```

### Pattern 2: Scheduled Reports

```python
# Cron job / scheduled task
async def daily_report():
    """Generate daily analytics report"""

    # Fetch data
    data = await fetch_daily_analytics()

    # Agent analyzes
    insights = await agent.analyze(data)

    # Generate visualization
    result = await viz_tool.execute({
        "data": data,
        "title": f"Daily Report - {date.today()}",
        "aiInsights": insights
    })

    # Send to stakeholders
    send_email(
        to=["team@company.com"],
        subject="Daily Analytics Report",
        attachments=[result["filePath"]]
    )
```

### Pattern 3: On-Demand API

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class VisualizationRequest(BaseModel):
    data: dict
    title: str
    insights: str = None

@app.post("/generate")
async def generate_viz(request: VisualizationRequest):
    """API endpoint for visualization generation"""

    viz_tool = VisualizationTool()
    result = await viz_tool.execute(request.dict())

    return {
        "success": result["success"],
        "file_url": result["url"],
        "file_size": result["fileSize"]
    }
```

---

## Testing

### Unit Test Example

```python
import pytest

@pytest.mark.asyncio
async def test_visualization_generation():
    """Test basic visualization generation"""

    viz_tool = VisualizationTool()

    result = await viz_tool.execute({
        "data": {
            "name": "test",
            "children": [
                {"name": "item1", "size": 100},
                {"name": "item2", "size": 200}
            ]
        },
        "title": "Test Viz"
    })

    assert result["success"] == True
    assert "filePath" in result
    assert result["fileSize"] > 0


@pytest.mark.asyncio
async def test_with_insights():
    """Test visualization with AI insights"""

    viz_tool = VisualizationTool()

    result = await viz_tool.execute({
        "data": test_data,
        "aiInsights": "<p>Test insights</p>"
    })

    # Verify insights are embedded
    with open(result["filePath"]) as f:
        html = f.read()
        assert "Test insights" in html
```

---

## Troubleshooting

### Common Issues

**1. "Data must have a root 'name' property"**
```python
# ❌ Wrong
data = {"children": [...]}

# ✅ Correct
data = {"name": "root", "children": [...]}
```

**2. "Module not found: VisualizationGenerator"**
```bash
# Ensure you're in the correct directory
cd /path/to/self-contained-visualizations

# Or set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/self-contained-visualizations"
```

**3. Generated file won't open**
```python
# Check file permissions
chmod 644 output/viz.html

# Use absolute path
import os
abs_path = os.path.abspath(result["filePath"])
```

---

## Best Practices

### 1. Data Preparation
```python
# Clean data before visualization
def prepare_data(raw_data):
    """Prepare data for visualization"""

    # Remove None values
    # Ensure numeric types
    # Validate hierarchy
    # Limit depth if needed

    return cleaned_data
```

### 2. Insight Generation
```python
# Structure insights consistently
def generate_insights(analysis):
    """Generate structured insights"""

    return {
        "summary": "...",
        "key_metrics": [...],
        "findings": [...],
        "recommendations": [...],
        "confidence": 0.95
    }
```

### 3. File Management
```python
# Organize output files
def organize_output(result, category):
    """Move files to appropriate directories"""

    target_dir = f"output/{category}/{date.today()}"
    os.makedirs(target_dir, exist_ok=True)

    shutil.move(result["filePath"], target_dir)
```

---

## Resources

### Documentation
- **AG-UI Protocol:** https://docs.ag-ui.com/
- **Microsoft Agent Framework:** https://learn.microsoft.com/en-us/agent-framework/
- **Our Toolkit:** `/self-contained-visualizations/README.md`

### Examples
- **Python Examples:** `/examples/ag-ui-examples/`
- **Configuration Examples:** `/examples/config.json`
- **Data Examples:** `/examples/sample-data.json`

### Support
- Check existing examples in `/examples/`
- Review troubleshooting section above
- Test with `node tools/ag-ui-tool.js`

---

**Last Updated:** December 21, 2025
**Version:** 1.0.0
