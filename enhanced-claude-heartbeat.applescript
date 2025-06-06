-- Enhanced Claude Heartbeat for Copilot Integration Monitoring
-- This script actively monitors VS Code Copilot and keeps Claude engaged

property heartbeatInterval : 5 -- seconds between checks
property maxHeartbeats : 720 -- run for 1 hour (720 * 5 seconds)
property currentHeartbeat : 0
property lastCopilotContent : ""
property copilotResponseDetected : false

on run
    log "🚀 Starting Enhanced Claude Heartbeat for The New Fuse Copilot Integration..."
    
    -- Initialize monitoring
    set startTime to current date
    
    repeat while currentHeartbeat < maxHeartbeats
        set currentHeartbeat to currentHeartbeat + 1
        
        try
            -- Check for new Copilot activity
            set copilotUpdate to monitorCopilotChat()
            
            -- If new activity detected, ping Claude more aggressively
            if copilotResponseDetected of copilotUpdate then
                log "🎯 NEW COPILOT ACTIVITY DETECTED! Pinging Claude..."
                alertClaudeOfActivity(copilotUpdate)
            else
                -- Regular heartbeat ping
                maintainClaudeConnection(copilotUpdate)
            end if
            
            delay heartbeatInterval
            
        on error e
            log "❌ Heartbeat error: " & e
            delay heartbeatInterval
        end try
    end repeat
    
    log "✅ Heartbeat monitoring completed after " & maxHeartbeats & " cycles"
end run

-- Monitor VS Code Copilot chat for new responses
on monitorCopilotChat()
    tell application "System Events"
        try
            tell application process "Electron"
                -- Try to read any text content from Copilot chat area
                set chatContent to ""
                set hasNewResponse to false
                
                try
                    -- Look in the right sidebar area where Copilot chat typically appears
                    -- Try multiple methods to detect content
                    
                    -- Method 1: Check static text elements
                    set allTexts to every static text of window 1
                    repeat with textElement in allTexts
                        try
                            set textValue to value of textElement
                            if length of textValue > 20 and textValue ≠ lastCopilotContent then
                                set chatContent to chatContent & textValue & " "
                                set hasNewResponse to true
                            end if
                        end try
                    end repeat
                    
                    -- Method 2: Check for UI changes that indicate new messages
                    set allGroups to every group of window 1
                    set groupCount to count of allGroups
                    
                    -- Method 3: Look for specific Copilot UI elements
                    set allButtons to every button of window 1
                    repeat with btn in allButtons
                        try
                            set btnTitle to title of btn
                            if btnTitle contains "Copilot" or btnTitle contains "Send" then
                                -- Copilot interface is active
                            end if
                        end try
                    end repeat
                    
                on error
                    -- Continue monitoring even if we can't read specific elements
                end try
                
                -- Update our tracking
                if hasNewResponse then
                    set lastCopilotContent to chatContent
                end if
                
                return {content:chatContent, newResponse:hasNewResponse, timestamp:current date, elementCount:count of every UI element of window 1}
            end tell
        on error e
            return {error:e, timestamp:current date}
        end try
    end tell
end monitorCopilotChat

-- Alert Claude when new Copilot activity is detected
on alertClaudeOfActivity(activityData)
    try
        -- Method 1: Activate Claude app directly
        tell application "Claude"
            activate
            delay 1
        end tell
        
        -- Method 2: Send urgent notification
        display notification "🚨 NEW COPILOT RESPONSE DETECTED! 🚨" with title "The New Fuse Integration" subtitle "Claude needs to continue monitoring" sound name "Ping"
        
        -- Method 3: Create priority file for Claude to monitor
        set priorityFile to "/tmp/claude_priority_alert.txt"
        set alertContent to "PRIORITY ALERT: " & (current date as string) & return
        set alertContent to alertContent & "NEW COPILOT ACTIVITY DETECTED!" & return
        set alertContent to alertContent & "Task: Continue monitoring VS Code Copilot integration work" & return
        set alertContent to alertContent & "Content: " & (content of activityData) & return
        set alertContent to alertContent & "Action Required: Respond to Copilot and continue integration development"
        
        do shell script "echo " & quoted form of alertContent & " > " & quoted form of priorityFile
        
        -- Method 4: Try to trigger Claude through system events
        tell application "System Events"
            try
                tell application "Claude"
                    activate
                    delay 0.5
                    -- Send wake-up message
                    keystroke "🚨 URGENT: New Copilot response detected in VS Code! Continue monitoring The New Fuse integration work immediately. Time: " & (current date as string)
                    key code 36
                end
            end try
        end tell
        
        log "🔔 PRIORITY ALERT sent to Claude at " & (current date as string)
        
    on error e
        log "❌ Error sending priority alert: " & e
    end try
end alertClaudeOfActivity

-- Maintain regular connection with Claude
on maintainClaudeConnection(statusData)
    try
        -- Create regular heartbeat file
        set heartbeatFile to "/tmp/claude_heartbeat.txt"
        set heartbeatContent to "HEARTBEAT #" & currentHeartbeat & " - " & (current date as string) & return
        set heartbeatContent to heartbeatContent & "Status: Monitoring VS Code Copilot integration" & return
        set heartbeatContent to heartbeatContent & "Elements: " & (elementCount of statusData) & return
        set heartbeatContent to heartbeatContent & "Task: Continue The New Fuse Chrome/VS Code integration work"
        
        do shell script "echo " & quoted form of heartbeatContent & " > " & quoted form of heartbeatFile
        
        -- Every 10th heartbeat, try to ping Claude more actively
        if (currentHeartbeat mod 10) = 0 then
            try
                tell application "Claude" to activate
                delay 0.2
            end try
            log "🔄 Active ping #" & currentHeartbeat & " sent to Claude"
        end if
        
    on error e
        log "❌ Error in regular heartbeat: " & e
    end try
end maintainClaudeConnection

-- Function to manually trigger immediate Claude alert
on triggerImmediateAlert()
    display notification "🚨 MANUAL TRIGGER: Claude needs to check VS Code NOW!" with title "The New Fuse" sound name "Funk"
    
    try
        tell application "Claude"
            activate
            delay 1
        end tell
        
        tell application "System Events"
            tell application "Claude"
                keystroke "MANUAL TRIGGER: Check VS Code Copilot NOW for The New Fuse integration responses!"
                key code 36
            end
        end tell
    on error e
        log "Error in manual trigger: " & e
    end try
end triggerImmediateAlert
