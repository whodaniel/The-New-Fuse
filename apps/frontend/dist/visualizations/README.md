# Self-Contained Interactive HTML Visualizations

## Overview

This project documents and provides tooling for creating **self-contained interactive HTML visualizations** - single-file applications that require no external dependencies, servers, or build steps to run.

## Architecture Pattern

Based on the analysis of `bundle-analysis.html` from Rollup Visualizer, this pattern consists of three key components embedded in a single HTML file:

### 1. Embedded JavaScript Libraries

Libraries are **inlined as minified code** directly in `<script>` tags:

```html
<script>
  // Minified library code (e.g., Preact, D3.js)
  var MyLibrary = (function() { /* ... */ })();
</script>
```

**Common choices:**
- **UI Framework**: Preact (~3KB), or vanilla JavaScript
- **Visualization**: D3.js (treemaps, hierarchies, charts)
- **Utilities**: Small helper libraries for specific tasks

**Why this works:**
- No network requests needed
- Instant load time (after initial download)
- Works offline and in any environment
- Can be emailed, stored locally, or embedded anywhere

### 2. Embedded Data

Data is **embedded as JavaScript** at the end of the file:

```html
<script>
  const data = {
    "version": 2,
    "tree": { /* nested data structure */ },
    "metadata": { /* additional info */ }
  };

  // Initialize visualization with embedded data
  initVisualization(document.body, data);
</script>
```

**Data formats:**
- JSON objects (most common)
- Arrays of values
- Hierarchical/nested structures
- Can be quite large (hundreds of KB)

### 3. Interactive Visualization Logic

Custom application code that:
- Creates the DOM structure
- Binds data to visual elements
- Handles user interactions (click, hover, zoom)
- Updates the display dynamically

```javascript
// Example: D3 treemap visualization
const layout = treemap()
  .size([width, height])
  .padding(5);

const root = hierarchy(data.tree)
  .sum(d => d.value);

layout(root);

// Render rectangles for each node
svg.selectAll("rect")
  .data(root.leaves())
  .enter()
  .append("rect")
  .attr("x", d => d.x0)
  .attr("y", d => d.y0)
  .attr("width", d => d.x1 - d.x0)
  .attr("height", d => d.y1 - d.y0)
  .on("click", zoom);
```

## Key Technologies from bundle-analysis.html

### 1. Preact (Lightweight React)
- **Size**: ~3KB minified
- **Purpose**: Component-based UI rendering
- **API**: Nearly identical to React (JSX, hooks, components)
- **Usage**: Perfect for interactive dashboards

### 2. D3.js Modules
Used modules in bundle-analysis.html:
- **d3-hierarchy**: Tree/hierarchy data structures
- **d3-selection**: DOM manipulation
- **d3-drag**: Drag interactions
- **d3-zoom**: Zoom/pan behaviors
- **d3-transition**: Smooth animations
- **d3-interpolate**: Value interpolation

**Treemap Algorithm:**
- Squarified layout (minimizes aspect ratios)
- Golden ratio-based subdivision
- Nested rectangles representing hierarchies
- Size proportional to numeric values

### 3. Color Generation
Rainbow color algorithm for visual grouping:
- Uses HSL color space
- Distributes hues evenly across hierarchy
- Calculates contrast ratios for readable text
- Caches colors for performance

### 4. State Management
- URL hash for navigation state
- Local component state (Preact hooks)
- Cached computations (Map/WeakMap)

## Advantages of This Pattern

### 1. **Portability**
- Single file = easy to share
- Email attachments
- Drag-and-drop to browser
- Store in git repos

### 2. **Zero Dependencies**
- No `node_modules`
- No CDN requirements
- No version conflicts
- Works offline

### 3. **Performance**
- One HTTP request
- Pre-computed data
- Efficient caching
- Fast initial render

### 4. **Security**
- No external resource loading
- Content Security Policy friendly
- Can be audited as single file
- No supply chain attacks

### 5. **Longevity**
- HTML/CSS/JS = universal
- No framework updates needed
- Works in old and new browsers
- Self-documenting artifact

## Use Cases

### 1. **Bundle Analysis** (Original)
- Visualize webpack/rollup output
- Identify large dependencies
- Optimize bundle size
- Track changes over time

### 2. **Data Reports**
- Generate static reports from data pipelines
- Share analysis results with stakeholders
- Archive point-in-time snapshots
- Embed in documentation

