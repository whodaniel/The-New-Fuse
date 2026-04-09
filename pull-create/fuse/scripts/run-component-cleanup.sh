#!/bin/bash

# run-component-cleanup.sh
# Script to automate the component cleanup process

set -e

echo "===== Starting Component Cleanup Process ====="

# Create backup directory
echo "Creating backup directories..."
mkdir -p cleanup-backups/components-backup
mkdir -p cleanup-backups/potentially-lost

# Run find-lost-components.js
echo "\nRunning find-lost-components.js to identify potentially lost components..."
node scripts/find-lost-components.js

# Run identify-duplicate-components.js
echo "\nRunning identify-duplicate-components.js to find duplicate components..."
node scripts/identify-duplicate-components.js

# Run consolidate-components.js
echo "\nRunning consolidate-components.js to generate consolidation plan..."
node scripts/consolidate-components.js

# Create backup of potentially lost components
echo "\nCreating backup of potentially lost components..."
node -e "const results = require('./component-analysis-results.json'); const fs = require('fs'); const path = require('path'); results.potentiallyLost.forEach(comp => { const dir = path.dirname(path.join('cleanup-backups/potentially-lost', comp.path)); fs.mkdirSync(dir, { recursive: true }); try { fs.copyFileSync(comp.path, path.join('cleanup-backups/potentially-lost', comp.path)); console.log('Backed up: ' + comp.path); } catch(e) { console.error('Failed to backup: ' + comp.path); } });"

# Generate component tracking spreadsheet template
echo "\nGenerating component tracking spreadsheet template..."
cat > component-tracking.csv << EOL
Component Name,Component Path,Category,Duplicate Paths,Action,Priority,Status,Notes
EOL

# Add high priority components to tracking spreadsheet
node -e "const plan = require('./component-consolidation-plan.json'); const fs = require('fs'); let csv = ''; plan.highPriority.forEach(item => { const name = item.name || 'Unnamed'; const path = item.targetPath; const duplicates = item.components.map(c => c.path).join(';'); csv += `\n${name},${path},Duplicate,"${duplicates}",Consolidate,High,Pending,`; }); fs.appendFileSync('component-tracking.csv', csv);"

# Add medium priority components to tracking spreadsheet
node -e "const plan = require('./component-consolidation-plan.json'); const fs = require('fs'); let csv = ''; plan.mediumPriority.forEach(item => { const name = item.name || 'Unnamed'; const path = item.targetPath; const duplicates = item.components.map(c => c.path).join(';'); csv += `\n${name},${path},Duplicate,"${duplicates}",Consolidate,Medium,Pending,`; }); fs.appendFileSync('component-tracking.csv', csv);"

# Add sample of lost components to tracking spreadsheet
node -e "const results = require('./component-analysis-results.json'); const fs = require('fs'); let csv = ''; const sampleSize = Math.min(results.potentiallyLost.length, 20); for(let i=0; i<sampleSize; i++) { const comp = results.potentiallyLost[i]; csv += `\n${comp.name},${comp.path},Unused,,Review,Medium,Pending,`; } fs.appendFileSync('component-tracking.csv', csv);"

echo "\n===== Component Cleanup Process Complete ====="
echo "Results:"
echo "- Component analysis results: component-analysis-results.json"
echo "- Duplicate components: duplicate-components.json"
echo "- Consolidation plan: component-consolidation-plan.json"
echo "- Consolidation report: component-consolidation-report.md"
echo "- Component tracking spreadsheet: component-tracking.csv"
echo "- Backups created in: cleanup-backups/"
echo "\nNext steps:"
echo "1. Review the consolidation report (component-consolidation-report.md)"
echo "2. Update the component tracking spreadsheet (component-tracking.csv)"
echo "3. Begin implementing the high-priority consolidations"
echo "4. Run tests after each consolidation"