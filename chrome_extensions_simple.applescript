-- Simple script to open Chrome extensions page in developer mode
on run
	tell application "Google Chrome"
		-- Make sure Chrome is running
		if it is not running then
			launch
			delay 1 -- Give it a moment to launch
		end if
		
		-- Navigate to the extensions page
		open location "chrome://extensions/?id=fmkadmapgofadopljbjfkapdkoienihi"
		delay 1 -- Give it time to load
		
		-- Get the active tab
		set activeTab to active tab of front window
		
		-- Return basic information
		set tabTitle to title of activeTab
		
		-- Create a new tab with instructions
		make new tab at end of tabs of front window with properties {URL:"about:blank"}
		delay 1
		
		-- Execute JavaScript to create instruction page
		set jsCommand to "document.body.innerHTML = '<h1>Chrome Extensions</h1><p>To view your extensions:</p><ol><li>In the previous tab, enable \"Developer mode\" using the toggle in the top-right corner</li><li>You can then see extension IDs and more information</li><li>Click \"Details\" on any extension to see its specific information</li></ol><p>Due to security restrictions, scripts cannot automatically extract detailed extension information.</p>';"
		
		execute front window's active tab javascript jsCommand
		
		return "Chrome Extensions page opened. Please check the browser tabs."
	end tell
end run
