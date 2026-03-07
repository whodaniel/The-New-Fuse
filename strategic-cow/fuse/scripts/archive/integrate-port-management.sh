#!/bin/bash

# integrate-port-management.sh - Integration script for The New Fuse Port Management

echo "🔧 Integrating Port Management into The New Fuse"
echo "================================================="

PROJECT_ROOT="."
cd "$PROJECT_ROOT" || exit 1

# 1. Update root package.json to include port management scripts
echo "1. Adding port management scripts to root package.json..."

# Read current package.json
PACKAGE_JSON=$(cat package.json)

# Add port management scripts using Node.js
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add new scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'ports:status': 'tnf-ports status',
  'ports:conflicts': 'tnf-ports conflicts',
  'ports:dev': 'tnf-ports dev --optimize',
  'ports:health': 'tnf-ports health',
  'dev:optimized': 'yarn ports:dev && yarn dev'
};

// Add port management as a dependency
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  '@the-new-fuse/port-management': 'workspace:*',
  '@the-new-fuse/port-manager-cli': 'workspace:*'
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✓ Updated root package.json');
"

# 2. Update workspace configuration
echo "2. Updating workspace configuration..."

# Add port management packages to workspace
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (!packageJson.workspaces.includes('packages/port-management')) {
  packageJson.workspaces.push('packages/port-management');
}

if (!packageJson.workspaces.includes('tools/port-manager')) {
  packageJson.workspaces.push('tools/port-manager');
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✓ Updated workspace configuration');
"

# 3. Add port management to frontend dependencies
echo "3. Adding port management to frontend app..."

FRONTEND_PACKAGE="$PROJECT_ROOT/apps/frontend/package.json"
if [ -f "$FRONTEND_PACKAGE" ]; then
  node -e "
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('$FRONTEND_PACKAGE', 'utf8'));
  
  packageJson.dependencies = {
    ...packageJson.dependencies,
    '@the-new-fuse/port-management': 'workspace:*'
  };
  
  fs.writeFileSync('$FRONTEND_PACKAGE', JSON.stringify(packageJson, null, 2));
  console.log('✓ Updated frontend dependencies');
  "
fi

# 4. Add port management to API dependencies
echo "4. Adding port management to API server..."

API_PACKAGE="$PROJECT_ROOT/apps/api/package.json"
if [ -f "$API_PACKAGE" ]; then
  node -e "
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('$API_PACKAGE', 'utf8'));
  
  packageJson.dependencies = {
    ...packageJson.dependencies,
    '@the-new-fuse/port-management': 'workspace:*'
  };
  
  fs.writeFileSync('$API_PACKAGE', JSON.stringify(packageJson, null, 2));
  console.log('✓ Updated API dependencies');
  "
fi

# 5. Create TypeScript configuration for port management
echo "5. Setting up TypeScript configuration..."

cat > "packages/port-management/tsconfig.json" << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declarationMap": true,
    "declaration": true,
    "composite": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
EOF

# 6. Install dependencies
echo "6. Installing dependencies..."
yarn install

# 7. Build port management package
echo "7. Building port management package..."
cd packages/port-management
yarn build
cd "$PROJECT_ROOT"

# 8. Install CLI globally for development
echo "8. Installing port management CLI..."
cd tools/port-manager
chmod +x cli.js
npm link
cd "$PROJECT_ROOT"

# 9. Update VS Code settings for better development experience
echo "9. Updating VS Code configuration..."

VSCODE_SETTINGS="$PROJECT_ROOT/.vscode/settings.json"
mkdir -p "$(dirname "$VSCODE_SETTINGS")"

if [ ! -f "$VSCODE_SETTINGS" ]; then
  echo '{}' > "$VSCODE_SETTINGS"
fi

node -e "
const fs = require('fs');
let settings = {};

if (fs.existsSync('$VSCODE_SETTINGS')) {
  try {
    settings = JSON.parse(fs.readFileSync('$VSCODE_SETTINGS', 'utf8'));
  } catch (e) {
    settings = {};
  }
}

settings['typescript.preferences.quoteStyle'] = 'single';
settings['editor.codeActionsOnSave'] = {
  'source.fixAll.eslint': true
};

