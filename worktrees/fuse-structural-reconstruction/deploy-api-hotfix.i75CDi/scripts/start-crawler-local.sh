#!/bin/bash

# TNF Local Crawler Startup Script
# Starts the Crawl4AI engine locally without Docker.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv_crawler"
PYTHON_ENGINE_DIR="$PROJECT_ROOT/packages/web-scraping/python"

echo "🚀 Starting TNF Local Crawler..."

# Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment in $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

# Activate venv
source "$VENV_DIR/bin/activate"

# Install/Update dependencies
echo "📥 Ensuring dependencies are installed..."
pip install --quiet -r "$PYTHON_ENGINE_DIR/requirements.txt"

# Ensure Playwright is installed
echo "🌐 Ensuring Playwright browsers are installed..."
playwright install chromium

# Start the server
echo "✅ Crawler engine starting on http://localhost:8000"
echo "Press Ctrl+C to stop."
python "$PYTHON_ENGINE_DIR/server.py"
