#!/bin/bash

# Setup script for 4-Layer Crypto Agent Framework
# This script automates the initial setup process

set -e  # Exit on error

echo "====================================================================="
echo "  4-Layer Crypto Agent Framework Setup"
echo "  for The New Fuse Ecosystem"
echo "====================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python 3 found: $(python3 --version)"

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.9"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}Error: Python 3.9 or higher is required${NC}"
    echo "Current version: $PYTHON_VERSION"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python version check passed"

# Create virtual environment
echo ""
echo "Creating Python virtual environment..."
python3 -m venv venv

echo -e "${GREEN}✓${NC} Virtual environment created"

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

echo -e "${GREEN}✓${NC} pip upgraded"

# Install dependencies
echo ""
echo "Installing Python dependencies..."
echo "This may take a few minutes..."
pip install -r requirements.txt

echo -e "${GREEN}✓${NC} Dependencies installed"

# Setup environment file
echo ""
if [ -f .env ]; then
    echo -e "${YELLOW}⚠${NC} .env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
    else
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env file created from template"
    fi
else
    cp .env.example .env
    echo -e "${GREEN}✓${NC} .env file created from template"
fi

# Generate agent ID if not exists
if ! grep -q "^AGENT_ID=" .env || grep -q "^AGENT_ID=crypto-agent-001$" .env; then
    RANDOM_ID="crypto-agent-$(openssl rand -hex 4)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^AGENT_ID=.*/AGENT_ID=$RANDOM_ID/" .env
    else
        # Linux
        sed -i "s/^AGENT_ID=.*/AGENT_ID=$RANDOM_ID/" .env
    fi
    echo -e "${GREEN}✓${NC} Generated unique agent ID: $RANDOM_ID"
fi

# Create necessary directories
echo ""
echo "Creating directory structure..."
mkdir -p logs
mkdir -p data
mkdir -p tests

echo -e "${GREEN}✓${NC} Directories created"

# Check for Node.js (optional, for TypeScript bridge)
echo ""
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"
    echo "TypeScript bridge can be integrated"
else
    echo -e "${YELLOW}⚠${NC} Node.js not found"
    echo "TypeScript bridge integration will not be available"
fi

# Summary
echo ""
echo "====================================================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "====================================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your .env file:"
echo "   nano .env"
echo ""
echo "2. Required configuration:"
echo "   - AGENT_PRIVATE_KEY: Your Ethereum private key"
echo "   - ENSO_API_KEY: Your ENSO API key"
echo "   - ARWEAVE_KEYFILE_PATH: Path to Arweave wallet"
echo ""
echo "3. Run the agent:"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "4. Or run in Fetch.ai mode:"
echo "   python agent_host_fetch.py"
echo ""
echo "Documentation:"
echo "   - README.md: General documentation"
echo "   - INTEGRATION_GUIDE.md: TNF integration guide"
echo ""
echo "====================================================================="