### 3. **Interactive Dashboards**
- Project metrics
- Test coverage reports
- Performance benchmarks
- Dependency graphs

### 4. **Data Exploration**
- Browse hierarchical data
- Navigate large datasets
- Filter and search
- Export findings

### 5. **Documentation**
- API reference browsers
- Configuration explorers
- Code structure maps
- Architecture diagrams

## Implementation Strategies

### Strategy 1: Template-Based Generation

```javascript
// Generate custom visualization
const template = fs.readFileSync('template.html', 'utf-8');
const data = generateMyData();
const output = template.replace('__DATA_PLACEHOLDER__', JSON.stringify(data));
fs.writeFileSync('output.html', output);
```

### Strategy 2: Build-Time Embedding

```javascript
// Vite/Rollup plugin
export default {
  plugins: [
    {
      name: 'embed-visualization',
      generateBundle(options, bundle) {
        // Inline all assets into single HTML
      }
    }
  ]
}
```

### Strategy 3: Runtime Assembly

```javascript
// Server-side rendering
app.get('/report/:id', async (req, res) => {
  const data = await fetchReportData(req.params.id);
  const html = await renderVisualization(data);
  res.send(html);
});
```

## Best Practices

### 1. **Optimize Library Size**
- Use tree-shaking to include only needed modules
- Choose lightweight alternatives (Preact vs React)
- Minify and compress
- Consider removing unused D3 modules

### 2. **Data Efficiency**
- Compress data (especially repeated strings)
- Use short property names
- Remove unnecessary metadata
- Consider data deduplication

### 3. **Progressive Enhancement**
- Graceful degradation for old browsers
- Loading states for large datasets
- Error boundaries
- Fallback content

### 4. **Performance**
- Lazy render large datasets
- Virtualize long lists
- Debounce interactions
- Cache expensive computations

### 5. **Accessibility**
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management

## Technical Deep Dive

### How Rollup Visualizer Works

#### 1. Build Process
```bash
# During rollup build
rollup --config --plugin visualizer
```

The plugin:
1. Hooks into `generateBundle` lifecycle
2. Analyzes module graph
3. Calculates sizes (rendered, minified, gzipped, brotli)
4. Builds hierarchical tree structure
5. Generates HTML with embedded data

#### 2. Data Structure
```typescript
interface VisualizationData {
  version: number;
  tree: ModuleTree;
  nodeParts: Record<string, ModuleSizes>;
  options: {
    gzip: boolean;
    brotli: boolean;
  };
}

interface ModuleTree {
  name: string;
  children?: ModuleTree[];
  uid?: string; // Leaf nodes have UIDs
}

interface ModuleSizes {
  renderedLength: number;
  gzipLength?: number;
  brotliLength?: number;
}
```

#### 3. Rendering Pipeline
```
Data → Hierarchy → Treemap Layout → SVG Rendering → User Interaction
```

**Hierarchy Creation:**
```javascript
const rawHierarchy = hierarchy(data.tree);
rawHierarchy.sum(node => getModuleSize(node, sizeKey));
```

**Layout Calculation:**
```javascript
const layout = treemap()
  .size([width, height])
  .paddingOuter(5)
  .paddingTop(20)  // Space for labels
  .paddingInner(2)
  .round(true)
  .tile(treemapResquarify);  // Squarified algorithm

layout(rawHierarchy);
```

**SVG Generation:**
```javascript
// Each node becomes a <g> with <rect> and <text>
nodes.forEach(node => {
  const group = svg.append('g')
    .attr('transform', `translate(${node.x0},${node.y0})`);

  group.append('rect')
    .attr('width', node.x1 - node.x0)
    .attr('height', node.y1 - node.y0)
    .attr('fill', getColor(node));

  group.append('text')
    .text(node.data.name);
});
```

#### 4. Interaction Handling
```javascript
// Click to zoom
function zoom(event, node) {
  // Calculate transform to fill viewport
  const kx = width / (node.x1 - node.x0);
  const ky = height / (node.y1 - node.y0);
  const k = Math.min(kx, ky);

  // Animate transition
  svg.transition()
    .duration(750)
    .attr('transform',
      `translate(${-node.x0 * k},${-node.y0 * k}) scale(${k})`);
}

// Hover tooltips
nodes.on('mouseenter', (event, node) => {
  tooltip
    .style('visibility', 'visible')
    .html(`
      <strong>${node.data.name}</strong><br>
      Size: ${formatBytes(node.value)}<br>
      Percentage: ${(node.value / root.value * 100).toFixed(2)}%
    `);
});
```

