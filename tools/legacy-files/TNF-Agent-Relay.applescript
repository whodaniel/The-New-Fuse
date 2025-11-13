-- TNF Agent Communication Relay v2.1 (Enhanced)
[Previous content preserved...]

-- ### MESSAGE FORMATTING AND ENCRYPTION ###

on formatMessage(targetId, actionType, messageContentJSONPart)
    try
        set relaySrcId to relayID
        if relaySrcId is "" then set relaySrcId to "UNKNOWN_RELAY_ID"
        
        set timestampUTC to ""
        try
            set timestampUTC to do shell script "/bin/date -u +\"%Y-%m-%dT%H:%M:%SZ\""
        on error tsErr
            my logToFile("Error getting UTC timestamp: " & tsErr & ". Using local time.")
            set timestampUTC to (current date) as text
        end try
        
        set formattedMessage to "{" & return & ¬
            "  \"type\": \"COLLABORATION_REQUEST\"," & return & ¬
            "  \"source\": \"" & relaySrcId & "\"," & return & ¬
            "  \"target\": \"" & targetId & "\"," & return & ¬
            "  \"content\": {" & return & ¬
            "    \"action\": \"" & actionType & "\"," & return & ¬
            "    " & messageContentJSONPart & return & ¬
            "  }," & return & ¬
            "  \"timestamp\": \"" & timestampUTC & "\"" & return & ¬
            "}"
        
        -- Apply encryption if enabled
        set currentSettings to my getSettings()
        if useEncryption of currentSettings then
            if encryptionPassword of currentSettings is not "" then
                set encryptedMessage to my encryptMessage(formattedMessage, encryptionPassword of currentSettings)
                if success of encryptedMessage then
                    my logToFile("Message encrypted successfully.")
                    return payload of encryptedMessage
                else
                    my logToFile("Warning: Encryption failed - " & (message of encryptedMessage) & ". Sending unencrypted.")
                end if
            end if
        end if
        
        return formattedMessage
        
    on error errMsg number errNum
        my logToFile("Error in formatMessage for target " & targetId & ": " & errMsg & " (Code: " & errNum & ")")
        error "Failed to format message." number 8002
    end try
end formatMessage

on encryptMessage(messageText, password)
    try
        set salt to do shell script "/usr/bin/openssl rand -hex 8"
        set encryptCmd to "/usr/bin/openssl enc -aes-256-cbc -salt -a -pass pass:" & quoted form of password & " -S " & salt
        
        do shell script "echo " & quoted form of messageText & " | " & encryptCmd
        set encryptedText to result
        
        if encryptedText contains "error" or encryptedText contains "WARNING" then
            error "OpenSSL encryption failed: " & encryptedText
        end if
        
        -- Add encryption metadata
        set metaMessage to "{" & return & ¬
            "  \"encrypted\": true," & return & ¬
            "  \"algorithm\": \"aes-256-cbc\"," & return & ¬
            "  \"salt\": \"" & salt & "\"," & return & ¬
            "  \"payload\": \"" & encryptedText & "\"" & return & ¬
            "}"
        
        return {success:true, payload:metaMessage}
        
    on error errMsg number errNum
        my logToFile("Error encrypting message: " & errMsg & " (Code: " & errNum & ")")
        return {success:false, message:"Encryption failed: " & errMsg}
    end try
end encryptMessage

-- ### ADDITIONAL UI HANDLERS ###

on showMonitoringSettingsUI()
    try
        set currentSettings to my getSettings()
        set curInterval to monitoringInterval of currentSettings
        
        set settingsText to "Monitoring Settings" & return & return
        set settingsText to settingsText & "Check Interval: " & curInterval & " seconds" & return
        set settingsText to settingsText & "Status: " & (if monitoringActive then "ACTIVE" else "INACTIVE") & return & return
        
        set buttonOptions to {}
        if monitoringActive then
            set end of buttonOptions to "Stop Monitoring"
        else
            set end of buttonOptions to "Start Monitoring"
        end if
        set end of buttonOptions to "Change Interval"
        set end of buttonOptions to "View Agent Status"
        set end of buttonOptions to "Back to Settings"
        
        set dialogResult to display dialog settingsText buttons buttonOptions default button "Back to Settings"
        set choice to button returned of dialogResult
        
        if choice is "Start Monitoring" then
            if not isRunning then
                display dialog "Warning: Relay is not running. Monitoring can be enabled but will not be active until relay is started." buttons {"Cancel", "Enable Anyway"} default button "Cancel"
                if button returned of result is "Cancel" then return
            end if
            set monitoringActive to true
            set lastMonitoringTime to missing value
            my logToFile("Monitoring ENABLED with interval " & curInterval & "s")
            display dialog "Monitoring enabled." buttons {"OK"} icon note
            
        else if choice is "Stop Monitoring" then
            set monitoringActive to false
            my logToFile("Monitoring DISABLED by user")
            display dialog "Monitoring disabled." buttons {"OK"} icon note
            
        else if choice is "Change Interval" then
            set intervalResult to display dialog "Enter monitoring interval in seconds (minimum 5):" default answer curInterval
            try
                set newInterval to (text returned of intervalResult) as integer
                if newInterval < 5 then set newInterval to 5
                my setSetting("monitoringInterval", newInterval)
                my saveSettings()
                set monitoringInterval to newInterval
                my logToFile("Monitoring interval changed to " & newInterval & "s")
                display dialog "Monitoring interval updated to " & newInterval & " seconds." buttons {"OK"} icon note
            on error
                display dialog "Invalid interval. Please enter a number." buttons {"OK"} icon stop
            end try
            
        else if choice is "View Agent Status" then
            my showAgentStatusUI()
        end if
        
        if choice is not "Back to Settings" then
            my showMonitoringSettingsUI()
        end if
        
    on error errMsg number errNum
        if errNum is -128 then -- User cancelled
            my logToFile("Monitoring settings modification cancelled by user.")
            return
        end if
        my logToFile("Error in monitoring settings UI: " & errMsg & " (Code: " & errNum & ")")
        display dialog "Error in monitoring settings: " & errMsg buttons {"OK"} icon stop
    end try
