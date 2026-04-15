#!/bin/bash
cd "$(dirname "$0")/.."

# Ensure ts-node is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install Node.js."
    exit 1
fi

echo "🚀 Starting Video Processor V2 (Phoenix Edition)..."
echo "📂 Working Directory: $(pwd)"

# Create data directory if missing
mkdir -p data

# Run the processor
# Pass any arguments (like --start=633) to the script
npx ts-node src/TranscriptProcessorV2.ts "$@"