## Comparison: Bundle Analysis Example

### What Makes It Special

| Feature | Implementation | Benefit |
|---------|---------------|---------|
| **File Size** | 483.8 KB total | Reasonable for rich interactive app |
| **Load Time** | Single HTTP request | Fast initial load |
| **Interactivity** | D3 zoom/drag/click | Explore large datasets |
| **Responsiveness** | Dynamic resize | Works on any screen |
| **Data Size** | ~300KB JSON | Handles thousands of modules |
| **Rendering** | SVG treemap | Crisp at any zoom level |
| **Filtering** | Text input + regex | Find specific modules |
| **Size Modes** | Toggle rendered/gzip/brotli | Compare compression |

### Size Breakdown (Approximate)

```
Total: 483.8 KB
├── Preact Library: ~15 KB
├── D3 Modules: ~80 KB
├── Custom Code: ~60 KB
├── CSS Styles: ~5 KB
├── Embedded Data: ~320 KB
└── Whitespace/Comments: ~4 KB
```

## Tooling Ecosystem

This repository provides:

1. **Documentation** (this file)
2. **Minimal Example** - Simplest working implementation
3. **Template System** - Customizable base template
4. **Generator CLI** - Command-line tool to create visualizations
5. **Example Visualizations** - Various use cases

## Getting Started

### Quick Start

```bash
# Clone or download this repository
cd self-contained-visualizations

# Install dependencies (for tooling only)
npm install

# Generate a sample visualization
npm run generate -- --data my-data.json --output my-viz.html

# Open in browser
open my-viz.html
```

### Manual Creation

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Visualization</title>
  <style>/* Your styles */</style>
</head>
<body>
  <div id="root"></div>

  <!-- Embedded libraries -->
  <script src="https://unpkg.com/preact@latest/dist/preact.umd.js"></script>
  <script src="https://unpkg.com/d3@latest/dist/d3.min.js"></script>

  <!-- Your code -->
  <script>
    const data = { /* Your data */ };
    // Your visualization logic
  </script>
</body>
</html>
```

Then inline the external scripts to make it self-contained.

## Advanced Topics

### Data Compression

For large datasets, compress the embedded data:

```javascript
// Use shorter keys
const compressed = {
  n: node.name,
  c: node.children,
  v: node.value
};

// Deduplicate repeated strings
const strings = new Map();
const deduped = JSON.stringify(data, (key, value) => {
  if (typeof value === 'string' && value.length > 10) {
    if (!strings.has(value)) {
      strings.set(value, strings.size);
    }
    return { __ref: strings.get(value) };
  }
  return value;
});
```

### Progressive Loading

For very large datasets, load incrementally:

```javascript
// Split data into chunks
const chunks = [
  data.slice(0, 1000),
  data.slice(1000, 2000),
  // ...
];

// Render first chunk immediately
renderChunk(chunks[0]);

// Load remaining chunks with requestIdleCallback
chunks.slice(1).forEach((chunk, i) => {
  requestIdleCallback(() => renderChunk(chunk));
});
```

### URL State Management

Preserve state in URL for sharing:

```javascript
// Encode state in hash
function updateURL(state) {
  const hash = btoa(JSON.stringify(state));
  window.location.hash = hash;
}

// Restore from hash
function loadState() {
  try {
    const state = JSON.parse(atob(window.location.hash.slice(1)));
    return state;
  } catch {
    return defaultState;
  }
}
```

## Resources

### Libraries for Self-Contained Visualizations

- **Preact**: https://preactjs.com/
- **D3.js**: https://d3js.org/
- **Plotly**: https://plotly.com/javascript/
- **Chart.js**: https://www.chartjs.org/
- **Vis.js**: https://visjs.org/

### Build Tools

- **Rollup Plugin Visualizer**: https://github.com/btd/rollup-plugin-visualizer
- **Webpack Bundle Analyzer**: https://github.com/webpack-contrib/webpack-bundle-analyzer
- **Vite Plugin Visualizer**: https://github.com/btd/rollup-plugin-visualizer

### Inspiration

- **Observable Notebooks**: Self-contained interactive documents
- **Jupyter Notebooks**: Mix code, data, and visualizations
- **R Markdown**: Generate standalone HTML reports

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

---

**Created by**: Daniel Goldberg
**Last Updated**: 2025-12-21
**Version**: 1.0.0