// Add port management specific settings
settings['portManagement.autoResolveConflicts'] = true;
settings['portManagement.monitorInterval'] = 30000;

fs.writeFileSync('$VSCODE_SETTINGS', JSON.stringify(settings, null, 2));
console.log('✓ Updated VS Code settings');
"

# 10. Create initial port configurations
echo "10. Registering initial port configurations..."

# Register the current frontend port
tnf-ports register -s frontend -e development -p 3000 -t frontend --protocol http --health-url "http://localhost:3000" 2>/dev/null || echo "Port 3000 already registered or conflict detected"

# Register the current API port  
tnf-ports register -s api -e development -p 3001 -t api --protocol http --health-url "http://localhost:3001/health" 2>/dev/null || echo "Port 3001 already registered or conflict detected"

# Register the backend port
tnf-ports register -s backend -e development -p 3004 -t backend --protocol http 2>/dev/null || echo "Port 3004 already registered or conflict detected"

# 11. Create development startup script
echo "11. Creating optimized development startup script..."

cat > "$PROJECT_ROOT/dev-with-port-management.sh" << 'EOF'
#!/bin/bash

echo "🚀 Starting The New Fuse with Port Management"
echo "============================================="

# Check for and resolve port conflicts
echo "Checking for port conflicts..."
tnf-ports conflicts --auto-resolve

# Show current port status
echo ""
tnf-ports status

echo ""
echo "Starting development servers..."

# Start API server
echo "Starting API server..."
yarn dev:api &
API_PID=$!

sleep 3

# Start frontend
echo "Starting frontend..."
yarn dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:3001"
echo ""
echo "Monitor ports: tnf-ports status"
echo "Check health: tnf-ports health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
EOF

chmod +x "$PROJECT_ROOT/dev-with-port-management.sh"

# 12. Update .gitignore to exclude port management files that shouldn't be committed
echo "12. Updating .gitignore..."

cat >> "$PROJECT_ROOT/.gitignore" << 'EOF'

# Port Management
.port-management-backups/
*.port-backup
node_modules/.port-registry
EOF

# 13. Create documentation
echo "13. Creating documentation..."

cat > "$PROJECT_ROOT/PORT_MANAGEMENT.md" << 'EOF'
# Port Management System

The New Fuse includes a comprehensive port management system to prevent conflicts and provide visibility into service port allocation.

## Quick Start

```bash
# Check current port status
tnf-ports status

# Start development with optimized ports
./dev-with-port-management.sh

# Check for and resolve conflicts
tnf-ports conflicts --auto-resolve

# Check service health
tnf-ports health
```

## Features

- **Real-time conflict detection** and automatic resolution
- **Dynamic port allocation** with preferred/fallback ports
- **Health monitoring** for all registered services
- **Configuration auto-update** (vite.config.ts, package.json, docker-compose.yml)
- **VS Code integration** with updated launch configurations
- **CLI tools** for development workflow

## Available Commands

- `tnf-ports status` - Show current port allocation
- `tnf-ports conflicts` - Detect and resolve conflicts
- `tnf-ports health` - Check service health status
- `tnf-ports register` - Register a new service port
- `tnf-ports dev --optimize` - Start with port optimization

## Integration

The port management system is integrated into:
- Frontend development server (Vite)
- API development scripts
- Docker Compose configurations
- VS Code launch configurations
- Environment files

## Default Port Allocation

- **Frontend**: 3000 (dev), 3000 (prod)
- **API Server**: 3001 (dev), 3001 (prod)
- **Backend**: 3004 (dev)
- **Message Broker**: 3002 (prod only)

Ports are automatically assigned if conflicts are detected.
EOF

echo ""
echo "✅ Port Management Integration Complete!"
echo ""
echo "🎯 Next Steps:"
echo "  1. Run: ./dev-with-port-management.sh"
echo "  2. Check status: tnf-ports status"
echo "  3. Monitor health: tnf-ports health"
echo ""
echo "📚 Documentation: ./PORT_MANAGEMENT.md"
echo "🔧 CLI Help: tnf-ports --help"
