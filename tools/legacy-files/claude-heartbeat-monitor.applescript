-- Claude Desktop Heartbeat Monitor for The New Fuse
-- This script monitors VS Code Copilot activity and pings Claude Desktop to maintain engagement

property checkInterval : 10 -- seconds between checks
property maxChecks : 360 -- run for 1 hour max (360 * 10 seconds)
property currentCheck : 0

-- Main monitoring loop
on run
    log "Starting Claude Desktop Heartbeat Monitor for The New Fuse integration..."
    
    repeat while currentCheck < maxChecks
        set currentCheck to currentCheck + 1
        
        try
            -- Check VS Code Copilot activity
            set copilotStatus to checkCopilotActivity()
            
            -- Ping Claude Desktop with status update
            pingClaudeDesktop(copilotStatus)
            
            -- Wait for the specified interval
            delay checkInterval
            
        on error e
            log "Error in heartbeat monitor: " & e
            delay checkInterval
        end try
    end repeat
    
    log "Heartbeat monitor completed after " & maxChecks & " checks"
end run

-- Check what's happening in VS Code Copilot
on checkCopilotActivity()
    tell application "System Events"
        try
            -- Find VS Code (Electron process)
            set vscodeProcess to application process "Electron"
            
            -- Check if VS Code is frontmost and active
            set isActive to frontmost of vscodeProcess
            
            -- Try to detect if there's new content in Copilot chat
            tell vscodeProcess
                -- Look for any UI changes that might indicate new messages
                set allUIElements to every UI element of window 1
                set elementCount to count of allUIElements
                
                -- Check for any text content that might be new responses
                set hasNewContent to false
                try
                    set allTexts to every static text of window 1
                    if (count of allTexts) > 0 then
                        set hasNewContent to true
                    end if
                on error
                    -- No readable text found
                end try
                
                return {active:isActive, elementCount:elementCount, hasNewContent:hasNewContent, timestamp:current date}
            end tell
            
        on error e
            return {error:e, timestamp:current date}
        end try
    end tell
end checkCopilotActivity

-- Ping Claude Desktop to maintain engagement
on pingClaudeDesktop(copilotStatus)
    try
        -- Method 1: Try to activate Claude Desktop app
        tell application "Claude"
            activate
            delay 0.5
        end tell
        
        -- Method 2: Send a system notification that Claude might respond to
        tell application "System Events"
            -- Create a temporary file with status update
            set statusFile to "/tmp/claude_heartbeat_" & (current date as string)
            set statusContent to "HEARTBEAT: VS Code Copilot Activity Check " & (current date as string) & return
            set statusContent to statusContent & "Status: " & (copilotStatus as string) & return
            set statusContent to statusContent & "Action needed: Continue monitoring Copilot responses and integration work"
            
            -- Write status to file (Claude might monitor this)
            try
                do shell script "echo " & quoted form of statusContent & " > " & quoted form of statusFile
            end try
        end tell
        
        -- Method 3: Try to trigger Claude through AppleScript events
        tell application "System Events"
            -- Send a custom AppleScript event that might wake Claude
            try
                tell application "Claude" to activate
                delay 0.2
                -- Try sending keystrokes to Claude if it's active
                keystroke "HEARTBEAT: Continue monitoring VS Code Copilot integration work. Check: " & (current date as string)
                key code 36 -- Enter
            on error
                -- Claude app might not be accessible this way
            end try
        end tell
        
        -- Method 4: Create a URL scheme trigger (if Claude supports it)
        try
            open location "claude://heartbeat?task=monitor_vscode&status=" & (copilotStatus as string)
        on error
            -- URL scheme might not be supported
        end try
        
        log "Heartbeat ping sent to Claude Desktop at " & (current date as string)
        
    on error e
        log "Error pinging Claude Desktop: " & e
    end try
end pingClaudeDesktop

-- Function to start monitoring with custom parameters
on startMonitoring(intervalSeconds, maxDurationMinutes)
    set checkInterval to intervalSeconds
    set maxChecks to (maxDurationMinutes * 60) / intervalSeconds
    set currentCheck to 0
    run
end startMonitoring

-- Emergency stop function
on stopMonitoring()
    set maxChecks to currentCheck
    log "Heartbeat monitoring stopped by user command"
end stopMonitoring
