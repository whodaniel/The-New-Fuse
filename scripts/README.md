# Scripts Directory - Consolidated Development Tools

This directory contains all development, build, deployment, and testing scripts organized by purpose for better maintainability and discoverability.

## 📁 Directory Structure

### `/dev/` - Development Environment Scripts
- **Essential scripts for local development and testing**
- `launch-all.sh` - Start all development services
- `launch-frontend.sh` - Start only frontend development server  
- `launch-chrome.sh` - Launch Chrome for extension testing
- `launch-complete-frontend.sh` - Full frontend development environment
- `launch-all-ui.sh` - Launch all UI components
- `launch-all-pages.sh` - Launch all development pages

### `/build/` - Build and Compilation Scripts
- **Scripts for building, packaging, and preparing artifacts**
- `comprehensive-build.sh` - Complete project build process
- `build-with-path.sh` - Build with custom paths
- Individual build scripts consolidated here

### `/deployment/` - Deployment and Infrastructure
- **Scripts for deployment, Docker, and infrastructure management**
- `docker-build-all.sh` - Build all Docker containers
- `docker-complete.sh` - Complete Docker environment setup
- CloudRuntime and other deployment scripts

### `/testing/` - Test Automation
- **Scripts for testing, validation, and quality assurance**
- `test-compression.js` - Test compression features
- `test-rate-limiting.js` - Test rate limiting
- `test-export.cjs` - Test export functionality
- Individual test scripts for different components

### `/legacy/` - Historical Scripts
- **Older scripts preserved for reference**
- `fix-*.sh` (36 files) - Various legacy fix scripts
- `fix-types-package.sh` - Type package fixes
- `fix-ui-components.sh` - UI component fixes
- `fix-database-*.sh` - Database-related fixes
- **Note**: These scripts are for historical reference. New development should use modern build tools and package managers.

## 🚀 Quick Start Guide

### For New Developers
1. **Start Development**: Run `./scripts/dev/launch-all.sh`
2. **Frontend Only**: Run `./scripts/dev/launch-frontend.sh`
3. **Test Extensions**: Run `./scripts/dev/launch-chrome.sh`

### For Build & Deployment
1. **Full Build**: Run `./scripts/build/comprehensive-build.sh`
2. **Docker Setup**: Run `./scripts/deployment/docker-complete.sh`
3. **CloudRuntime Deploy**: Run CloudRuntime-specific deployment script

### For Testing
1. **Run Tests**: Use appropriate script from `/testing/`
2. **Validate Setup**: Check individual component test scripts

## 📋 Usage Guidelines

### Running Scripts
```bash
# Make scripts executable
chmod +x scripts/dev/*.sh
chmod +x scripts/build/*.sh
chmod +x scripts/deployment/*.sh
chmod +x scripts/testing/*.sh

# Run development environment
./scripts/dev/launch-all.sh

# Run specific component
./scripts/dev/launch-frontend.sh
```

### Script Dependencies
- Most scripts require Node.js and package managers (pnpm/bun)
- Docker scripts require Docker and Docker Compose
- Some scripts require specific environment variables (see .env files)

### Error Handling
- All scripts include basic error handling
- Check individual script comments for specific requirements
- Use `--help` flag where available for detailed usage

## 🔄 Migration Notes

### From Root Directory
- **Before**: Scripts scattered in project root
- **After**: Organized in purpose-specific directories
- **Impact**: Cleaner project root, easier script discovery

### Legacy Scripts
- **Status**: Preserved but not recommended for new use
- **Purpose**: Historical reference for debugging old issues
- **Alternatives**: Use modern build tools and package managers

## 🛠️ Maintenance

### Adding New Scripts
1. Place in appropriate subdirectory by function
2. Add execute permissions: `chmod +x script-name.sh`
3. Update this README with description
4. Include proper error handling and help text

### Script Standards
- **Naming**: Use descriptive names with hyphens
- **Shebang**: Use `#!/bin/bash` or `#!/usr/bin/env bash`
- **Error handling**: Include `set -e` for exit on error
- **Documentation**: Include comments explaining functionality
- **Help**: Provide usage information with `--help` flag

## 📞 Support

For issues with specific scripts:
1. Check script comments for requirements
2. Verify environment setup (Node.js, Docker, etc.)
3. Review error messages in console output
4. Consult main project documentation for setup requirements

---

**Last Updated**: November 2024  
**Total Scripts**: 80+ organized across 5 functional categories  
**Maintenance**: Scripts are regularly reviewed and updated for modern compatibility