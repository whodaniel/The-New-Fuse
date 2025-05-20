-- Script to explore Chrome extensions
on run
	tell application "Google Chrome"
		-- Make sure Chrome is running
		if it is not running then
			launch
			delay 1 -- Give it a moment to launch
		end if
		
		-- Navigate to the extensions page
		open location "chrome://extensions"
		delay 1 -- Give it time to load
		
		-- Get the active tab
		set activeTab to active tab of front window
		
		-- Return basic information
		set tabTitle to title of activeTab
		set tabURL to URL of activeTab
		
		-- Note: Chrome's security model prevents direct access to the extension data via AppleScript
		-- This script will just open the extensions page for manual inspection
		
		return "Chrome Extensions page opened. Title: " & tabTitle & ", URL: " & tabURL
	end tell
end run
