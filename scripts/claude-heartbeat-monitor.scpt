-- Enhanced Claude Heartbeat Monitor for The New Fuse
-- Continuously monitors VS Code and Copilot activity and keeps Claude engaged

global lastVSCodeContent
global lastCopilotContent
global monitoringActive
global heartbeatInterval
global wakeUpMethods

set monitoringActive to true
set heartbeatInterval to 3 -- seconds
set lastVSCodeContent to ""
set lastCopilotContent to ""

-- Multiple wake-up methods to ensure Claude stays active
set wakeUpMethods to {"notification", "file_trigger", "app_activation", "sound_alert"}

-- Main monitoring loop
repeat while monitoringActive
    try
        -- Check VS Code and Copilot activity
        set currentActivity to checkVSCodeActivity()
        
        if currentActivity is not equal to lastVSCodeContent then
            -- Activity detected - wake up Claude
            wakeUpClaude("VS Code activity detected: " & currentActivity)
            set lastVSCodeContent to currentActivity
        end if
        
        -- Check specifically for Copilot responses
        set copilotActivity to checkCopilotActivity()
        
        if copilotActivity is not equal to lastCopilotContent then
            -- Copilot response detected - priority wake up
            priorityWakeUpClaude("Copilot responded: " & copilotActivity)
            set lastCopilotContent to copilotActivity
        end if
        
        -- Regular heartbeat ping
        regularHeartbeat()
        
        delay heartbeatInterval
        
    on error errMsg
        log "Heartbeat monitor error: " & errMsg
        delay heartbeatInterval
    end try
end repeat

-- Function to check VS Code activity
on checkVSCodeActivity()
    try
        tell application "System Events"
            if exists (application process "Visual Studio Code") then
                tell application process "Visual Studio Code"
                    set windowCount to count of windows
                    if windowCount > 0 then
                        -- Get basic window info
                        set activeWindow to name of window 1
                        return "VS Code active: " & activeWindow
                    end if
                end tell
            end if
        end tell
    on error
        return "VS Code not accessible"
    end try
    return "No VS Code activity"
end checkVSCodeActivity

-- Function to specifically check Copilot activity
on checkCopilotActivity()
    try
        tell application "System Events"
            if exists (application process "Visual Studio Code") then
                tell application process "Visual Studio Code"
                    -- Look for Copilot chat panels or activity indicators
                    set elementInfo to entire contents as string
                    
                    -- Check for common Copilot response patterns
                    if elementInfo contains "Copilot" or elementInfo contains "GitHub Copilot" then
                        -- Take a screenshot to capture current state
                        do shell script "screencapture -x /tmp/copilot_activity_" & (current date) & ".png"
                        return "Copilot activity detected at " & (current date as string)
                    end if
                end tell
            end if
        end tell
    on error
        return "Copilot check failed"
    end try
    return "No Copilot activity"
end checkCopilotActivity

-- Function to wake up Claude with priority alert
on priorityWakeUpClaude(activityInfo)
    try
        -- Method 1: Create urgent file trigger
        do shell script "echo 'PRIORITY: " & activityInfo & "' > /tmp/claude_priority_alert.txt"
        
        -- Method 2: System notification
        display notification activityInfo with title "Claude Wake Up - Priority" sound name "Glass"
        
        -- Method 3: Activate Claude Desktop if available
        try
            tell application "Claude" to activate
        end try
        
        -- Method 4: Write to The New Fuse relay system
        try
            do shell script "curl -X POST http://localhost:3000/wake-claude -d '{\"priority\":true,\"message\":\"" & activityInfo & "\"}' -H 'Content-Type: application/json'"
        end try
        
        log "Priority wake up sent: " & activityInfo
        
    on error errMsg
        log "Priority wake up failed: " & errMsg
    end try
end priorityWakeUpClaude

-- Function to wake up Claude with standard alert
on wakeUpClaude(activityInfo)
    try
        -- Method 1: File trigger
        do shell script "echo '" & activityInfo & "' >> /tmp/claude_activity_log.txt"
        
        -- Method 2: Notification
        display notification activityInfo with title "Claude Wake Up"
        
        -- Method 3: Write to relay
        try
            do shell script "curl -X POST http://localhost:3000/wake-claude -d '{\"message\":\"" & activityInfo & "\"}' -H 'Content-Type: application/json'"
        end try
        
        log "Wake up sent: " & activityInfo
        
    on error errMsg
        log "Wake up failed: " & errMsg
    end try
end wakeUpClaude

-- Function for regular heartbeat
on regularHeartbeat()
    try
        set currentTime to (current date) as string
        
        -- Write heartbeat to file
        do shell script "echo 'Heartbeat: " & currentTime & "' >> /tmp/claude_heartbeat.txt"
        
        -- Send to relay if available
        try
            do shell script "curl -X POST http://localhost:3000/heartbeat -d '{\"timestamp\":\"" & currentTime & "\",\"status\":\"monitoring\"}' -H 'Content-Type: application/json'"
        end try
        
    on error
        -- Silent fail for regular heartbeat
    end try
end regularHeartbeat

-- Function to stop monitoring (can be called externally)
on stopMonitoring()
    set monitoringActive to false
    log "Heartbeat monitoring stopped"
end stopMonitoring
