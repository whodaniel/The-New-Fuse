#!/bin/bash

# Claude Dev Automation Setup Script for The New Fuse
# This script sets up the Claude Dev automation system in your NestJS project

set -e  # Exit on any error

echo "🚀 Setting up Claude Dev Automation System for The New Fuse..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="${PWD}"
API_DIR="${PROJECT_ROOT}/apps/api"
SRC_DIR="${API_DIR}/src"
SERVICES_DIR="${SRC_DIR}/services"
CONTROLLERS_DIR="${SRC_DIR}/controllers"
MODULES_DIR="${SRC_DIR}/modules"
MCP_DIR="${SRC_DIR}/mcp"
SCRIPTS_DIR="${SRC_DIR}/scripts"
PROJECT_SCRIPTS_DIR="${PROJECT_ROOT}/scripts"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a directory exists, create if not
ensure_directory() {
    if [ ! -d "$1" ]; then
        print_status "Creating directory: $1"
        mkdir -p "$1"
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the correct project root
    if [ ! -f "package.json" ] || [ ! -d "apps/api" ]; then
        print_error "This doesn't appear to be The New Fuse project root. Please run this script from the project root."
        exit 1
    fi
    
    # Check for yarn
    if ! command_exists yarn; then
        print_error "yarn is required but not installed."
        exit 1
    fi
    
    # Check if this is a NestJS project
    if ! grep -q "@nestjs" apps/api/package.json; then
        print_warning "This doesn't appear to be a NestJS project. Continuing anyway..."
    fi
    
    print_success "Prerequisites check passed!"
}

# Install required dependencies
install_dependencies() {
    print_status "Installing required dependencies..."
    
    cd "${API_DIR}"
    
    local dependencies=(
        "ioredis"
        "axios"
        "yargs"
        "chalk"
        "ora"
    )
    
    local dev_dependencies=(
        "@types/yargs"
    )
    
    print_status "Installing production dependencies..."
    yarn add ${dependencies[@]}
    
    print_status "Installing development dependencies..."
    yarn add -D ${dev_dependencies[@]}
    
    cd "${PROJECT_ROOT}"
    print_success "Dependencies installed!"
}

# Check if implementation files exist
check_implementation_files() {
    print_status "Checking for implementation files..."
    
    local files=(
        "$SERVICES_DIR/ClaudeDevAutomationService.ts"
        "$CONTROLLERS_DIR/ClaudeDevAutomationController.ts"
        "$MODULES_DIR/ClaudeDevAutomationModule.ts"
        "$MCP_DIR/TNFClaudeDevMCPServer.ts"
        "$SCRIPTS_DIR/claude-dev-cli.ts"
    )
    
    local missing_files=()
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        print_error "The following implementation files are missing:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        print_error "Implementation files should have been created by Claude. Please check the file creation process."
        exit 1
    fi
    
    print_success "All implementation files found!"
}

# Update main app module
update_app_module() {
    print_status "Updating main application module..."
    
    local app_module="$SRC_DIR/app.module.ts"
    
    if [ ! -f "$app_module" ]; then
        print_warning "Could not find main application module at $app_module. Please manually add ClaudeDevAutomationModule to your imports."
        return
    fi
    
    # Check if already imported
    if grep -q "ClaudeDevAutomationModule" "$app_module"; then
        print_warning "ClaudeDevAutomationModule already imported in $app_module"
        return
    fi
    
    print_status "Adding ClaudeDevAutomationModule to $app_module"
    
    # Create backup
    cp "$app_module" "$app_module.backup"
    
    # Add import statement
    if ! grep -q "import.*ClaudeDevAutomationModule" "$app_module"; then
        # Find the last import statement and add after it
        local last_import_line=$(grep -n "^import" "$app_module" | tail -n1 | cut -d: -f1)
        if [ -n "$last_import_line" ]; then
            sed -i "${last_import_line}a\\import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';" "$app_module"
        else
            # No existing imports, add at the top
            sed -i "1i\\import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';" "$app_module"
        fi
    fi
    
    # Add to imports array
    if grep -q "imports:" "$app_module"; then
        # Find the imports array and add the module
        sed -i '/imports: \[/a\    ClaudeDevAutomationModule,' "$app_module"
    else
        print_warning "Could not automatically add to imports array. Please manually add ClaudeDevAutomationModule to your module imports."
    fi
    
    print_success "App module updated!"
}

# Create environment configuration
setup_environment() {
    print_status "Setting up environment configuration..."
    
    local env_file="${API_DIR}/.env"
    local env_example="${API_DIR}/.env.example"
    
    # Environment variables to add
    local env_vars=(
        ""
        "# Claude Dev Automation Configuration"
        "CLAUDE_DEV_ENABLED=true"
        "CLAUDE_DEV_API_KEY=your_anthropic_api_key_here"
        "REDIS_HOST=localhost"
        "REDIS_PORT=6379"
        "REDIS_DB=0"
    )
    
    # Add to .env file
    if [ -f "$env_file" ]; then
        if ! grep -q "CLAUDE_DEV_ENABLED" "$env_file"; then
            for var in "${env_vars[@]}"; do
                echo "$var" >> "$env_file"
            done
            print_success "Environment variables added to $env_file"
        else
            print_warning "Claude Dev environment variables already exist in $env_file"
        fi
    else
        for var in "${env_vars[@]}"; do
            echo "$var" >> "$env_file"
        done
        print_success "Created $env_file with Claude Dev configuration"
    fi
    
    # Add to .env.example file
    if [ -f "$env_example" ]; then
        if ! grep -q "CLAUDE_DEV_ENABLED" "$env_example"; then
            for var in "${env_vars[@]}"; do
                echo "$var" >> "$env_example"
            done
            print_success "Environment variables added to $env_example"
        fi
    fi
}

