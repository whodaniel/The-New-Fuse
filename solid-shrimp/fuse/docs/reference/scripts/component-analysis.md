# Component Analysis Scripts

## Overview

The component analysis scripts help identify potentially unused or "lost" components in the codebase. These tools are essential for maintaining a clean codebase, reducing technical debt, and improving application performance.

## Available Scripts

### find-lost-components.js

The original CommonJS implementation of the component analysis script.

```bash
# Run directly
node scripts/find-lost-components.js

# Run via yarn script
yarn analyze:components
```

### find-lost-components-esm.js

The ES Modules version of the component analysis script, which is compatible with modern JavaScript environments.

```bash
# Run directly
node scripts/find-lost-components-esm.js

# Run via yarn script
yarn analyze:components
```

## Yarn Scripts

The following yarn scripts are available for component analysis:

```bash
# Run component analysis
yarn analyze:components

# Run component analysis and show summary report
yarn analyze:components:report
```

## Output Files

The component analysis scripts generate the following output files:

- `component-analysis-results.json`: Detailed JSON results of the analysis
- `component-analysis-log.txt`: Human-readable log of the analysis process and results

## Configuration

The component analysis scripts can be configured by modifying the `config` object in the script files:

```javascript
const config = {
  // Directories to search for components and pages
  searchDirs: [
    'apps/frontend/src',
    'packages/core/components',
    'packages/features',
    'packages/layout',
    'packages/shared/components',
    'packages/ui-components',
    'packages/ui'
  ],
  // Directories to exclude from search
  excludeDirs: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'backups'
  ],
  // File extensions to consider as UI components or pages
  componentExtensions: ['.tsx', '.jsx'],
  // Patterns that indicate a file is a component or page
  componentPatterns: [
    /export\s+(default\s+)?((function|class|const|let|var)\s+\w+|\w+)\s*(?:=\s*)?(?:function\s*)?\([^)]*\)\s*(?:=>)?\s*\{/,
    /extends\s+React\.Component/,
    /extends\s+Component/,
    /<[A-Z][A-Za-z0-9]*\s+/,
    /React\.createElement/,
    /import\s+.*?\s+from\s+['"]react['"]/ // Files importing React are likely components
  ],
  // Output file for results
  outputFile: 'component-analysis-results.json',
  // Log file for detailed results
  logFile: 'component-analysis-log.txt'
};
```

## Example Usage

### Basic Analysis

```bash
# Run the analysis
yarn analyze:components

# View the summary
cat component-analysis-log.txt | tail -5
```

### Creating a Comparison Report

To track changes over time, you can create comparison reports:

```bash
# Backup the current results
cp component-analysis-results.json component-analysis-results-$(date +%Y-%m-%d).json
cp component-analysis-log.txt component-analysis-log-$(date +%Y-%m-%d).txt

# Run a new analysis
yarn analyze:components

# Compare the results
node scripts/compare-component-analysis.js component-analysis-results-2025-03-28.json component-analysis-results.json
```

## Integration with VS Code

The component analysis functionality is also available as VS Code commands and MCP tools. See the following documentation for more details:

- [Component Analysis Commands](../COMMAND-REFERENCE.md#component-analysis-commands)
- [Component Analysis MCP Tools](../../guides/MCP-INTEGRATION-GUIDE.md#component-analysis-tools)

## Best Practices

1. **Regular Analysis**: Run component analysis regularly (weekly or bi-weekly) to track progress on reducing unused components.

2. **Version Control**: Keep historical analysis results to track progress over time.

3. **Review Before Removal**: Always review potentially unused components before removal to ensure they're not dynamically loaded or used in ways the static analysis can't detect.

4. **Component Consolidation**: Use the analysis results to identify opportunities for component consolidation.

5. **Documentation**: Document decisions about component retention or removal based on analysis results.
