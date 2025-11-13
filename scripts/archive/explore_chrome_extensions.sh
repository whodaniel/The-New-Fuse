#!/bin/bash
# Script to explore Chrome extensions using applescript

# Create a simple AppleScript
cat > /tmp/chrome_extensions.applescript << 'EOL'
tell application "Google Chrome"
  activate
  open location "chrome://extensions"
  delay 1
  return "Chrome extensions page opened"
end tell
EOL

# Execute the AppleScript
osascript /tmp/chrome_extensions.applescript

echo "Chrome extensions page opened. Please enable Developer Mode in the top-right corner to see more details about your extensions."
