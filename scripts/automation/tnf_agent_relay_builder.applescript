-- TNF Agent Communication Relay Application Creator v2.3
-- Persistent Project Path Integration

on run
    try
        set appPath to createApplicationWithEnhancedErrorHandling()
        if verifyApplication(appPath) then
            display dialog "TNF Agent Relay v2.3 successfully created at:" & return & appPath & return & return & "Bus: agent-communication/relay" buttons {"OK"} default button 1 with icon note
        else
            display dialog "Application creation reported success, but verification failed." buttons {"OK"} default button 1 with icon stop
        end if
    on error errMsg number errNum
        if errNum is not -128 then
            display dialog "Fatal Error: " & errMsg & " (Code: " & errNum & ")" buttons {"OK"} default button 1 with icon stop
        end if
    end try
end run

on createApplicationWithEnhancedErrorHandling()
    try
        -- Define the persistent project path
        set homePath to POSIX path of (path to home folder)
        set tnfPath to do shell script "if [ -n \"$TNF_ROOT_DIR\" ]; then printf '%s/' \"$TNF_ROOT_DIR\"; else pwd; fi"
        set busPath to tnfPath & "agent-communication/relay/"
        
        -- Define the source code for the RELAY application
        set sourceCode to "
-- TNF Agent Relay Application v2.3
-- Persistent communication bus: " & busPath & "

on run
    display notification \"TNF Agent Relay (Persistent) is active.\" with title \"TNF System\"
end run

on open location theURL
    log \"Received URL signal: \" & theURL
end open location

on dispatchUTPEvent(eventID, actorHandle, sourceContext, contentText)
    set timestamp to do shell script \"date -u +'%Y-%m-%dT%H:%M:%SZ'\"
    set utpJSON to \"{
  \\\"id\\\": \\\"\" & eventID & \"\\\",
  \\\"timestamp\\\": \\\"\" & timestamp & \"\\\",
  \\\"actor\\\": { \\\"handle\\\": \\\"\" & actorHandle & \"\\\" },
  \\\"source\\\": { \\\"type\\\": \\\"relay\\\", \\\"context\\\": \\\"\" & sourceContext & \"\\\" },
  \\\"content\\\": { \\\"text\\\": \\\"\" & contentText & \"\\\", \\\"type\\\": \\\"markdown\\\" }
}\"
    
    set busDir to \"\" & (quoted form of \"" & busPath & "\") & \"\"
    set filePath to \"" & busPath & "utp_\" & eventID & \".json\"
    
    do shell script \"mkdir -p \" & busDir & \" && echo \" & quoted form of utpJSON & \" > \" & quoted form of filePath
    
    display notification \"Dispatched UTP Event: \" & eventID with title \"TNF Relay\"
    return utpJSON
end dispatchUTPEvent
"
        
        set tempScriptPath to POSIX path of (path to temporary items)
        set tempScriptFile to tempScriptPath & "TNFAgentRelayV3Temp.applescript"
        
        do shell script "echo " & quoted form of sourceCode & " > " & quoted form of tempScriptFile
        
        set appName to "TNF Agent Relay.app"
        set savePathPOSIX to homePath & "Desktop/" & appName
        
        -- Compile into application
        do shell script "osacompile -o " & quoted form of savePathPOSIX & " " & quoted form of tempScriptFile
        
        -- Clean up
        do shell script "rm " & quoted form of tempScriptFile
        
        return savePathPOSIX
        
    on error errMsgCreate number errNumCreate
        error errMsgCreate number errNumCreate
    end try
end createApplicationWithEnhancedErrorHandling

on verifyApplication(appPathPOSIX as text)
    try
        do shell script "test -d " & quoted form of appPathPOSIX
        return true
    on error
        return false
    end try
end verifyApplication