end showMonitoringSettingsUI

on showAgentStatusUI()
    try
        if (count of agentStatusCache) is 0 then
            display dialog "No agents in status cache. Please discover agents first." buttons {"OK"} icon note
            return
        end if
        
        set statusText to "Agent Status Overview" & return & return
        set activeCount to 0
        set inactiveCount to 0
        set errorCount to 0
        
        repeat with agentRecord in agentStatusCache
            set statusText to statusText & "Agent: " & (name of agentRecord) & return
            set statusText to statusText & "  ID: " & (id of agentRecord) & return
            set statusText to statusText & "  Environment: " & (environment of agentRecord) & return
            set statusText to statusText & "  Status: " & (status of agentRecord) & return
            
            if status of agentRecord is "active" then
                set activeCount to activeCount + 1
                if lastSeen of agentRecord is not missing value then
                    set statusText to statusText & "  Last Seen: " & (lastSeen of agentRecord as text) & return
                end if
            else if status of agentRecord contains "inactive" or status of agentRecord contains "stale" then
                set inactiveCount to inactiveCount + 1
                if errorMsg of agentRecord is not missing value then
                    set statusText to statusText & "  Reason: " & (errorMsg of agentRecord) & return
                end if
            else if status of agentRecord is "error" then
                set errorCount to errorCount + 1
                if errorMsg of agentRecord is not missing value then
                    set statusText to statusText & "  Error: " & (errorMsg of agentRecord) & return
                end if
            end if
            
            set statusText to statusText & return
        end repeat
        
        set statusText to statusText & "Summary:" & return
        set statusText to statusText & "• Active: " & activeCount & return
        set statusText to statusText & "• Inactive/Stale: " & inactiveCount & return
        set statusText to statusText & "• Error: " & errorCount
        
        set buttonOptions to {"Refresh Status", "Close"}
        if monitoringActive then
            set beginning of buttonOptions to "Stop Monitoring"
        else
            set beginning of buttonOptions to "Start Monitoring"
        end if
        
        set dialogResult to display dialog statusText buttons buttonOptions default button "Close"
        set choice to button returned of dialogResult
        
        if choice is "Refresh Status" then
            my checkAgentStatus()
            my showAgentStatusUI()
        else if choice is "Start Monitoring" then
            set monitoringActive to true
            set lastMonitoringTime to missing value
            my logToFile("Monitoring enabled from status UI")
            display dialog "Monitoring enabled." buttons {"OK"} icon note
            my showAgentStatusUI()
        else if choice is "Stop Monitoring" then
            set monitoringActive to false
            my logToFile("Monitoring disabled from status UI")
            display dialog "Monitoring disabled." buttons {"OK"} icon note
            my showAgentStatusUI()
        end if
        
    on error errMsg number errNum
        if errNum is -128 then return -- User cancelled
        my logToFile("Error in agent status UI: " & errMsg & " (Code: " & errNum & ")")
        display dialog "Error displaying agent status: " & errMsg buttons {"OK"} icon stop
    end try
end showAgentStatusUI

-- ### UTILITY FUNCTIONS ###

on escapeJSONString(theText)
    -- This handler uses NSJSONSerialization to reliably escape a string for JSON
    try
        set nsString to current application's NSString's stringWithString:theText
        set dummyArray to current application's NSArray's arrayWithObject:nsString
        set escapedData to current application's NSJSONSerialization's dataWithJSONObject:dummyArray options:0 |error|:(missing value)
        
        if escapedData is missing value then
            my logToFile("JSON serialization failed for text: " & (text 1 thru 50 of theText) & "...")
            -- Basic fallback escaping
            set tempText to theText
            set tempText to my replaceText(tempText, "\\", "\\\\")
            set tempText to my replaceText(tempText, "\"", "\\\"")
            set tempText to my replaceText(tempText, return, "\\n")
            set tempText to my replaceText(tempText, tab, "\\t")
            return tempText
        end if
        
        set escapedNSString to (current application's NSString's alloc()'s initWithData:escapedData encoding:(current application's NSUTF8StringEncoding))
        set tempString to escapedNSString as text
        
        -- Strip array wrapper from NSJSONSerialization result
        if (length of tempString > 4) and (text 1 thru 2 of tempString is "[\"") then
            return text 3 thru -3 of tempString
        else
            return theText -- Return original if format unexpected
        end if
        
    on error errMsg number errNum
        my logToFile("Error in escapeJSONString: " & errMsg & " (Code: " & errNum & ")")
        -- Very basic fallback
        return theText
    end try
end escapeJSONString

on replaceText(sourceText, searchText, replacementText)
    set oldDelims to AppleScript's text item delimiters
    try
        set AppleScript's text item delimiters to searchText
        set textItems to text items of sourceText
        set AppleScript's text item delimiters to replacementText
        set newText to textItems as text
        set AppleScript's text item delimiters to oldDelims
        return newText
    on error
        set AppleScript's text item delimiters to oldDelims
        return sourceText
    end try
end replaceText