# Setup CLI tool
setup_cli() {
    print_status "Setting up CLI tool..."
    
    local cli_file="$SCRIPTS_DIR/claude-dev-cli.ts"
    local package_json="${API_DIR}/package.json"
    
    if [ -f "$cli_file" ]; then
        chmod +x "$cli_file"
        
        # Add npm script if package.json exists
        if [ -f "$package_json" ]; then
            # Check if script already exists
            if ! grep -q "claude-dev" "$package_json"; then
                # Use node to add the script (cross-platform JSON editing)
                cd "${API_DIR}"
                node -e "
                const fs = require('fs');
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                if (!pkg.scripts) pkg.scripts = {};
                pkg.scripts['claude-dev'] = 'ts-node src/scripts/claude-dev-cli.ts';
                fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
                "
                cd "${PROJECT_ROOT}"
                print_success "Added 'claude-dev' script to package.json"
            fi
        fi
        
        print_success "CLI tool setup complete!"
        print_status "You can now use: cd apps/api && yarn claude-dev <command>"
    fi
}

# Validate TypeScript compilation
validate_typescript() {
    print_status "Validating TypeScript compilation..."
    
    cd "${API_DIR}"
    
    if command_exists yarn && yarn tsc --noEmit --skipLibCheck 2>/dev/null; then
        print_success "TypeScript compilation successful!"
    else
        print_warning "TypeScript compilation has issues. Please check the errors above."
        print_warning "This might be due to missing dependencies or type definitions."
    fi
    
    cd "${PROJECT_ROOT}"
}

# Create documentation
create_documentation() {
    print_status "Creating documentation..."
    
    local docs_dir="${API_DIR}/docs"
    ensure_directory "$docs_dir"
    
    local readme_file="$docs_dir/CLAUDE_DEV_AUTOMATION_README.md"
    
    cat > "$readme_file" << 'EOF'
# Claude Dev Automation System

This document describes the Claude Dev automation system integrated into The New Fuse API server.

## Overview

The Claude Dev automation system provides AI-powered automation capabilities for development tasks, including:

- Code review and analysis
- API documentation generation  
- Unit test creation
- Data analysis and insights
- Custom automation templates

## Components

### 1. ClaudeDevAutomationService
Core service that manages automation templates and execution.

### 2. ClaudeDevAutomationController
REST API endpoints for managing automations.

### 3. ClaudeDevAutomationModule
NestJS module that wires everything together.

### 4. TNFClaudeDevMCPServer
MCP (Model Context Protocol) server for Claude integration.

### 5. CLI Tool
Command-line interface for interacting with the automation system.

## API Endpoints

- `GET /api/claude-dev/templates` - List templates
- `GET /api/claude-dev/templates/:id` - Get template details
- `POST /api/claude-dev/automations` - Execute automation
- `GET /api/claude-dev/automations` - List automations
- `GET /api/claude-dev/automations/:id` - Get automation result
- `PUT /api/claude-dev/automations/:id/cancel` - Cancel automation
- `GET /api/claude-dev/stats` - Usage statistics

## CLI Usage

```bash
# From the API directory
cd apps/api

# List templates
yarn claude-dev templates

# Execute automation
yarn claude-dev run code-review params.json

# Check automation status
yarn claude-dev get <automation-id>

# View statistics
yarn claude-dev stats
```

## Configuration

Set these environment variables in `apps/api/.env`:

```
CLAUDE_DEV_ENABLED=true
CLAUDE_DEV_API_KEY=your_anthropic_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Templates

The system comes with built-in templates for:

- **code-review**: Automated code review with suggestions
- **api-documentation**: Generate API documentation
- **test-generation**: Create unit tests
- **data-analysis**: Analyze datasets and generate insights

## Custom Templates

You can create custom templates via the API or CLI with:

- Custom prompts with parameter placeholders
- Parameter validation rules
- Output format specifications
- Token estimation

## Security

- API authentication via bearer tokens
- User-scoped automation access
- Input validation and sanitization
- Rate limiting (configure as needed)

## Monitoring

- Usage statistics and metrics
- Error tracking and logging
- Performance monitoring
- Cost tracking

EOF

    print_success "Documentation created at $readme_file"
}

# Main setup function
main() {
    echo "🚀 Claude Dev Automation Setup for The New Fuse"
    echo "=============================================="
    echo ""
    
    check_prerequisites
    install_dependencies
    check_implementation_files
    update_app_module
    setup_environment
    setup_cli
    validate_typescript
    create_documentation
    
    echo ""
    print_success "🎉 Claude Dev Automation setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Set your CLAUDE_DEV_API_KEY in apps/api/.env"
    echo "2. Ensure Redis is running"
    echo "3. Start your API server: cd apps/api && yarn start"
    echo "4. Test with: cd apps/api && yarn claude-dev templates"
    echo ""
    echo "Documentation: apps/api/docs/CLAUDE_DEV_AUTOMATION_README.md"
    echo "API endpoints: http://localhost:3000/api/claude-dev"
    echo ""
}

# Handle script interruption
trap 'print_error "Setup interrupted!"; exit 1' INT

# Run main function
main "$@"
