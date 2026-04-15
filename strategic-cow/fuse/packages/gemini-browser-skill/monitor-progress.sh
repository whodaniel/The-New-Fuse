#!/bin/bash
# Monitor video processing progress

echo "🎬 Video Processing Monitor"
echo "======================================"
echo ""

# Check if process is running
if pgrep -f "TranscriptProcessorV2" > /dev/null; then
    echo "✅ Processing is RUNNING"
    echo ""
else
    echo "❌ Processing is NOT running"
    echo ""
    exit 1
fi

# Generate status report
echo "📊 Generating status report..."
cd "$(dirname "$0")"
node src/GenerateStatusReport.js 2>/dev/null

# Show recent progress
echo ""
echo "📈 Recent Progress (last 20 lines of log):"
echo "------------------------------------"
tail -20 data/processing.log 2>/dev/null || echo "No log file yet"

echo ""
echo "📁 Reports Generated:"
echo "------------------------------------"
ls -1 data/video-reports/*.md 2>/dev/null | wc -l || echo "0"

echo ""
echo "💡 Commands:"
echo "  View full log:        tail -f data/processing.log"
echo "  Check status report:  cat data/ProcessingStatusReport.md"
echo "  Stop processing:      pkill -f TranscriptProcessorV2"
echo ""
