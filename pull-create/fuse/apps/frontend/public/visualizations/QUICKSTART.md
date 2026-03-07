# Quick Start Guide

Get started with Self-Contained Visualizations in 5 minutes!

## 1. Quick Demo

Open the pre-built example in your browser:

```bash
cd self-contained-visualizations
open examples/minimal-example.html
```

This demonstrates:
- ✓ Interactive treemap visualization
- ✓ Click to zoom into categories
- ✓ Hover for detailed tooltips
- ✓ Multiple metric views
- ✓ Fully self-contained (works offline)

## 2. Generate Your First Visualization

### Option A: Use the Example Configuration

```bash
# Make CLI executable
chmod +x tools/cli.js

# Generate using example config
node tools/cli.js \
  --config examples/config.json \
  --output my-first-viz.html \
  --open
```

This will:
1. Load the example configuration
2. Generate a self-contained HTML file
3. Open it in your browser

### Option B: Use Your Own Data

Create a data file `my-data.json`:

```json
{
  "name": "root",
  "children": [
    {
      "name": "Category A",
      "children": [
        { "name": "Item 1", "size": 100, "count": 5 },
        { "name": "Item 2", "size": 200, "count": 10 }
      ]
    },
    {
      "name": "Category B",
      "children": [
        { "name": "Item 3", "size": 150, "count": 7 },
        { "name": "Item 4", "size": 250, "count": 12 }
      ]
    }
  ]
}
```

Generate the visualization:

```bash
node tools/cli.js \
  --config examples/config.json \
  --data my-data.json \
  --output my-viz.html \
  --open
```

## 3. Customize Your Visualization

Create your own config file `my-config.json`:

```json
{
  "title": "My Data Visualization",
  "headerTitle": "🎯 My Project Stats",
  "headerSubtitle": "Interactive data exploration",
  "primaryColor": "#3b82f6",
  "primaryColorDark": "#2563eb",
  "backgroundColor": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
  "metrics": {
    "size": "Total Size",
    "count": "Item Count",
    "value": "Revenue"
  },
  "defaultMetric": "size",
  "data": {
    "name": "root",
    "children": [...]
  }
}
```

Generate with custom config:

```bash
node tools/cli.js \
  --config my-config.json \
  --output custom-viz.html \
  --open
```

## 4. Understanding the Output

The generated HTML file contains:

```
my-viz.html (single file)
├── Embedded CSS (styling)
├── Embedded D3.js (visualization library)
├── Embedded Data (your hierarchical data)
└── Embedded JavaScript (visualization logic)
```

**Key Features:**
- 📦 Single file - easy to share
- 🚀 No dependencies - works offline
- 🎨 Fully interactive - zoom, filter, explore
- 📱 Responsive - works on any screen
- 🔒 Secure - no external requests

## 5. Common Use Cases

### A. Bundle Size Analysis

```bash
# Analyze webpack/rollup bundle
node tools/cli.js \
  --config examples/config.json \
  --data bundle-stats.json \
  --output bundle-analysis.html
```

### B. Project Structure

```bash
# Visualize project directory structure
node tools/cli.js \
  --config examples/config.json \
  --data project-tree.json \
  --title "Project Structure" \
  --output project-viz.html
```

### C. Data Reports

```bash
# Create interactive data report
node tools/cli.js \
  --config report-config.json \
  --data report-data.json \
  --output monthly-report.html
```

## 6. Advanced: Fully Self-Contained

To make the visualization **truly** self-contained (no CDN dependencies):

1. Download D3.js:
```bash
mkdir -p lib
curl -o lib/d3.v7.min.js https://d3js.org/d3.v7.min.js
```

2. Generate visualization:
```bash
node tools/cli.js \
  --config my-config.json \
  --output viz.html
```

The tool will automatically embed the local D3.js library.

## 7. Data Structure Requirements

Your data must follow this hierarchical structure:

```javascript
{
  "name": "root",           // Required: root node name
  "children": [             // Optional: child nodes
    {
      "name": "Category",   // Required: node name
      "children": [...],    // Optional: nested children
      "size": 100,          // Optional: numeric metrics
      "count": 5,           // Can have multiple metrics
      "customMetric": 42    // Any custom properties
    }
  ]
}
```

**Rules:**
- Root must have a `name` property
- Leaf nodes can have any numeric properties
- Properties become available as metrics
- Deeply nested structures supported

## 8. Troubleshooting

### Issue: "Config file not found"
**Solution:** Check the file path is correct and relative to current directory

### Issue: "D3.js not found locally"
**Solution:** This is fine - it will use CDN. To fix, download D3.js to `lib/` directory

### Issue: Visualization is blank
**Solution:** Check browser console for errors. Ensure data has valid structure

### Issue: Colors look wrong
**Solution:** Customize `colorScheme` in config (options: `schemeSet3`, `schemeCategory10`, etc.)

## 9. Next Steps

- Read the full [README.md](README.md) for architecture details
- Explore [templates/](templates/) for customization options
- Check [examples/](examples/) for more configurations
- Modify the template for custom visualizations

## 10. Tips & Tricks

### Tip 1: Use with npm scripts
```json
{
  "scripts": {
    "viz": "node tools/cli.js --config config.json --output dist/viz.html --open"
  }
}
```

### Tip 2: Generate in CI/CD
```yaml
# .github/workflows/visualize.yml
- name: Generate bundle visualization
  run: |
    node tools/cli.js \
      --config bundle-config.json \
      --output dist/bundle-viz.html
```

### Tip 3: Version control
```gitignore
# .gitignore
output/
*.html  # Or keep generated files if needed
```

### Tip 4: Customize colors by category
Edit the template to assign specific colors to categories:
```javascript
const categoryColors = {
  'Frontend': '#3b82f6',
  'Backend': '#10b981',
  'Tools': '#f59e0b'
};
```

## Need Help?

- 📖 Read the full documentation: [README.md](README.md)
- 💡 Check examples: [examples/](examples/)
- 🐛 Report issues: Create an issue in the repository
- 💬 Ask questions: Open a discussion

---

**Happy Visualizing! 🎨📊**
