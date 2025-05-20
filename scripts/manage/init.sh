#!/bin/bash
set -e

# Initialize new project structure
function init_structure() {
    echo "🏗️  Initializing project structure..."
    
    # Create base directories
    mkdir -p apps/{api,frontend}/{src,test}
    mkdir -p packages/{core,database,shared}/{src,test}
    mkdir -p packages/shared/{types,utils,ui}
    mkdir -p docker/{compose,images}
    mkdir -p scripts/{build,deploy,dev}
    
    # Copy template configurations
    cp templates/package.json ./package.json
    cp templates/tsconfig.base.json ./tsconfig.json
    
    echo "✅ Project structure initialized"
}

# Initialize all workspaces
function init_workspaces() {
    echo "📦 Initializing workspaces..."
    
    # Initialize each workspace with proper dependencies
    yarn workspaces foreach exec yarn init -y
    
    echo "✅ Workspaces initialized"
}

init_structure
init_workspaces