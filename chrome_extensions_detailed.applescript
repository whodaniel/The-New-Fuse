-- Script to get more detailed Chrome extension information
on run
	tell application "Google Chrome"
		-- Make sure Chrome is running
		if it is not running then
			launch
			delay 1 -- Give it a moment to launch
		end if
		
		-- Navigate to the extensions page
		open location "chrome://extensions"
		delay 2 -- Give it more time to load
		
		-- Execute JavaScript in the active tab to get extension info
		-- This is a workaround using Chrome's Developer Tools protocol
		-- Open a new tab for the JavaScript execution
		make new tab at end of tabs of front window with properties {URL:"chrome://extensions"}
		delay 1.5
		
		-- Create a temporary HTML file to display extension info
		set tmpFilePath to (path to temporary items as string) & "chrome_extensions_info.html"
		set tmpFileURL to "file://" & POSIX path of tmpFilePath
		
		-- Execute JavaScript to extract extension information
		set jsCommand to "
		(function() {
			let output = '<html><head><title>Chrome Extensions</title>";
		set jsCommand to jsCommand & "<style>body{font-family:Arial,sans-serif;margin:20px} h1{color:#4285f4} .ext{border:1px solid #ddd;padding:10px;margin-bottom:10px;border-radius:5px} .name{font-weight:bold;font-size:16px;color:#333} .id{color:#666;font-size:12px} .enabled{color:green} .disabled{color:red}</style></head>";
		set jsCommand to jsCommand & "<body><h1>Chrome Extensions Information</h1><div id='extensions-list'>";
		set jsCommand to jsCommand & "</div></body></html>';
			
			// Unfortunately, direct extension info access is restricted in chrome://extensions
			// This is why we need to advise the user to use Developer Mode
			output = output.replace('<div id=\\'extensions-list\\'>', '<div id=\\'extensions-list\\'>' + 
				'<p>To see detailed extension information:</p>' +
				'<ol>' +
				'<li>Make sure \"Developer mode\" is turned on (toggle in the top right)</li>' +
				'<li>You can then see the extension IDs and more details</li>' +
				'<li>Click \"Details\" on any extension to see more information</li>' +
				'</ol>' +
				'<p>Due to Chrome security restrictions, automation scripts cannot access the full details of extensions.</p>');
				
			// Save to temp file
			let blob = new Blob([output], {type: 'text/html'});
			let link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'chrome_extensions_info.html';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			return 'Information exported. Please check your downloads folder for chrome_extensions_info.html';
		})();
		"
		
		-- Execute the JavaScript
		execute front window's active tab javascript jsCommand
		delay 1
		
		-- Let the user know
		return "Chrome Extensions page opened. Please ensure Developer Mode is enabled (toggle in top-right) to see extension IDs and details."
	end tell
end run
