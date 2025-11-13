-- TNF Agent Communication Relay Application Creator v2.1
[Previous content through main execution block preserved...]

-- ### APPLICATION SOURCE CODE GENERATION ###
on createApplicationWithEnhancedErrorHandling()
    try
        -- Initialize logging
        my logToFile("Starting application creation process...")

        -- Define the core utilities that will be part of the application
        set sourceCode to ""
        
        -- Add JSON string escaping utility
        set sourceCode to sourceCode & "on escapeJSONString(stringToEscape)" & return & ¬
            "    set escapedString to stringToEscape" & return & ¬
            "    -- Replace backslashes first to avoid double escaping" & return & ¬
            "    set AppleScript's text item delimiters to \"\\\\\\"" & return & ¬
            "    set escapedString to every text item of escapedString" & return & ¬
            "    set AppleScript's text item delimiters to \"\\\\\\\\\\"" & return & ¬
            "    set escapedString to escapedString as text" & return & ¬
            "    -- Replace other special characters" & return & ¬
            "    set AppleScript's text item delimiters to \"\\\"\"" & return & ¬
            "    set escapedString to every text item of escapedString" & return & ¬
            "    set AppleScript's text item delimiters to \"\\\\\\\"\"" & return & ¬
            "    set escapedString to escapedString as text" & return & ¬
            "    -- Reset delimiters" & return & ¬
            "    set AppleScript's text item delimiters to \"\"" & return & ¬
            "    return escapedString" & return & ¬
            "end escapeJSONString" & return & return

        -- Add application header and global properties
        set sourceCode to sourceCode & "-- TNF Agent Communication Relay v2.1 (Enhanced)" & return & ¬
            "-- AppleScriptObjC Frameworks for JSON parsing" & return & ¬
            "use AppleScript version \"2.4\" -- Requires Yosemite (10.10) or later" & return & ¬
            "use scripting additions" & return & ¬
            "use framework \"Foundation\"" & return & return & ¬
            "-- ### GLOBAL PROPERTIES ###" & return & ¬
            "property relayID : \"\"" & return & ¬
            "property isRunning : false" & return & ¬
            "property appVersion : \"2.1\"" & return & return & ¬
            "-- Agent Management Properties" & return & ¬
            "property agentRegistry : {}" & return & ¬
            "property agentStatusCache : {}" & return & return & ¬
            "-- Message Handling Properties" & return & ¬
            "property messageLog : {}" & return & ¬
            "property pendingMessages : {}" & return & ¬
            "property acknowledgedMessages : {}" & return & ¬
            "property messageBatchSize : 10" & return & ¬
            "property checkReceiptTimeout : 30" & return & return & ¬
            "-- Monitoring Properties" & return & ¬
            "property monitoringActive : false" & return & ¬
            "property monitoringInterval : 60" & return & ¬
            "property lastMonitoringTime : missing value" & return & return & ¬
            "-- Performance / Cache Properties" & return & ¬
            "property cacheEnabled : true" & return & ¬
            "property messageCache : {}" & return & ¬
            "property maxCacheSize : 50" & return & ¬
            "property lastGarbageCollection : missing value" & return & return & ¬
            "-- Settings Management Properties" & return & ¬
            "property settingsFilePath : \"\"" & return & ¬
            "property settingsCache : missing value" & return & return & ¬
            "-- Default Settings" & return & ¬
            "property defaultSettings : {" & return & ¬
            "    redisHost:\"localhost\"," & return & ¬
            "    redisPort:\"6379\"," & return & ¬
            "    redisPassword:\"\"," & return & ¬
            "    redisConnected:false," & return & ¬
            "    useEncryption:false," & return & ¬
            "    encryptionPassword:\"\"," & return & ¬
            "    logFilePath:\"\"," & return & ¬
            "    monitoringInterval:60," & return & ¬
            "    cacheEnabled:true," & return & ¬
            "    maxCacheSize:50," & return & ¬
            "    templatesFilePath:\"\"" & return & ¬
            "}" & return & return

        -- Add all previously defined handlers
        [Previous handlers from the relay implementation...]

        -- Create temporary script file
        set tempScriptPath to (path to temporary items as text)
        set tempScriptFile to tempScriptPath & "TNFAgentCommunicationRelayTemp.applescript"
        
        [Rest of implementation preserved...]
        
    on error errMsg number errNum
        my logToFile("ERROR: Failed to create application - " & errMsg)
        error "Failed to create application: " & errMsg number errNum
    end try
end createApplicationWithEnhancedErrorHandling

[Rest of creator script preserved...]
