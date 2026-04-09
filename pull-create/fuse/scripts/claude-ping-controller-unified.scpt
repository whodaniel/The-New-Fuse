#!/usr/bin/osascript

-- Claude Ping Controller - Unified System
-- Consolidates all ping functionality into a single, comprehensive controller
-- Combines: GUI, Menu Bar, Dock, Process Management, and Advanced Features

-- ===================================
-- GLOBAL VARIABLES AND CONFIGURATION
-- ===================================

global pingProcess
global isRunning
global keepGUIOpen
global pingInterval
global pingCount
global lastPingTime
global startTime
global totalUptime
global errorCount
global lastErrorTime
global configPath
global logPath
global pidPath
global processID
global interfaceMode
global autoRestart
global maxRetries
global currentRetries
global notificationsEnabled
global soundEnabled
global debugMode

-- Initialize global state
set isRunning to false
set keepGUIOpen to true
set pingInterval to 10
set pingCount to 0
set lastPingTime to ""
set startTime to ""
set totalUptime to 0
set errorCount to 0
set lastErrorTime to ""
set configPath to (path to home folder as string) & ".claude_ping_config"
set logPath to "/tmp/claude_ping_unified.log"
set pidPath to "/tmp/claude_ping_unified.pid"
set processID to (do shell script "echo $$")
set interfaceMode to "gui" -- options: gui, menubar, dock, headless
set autoRestart to true
set maxRetries to 5
set currentRetries to 0
set notificationsEnabled to true
set soundEnabled to true
set debugMode to false

-- ===================================
-- MAIN ENTRY POINT
-- ===================================

on run
    try
        -- Load configuration
        loadConfiguration()
        
        -- Initialize logging
        logMessage("Claude Ping Controller Unified - Starting up")
        
        -- Determine interface mode from arguments or default
        set interfaceMode to getInterfaceMode()
        
        -- Launch appropriate interface
        if interfaceMode is "gui" then
            launchGUIInterface()
        else if interfaceMode is "menubar" then
            launchMenuBarInterface()
        else if interfaceMode is "dock" then
            launchDockInterface()
        else if interfaceMode is "headless" then
            launchHeadlessInterface()
        else
            -- Default to GUI
            launchGUIInterface()
        end if
        
    on error errMsg
        logMessage("Startup error: " & errMsg)
        display alert "Claude Ping Controller startup failed: " & errMsg
    end try
end run

-- ===================================
-- CORE PING ENGINE
-- ===================================

-- Main ping function - unified from all versions
on sendPing()
    try
        -- Check if we should continue running
        if not isRunning then
            return false
        end if
        
        -- Check for stop signals
        if checkStopSignals() then
            stopPingSystem()
            return false
        end if
        
        -- Activate Claude Desktop
        tell application "Claude" to activate
        delay 1
        
        -- Send the ping message
        tell application "System Events"
            tell application process "Claude"
                -- Type the ping message
                keystroke "ping - continue monitoring"
                delay 0.5
                
                -- Press Enter to send
                key code 36
                delay 0.5
                
                -- Backup: Try Cmd+Enter if Enter alone doesn't work
                key code 36 using {command down}
                delay 0.5
            end tell
        end tell
        
        -- Update statistics
        set pingCount to pingCount + 1
        set lastPingTime to (current date) as string
        set currentRetries to 0
        
        -- Log success
        logMessage("Ping #" & pingCount & " sent successfully")
        
        -- Send notification if enabled
        if notificationsEnabled then
            display notification "Ping #" & pingCount & " sent" with title "Claude Ping Controller"
        end if
        
        return true
        
    on error errMsg
        -- Handle ping failure
        set errorCount to errorCount + 1
        set lastErrorTime to (current date) as string
        set currentRetries to currentRetries + 1
        
        logMessage("Ping failed (attempt " & currentRetries & "/" & maxRetries & "): " & errMsg)
        
        -- Check if we should retry or give up
        if currentRetries >= maxRetries and not autoRestart then
            logMessage("Max retries reached, stopping ping system")
            stopPingSystem()
            return false
        end if
        
        return false
    end try
end sendPing

-- Main ping loop - consolidated from all versions
on startPingLoop()
    try
        -- Set running state
        set isRunning to true
        set startTime to (current date) as string
        set pingCount to 0
        set errorCount to 0
        set currentRetries to 0
        
        -- Create PID file
        do shell script "echo '" & processID & "' > '" & pidPath & "'"
        
        -- Log startup
        logMessage("Ping system started - Interval: " & pingInterval & "s")
        
        -- Main ping loop
        repeat while isRunning
            -- Send ping
            set pingSuccess to sendPing()
            
            -- Wait for next ping
            delay pingInterval
        end repeat
        
    on error errMsg
        logMessage("Ping loop error: " & errMsg)
        stopPingSystem()
    end try
end startPingLoop

-- ===================================
-- PROCESS MANAGEMENT
-- ===================================

-- Start the ping system
on startPingSystem()
    try
        if isRunning then
            showMessage("Ping system is already running!")
            return
        end if
        
        -- Start ping in background
        do shell script "osascript -e 'tell application \"" & (path to me as string) & "\" to startPingLoop()' > " & logPath & " 2>&1 &"
        
        set isRunning to true
        logMessage("Ping system started")
        
        if notificationsEnabled then
            display notification "Claude Ping system started!" with title "Ping Controller" sound name (getSoundName())
        end if
        
    on error errMsg
        logMessage("Failed to start ping system: " & errMsg)
        showMessage("Failed to start ping system: " & errMsg)
    end try
end startPingSystem

-- Stop the ping system
on stopPingSystem()
    try
        if not isRunning then
            showMessage("Ping system is not running!")
            return
        end if
        
        -- Set stop flag
        set isRunning to false
        
        -- Kill all ping processes
        do shell script "pkill -f 'claude-ping' 2>/dev/null || true"
        do shell script "pkill -f 'claude.*ping' 2>/dev/null || true"
        
        -- Create stop signal
        do shell script "touch /tmp/claude_ping_stop_signal"
        
        -- Remove PID file
        do shell script "rm -f '" & pidPath & "' 2>/dev/null || true"
        
        -- Calculate uptime
        if startTime is not "" then
            set endTime to (current date)
            set totalUptime to totalUptime + ((endTime - (date startTime)) as integer)
        end if
        
        logMessage("Ping system stopped - Total pings sent: " & pingCount)
        
        if notificationsEnabled then
            display notification "Claude Ping system stopped!" with title "Ping Controller" sound name (getSoundName())
        end if
        
    on error errMsg
        logMessage("Error stopping ping system: " & errMsg)
    end try
end stopPingSystem

-- Restart the ping system
on restartPingSystem()
    try
        logMessage("Restarting ping system...")
        stopPingSystem()
        delay 2
        startPingSystem()
    on error errMsg
        logMessage("Failed to restart ping system: " & errMsg)
    end try
end restartPingSystem

-- Check for stop signals
on checkStopSignals()
    try
        -- Check for stop signal file
        do shell script "ls /tmp/claude_ping_stop_signal 2>/dev/null"
        return true
    on error
        -- No stop signal found
        return false
    end try
end checkStopSignals

-- Check if ping is currently running
on isPingRunning()
    try
        set processCheck to (do shell script "ps aux | grep 'claude.*ping' | grep -v grep | wc -l")
        return (processCheck as integer) > 0
    on error
        return false
    end try
end isPingRunning

-- ===================================
-- INTERFACE MODES
-- ===================================

-- GUI Interface (consolidated from all GUI versions)
on launchGUIInterface()
    repeat while keepGUIOpen
        try
            -- Update running status
            set isRunning to isPingRunning()
            
            -- Create main control panel
            set controlPanel to createGUIPanel()
            set buttonPressed to button returned of controlPanel
            
            -- Handle button actions
            if buttonPressed is "Start Ping" then
                startPingSystem()
            else if buttonPressed is "Stop Ping" then
                stopPingSystem()
            else if buttonPressed is "Restart" then
                restartPingSystem()
            else if buttonPressed is "Settings" then
                showSettingsPanel()
            else if buttonPressed is "Status" then
                showStatusPanel()
            else if buttonPressed is "Logs" then
                showLogViewer()
            else if buttonPressed is "Quit" then
                stopPingSystem()
                set keepGUIOpen to false
                exit repeat
            end if
            
            delay 1
            
        on error
            exit repeat
        end try
    end repeat
end launchGUIInterface

-- Create GUI control panel
on createGUIPanel()
    set statusText to getStatusText()
    set statsText to getStatsText()
    
    return (display dialog "Claude Ping Controller - Unified" & return & return & 
        statusText & return & 
        statsText & return & return & 
        "Choose an action:" 
        buttons {"Quit", "Logs", "Status", "Settings", "Restart", "Stop Ping", "Start Ping"} 
        default button "Start Ping" 
        with title "🎯 Claude Ping Controller")
end createGUIPanel

-- Menu Bar Interface
on launchMenuBarInterface()
    try
        -- Create menu bar app structure
        createMenuBarApp()
        
        -- Start menu monitoring loop
        repeat while keepGUIOpen
            -- Check for menu interaction trigger
            if checkMenuTrigger() then
                showMenuBarMenu()
            end if
            delay 1
        end repeat
        
    on error errMsg
        logMessage("Menu bar interface error: " & errMsg)
    end try
end launchMenuBarInterface

-- Dock Interface
on launchDockInterface()
    try
        -- Create dock icon
        createDockIcon()
        
        -- Start dock monitoring loop
        repeat while keepGUIOpen
            delay 2
            if checkDockClick() then
                showDockControls()
            end if
        end repeat
        
    on error errMsg
        logMessage("Dock interface error: " & errMsg)
    end try
end launchDockInterface

-- Headless Interface (command line)
on launchHeadlessInterface()
    try
        logMessage("Starting in headless mode")
        startPingLoop()
    on error errMsg
        logMessage("Headless interface error: " & errMsg)
    end try
end launchHeadlessInterface

-- ===================================
-- SETTINGS AND CONFIGURATION
-- ===================================

-- Show settings panel
on showSettingsPanel()
    try
        set settingsDialog to (display dialog "Claude Ping Controller Settings" & return & return & 
            "Ping Interval: " & pingInterval & " seconds" & return & 
            "Auto Restart: " & autoRestart & return & 
            "Notifications: " & notificationsEnabled & return & 
            "Sound: " & soundEnabled & return & 
            "Debug Mode: " & debugMode & return & return & 
            "Choose setting to modify:" 
            buttons {"Cancel", "Advanced", "Basic"} 
            default button "Basic")
        
        set choice to button returned of settingsDialog
        
        if choice is "Basic" then
            showBasicSettings()
        else if choice is "Advanced" then
            showAdvancedSettings()
        end if
        
    on error
        -- User cancelled
    end try
end showSettingsPanel

-- Basic settings
on showBasicSettings()
    try
        -- Ping interval setting
        set intervalDialog to (display dialog "Ping Interval Settings" & return & return & 
            "Current interval: " & pingInterval & " seconds" & return & 
            "Enter new interval (5-60 seconds):" 
            default answer (pingInterval as string) 
            buttons {"Cancel", "Save"} 
            default button "Save")
        
        if button returned of intervalDialog is "Save" then
            set newInterval to (text returned of intervalDialog) as integer
            if newInterval >= 5 and newInterval <= 60 then
                set pingInterval to newInterval
                saveConfiguration()
                showMessage("Interval updated to " & pingInterval & " seconds")
                
                -- Restart if running
                if isRunning then
                    restartPingSystem()
                end if
            else
                showMessage("Interval must be between 5 and 60 seconds")
            end if
        end if
        
    on error errMsg
        showMessage("Invalid interval value")
    end try
end showBasicSettings

-- Advanced settings
on showAdvancedSettings()
    try
        set advancedDialog to (display dialog "Advanced Settings" & return & return & 
            "Toggle settings:" 
            buttons {"Cancel", "Toggle Debug", "Toggle Sound", "Toggle Notifications", "Toggle Auto-Restart"} 
            default button "Cancel")
        
        set choice to button returned of advancedDialog
        
        if choice is "Toggle Auto-Restart" then
            set autoRestart to not autoRestart
            showMessage("Auto-restart: " & autoRestart)
        else if choice is "Toggle Notifications" then
            set notificationsEnabled to not notificationsEnabled
            showMessage("Notifications: " & notificationsEnabled)
        else if choice is "Toggle Sound" then
            set soundEnabled to not soundEnabled
            showMessage("Sound: " & soundEnabled)
        else if choice is "Toggle Debug" then
            set debugMode to not debugMode
            showMessage("Debug mode: " & debugMode)
        end if
        
        if choice is not "Cancel" then
            saveConfiguration()
        end if
        
    on error
        -- User cancelled
    end try
end showAdvancedSettings

-- Load configuration from file
on loadConfiguration()
    try
        set configData to (do shell script "cat '" & configPath & "' 2>/dev/null || echo ''")
        if configData is not "" then
            -- Parse configuration (simplified key=value format)
            set configLines to paragraphs of configData
            repeat with configLine in configLines
                if configLine contains "=" then
                    set oldDelims to AppleScript's text item delimiters
                    set AppleScript's text item delimiters to "="
                    set configKey to text item 1 of configLine
                    set configValue to text item 2 of configLine
                    set AppleScript's text item delimiters to oldDelims
                    
                    -- Apply configuration values
                    if configKey is "pingInterval" then
                        set pingInterval to (configValue as integer)
                    else if configKey is "autoRestart" then
                        set autoRestart to (configValue as boolean)
                    else if configKey is "notificationsEnabled" then
                        set notificationsEnabled to (configValue as boolean)
                    else if configKey is "soundEnabled" then
                        set soundEnabled to (configValue as boolean)
                    else if configKey is "debugMode" then
                        set debugMode to (configValue as boolean)
                    end if
                end if
            end repeat
        end if
    on error errMsg
        logMessage("Failed to load configuration: " & errMsg)
    end try
end loadConfiguration

-- Save configuration to file
on saveConfiguration()
    try
        set configData to "pingInterval=" & pingInterval & return & 
            "autoRestart=" & autoRestart & return & 
            "notificationsEnabled=" & notificationsEnabled & return & 
            "soundEnabled=" & soundEnabled & return & 
            "debugMode=" & debugMode & return
        
        do shell script "echo '" & configData & "' > '" & configPath & "'"
        logMessage("Configuration saved")
        
    on error errMsg
        logMessage("Failed to save configuration: " & errMsg)
    end try
end saveConfiguration

-- ===================================
-- STATUS AND MONITORING
-- ===================================

-- Show detailed status panel
on showStatusPanel()
    try
        set statusInfo to getDetailedStatus()
        display dialog statusInfo buttons {"OK"} with title "System Status"
    on error
        -- User cancelled
    end try
end showStatusPanel

-- Get current status text
on getStatusText()
    if isRunning then
        return "🟢 RUNNING"
    else
        return "🔴 STOPPED"
    end if
end getStatusText

-- Get statistics text
on getStatsText()
    return "Pings: " & pingCount & " | Errors: " & errorCount & " | Interval: " & pingInterval & "s"
end getStatsText

-- Get detailed status information
on getDetailedStatus()
    set uptimeText to ""
    if startTime is not "" then
        set currentTime to (current date)
        try
            set sessionUptime to ((currentTime - (date startTime)) as integer)
            set uptimeText to "Session Uptime: " & formatUptime(sessionUptime) & return
        on error
            set uptimeText to "Session Uptime: Calculating..." & return
        end try
    end if
    
    return "Claude Ping Controller - Detailed Status" & return & return & 
        "Status: " & getStatusText() & return & 
        "Pings Sent: " & pingCount & return & 
        "Error Count: " & errorCount & return & 
        "Ping Interval: " & pingInterval & " seconds" & return & 
        uptimeText & 
        "Total Uptime: " & formatUptime(totalUptime) & return & 
        "Last Ping: " & lastPingTime & return & 
        "Last Error: " & lastErrorTime & return & 
        "Auto Restart: " & autoRestart & return & 
        "Notifications: " & notificationsEnabled & return & 
        "Process ID: " & processID
end getDetailedStatus

-- Format uptime in human readable format
on formatUptime(seconds)
    set hours to seconds div 3600
    set minutes to (seconds mod 3600) div 60
    set secs to seconds mod 60
    
    return hours & "h " & minutes & "m " & secs & "s"
end formatUptime

-- ===================================
-- LOGGING SYSTEM
-- ===================================

-- Log message with timestamp
on logMessage(message)
    try
        set timestamp to (current date) as string
        set logEntry to "[" & timestamp & "] " & message
        
        -- Write to log file
        do shell script "echo '" & logEntry & "' >> '" & logPath & "'"
        
        -- Debug output if enabled
        if debugMode then
            display notification message with title "Debug Log"
        end if
        
    on error
        -- Fail silently if logging fails
    end try
end logMessage

-- Show log viewer
on showLogViewer()
    try
        set logContent to (do shell script "tail -20 '" & logPath & "' 2>/dev/null || echo 'No logs found'")
        display dialog "Recent Log Entries:" & return & return & logContent buttons {"OK"} with title "Log Viewer"
    on error
        display dialog "Could not read log file" buttons {"OK"}
    end try
end showLogViewer

-- Clear logs
on clearLogs()
    try
        do shell script "rm -f '" & logPath & "'"
        logMessage("Logs cleared")
        showMessage("Logs cleared successfully")
    on error errMsg
        showMessage("Failed to clear logs: " & errMsg)
    end try
end clearLogs

-- ===================================
-- UTILITY FUNCTIONS
-- ===================================

-- Show message (notification or dialog based on interface mode)
on showMessage(message)
    if interfaceMode is "headless" then
        logMessage(message)
    else if notificationsEnabled then
        display notification message with title "Claude Ping Controller"
    else
        display dialog message buttons {"OK"} with title "Claude Ping Controller"
    end if
end showMessage

-- Get interface mode from arguments or environment
on getInterfaceMode()
    try
        -- Check for command line arguments or environment variables
        set envMode to (do shell script "echo $CLAUDE_PING_MODE 2>/dev/null || echo 'gui'")
        return envMode
    on error
        return "gui"
    end try
end getInterfaceMode

-- Get sound name based on settings
on getSoundName()
    if soundEnabled then
        return "Glass"
    else
        return ""
    end if
end getSoundName

-- Create menu bar app (simplified)
on createMenuBarApp()
    try
        display notification "Claude Ping Controller - Menu Bar Mode Active" with title "Menu Bar App"
        logMessage("Menu bar interface started")
    on error errMsg
        logMessage("Failed to create menu bar app: " & errMsg)
    end try
end createMenuBarApp

-- Check for menu trigger
on checkMenuTrigger()
    try
        -- Check for trigger file or other signal
        do shell script "ls /tmp/claude_ping_menu_trigger 2>/dev/null"
        do shell script "rm -f /tmp/claude_ping_menu_trigger"
        return true
    on error
        return false
    end try
end checkMenuTrigger

-- Show menu bar menu
on showMenuBarMenu()
    try
        set menuChoice to (display dialog "Claude Ping Menu" & return & return & 
            getStatusText() & return & 
            getStatsText() & return & return & 
            "Quick Actions:" 
            buttons {"Hide", "Settings", "Toggle"} 
            default button "Toggle" 
            with title "🎯 Claude Ping")
        
        set choice to button returned of menuChoice
        
        if choice is "Toggle" then
            if isRunning then
                stopPingSystem()
            else
                startPingSystem()
            end if
        else if choice is "Settings" then
            showSettingsPanel()
        end if
        
    on error
        -- User cancelled
    end try
end showMenuBarMenu

-- Create dock icon
on createDockIcon()
    try
        display notification "Claude Ping Controller - Dock Mode Active" with title "Dock Icon Ready"
        logMessage("Dock interface started")
    on error errMsg
        logMessage("Failed to create dock icon: " & errMsg)
    end try
end createDockIcon

-- Check for dock click
on checkDockClick()
    try
        -- Check for dock interaction trigger
        do shell script "ls /tmp/claude_ping_dock_trigger 2>/dev/null"
        do shell script "rm -f /tmp/claude_ping_dock_trigger"
        return true
    on error
        return false
    end try
end checkDockClick

-- Show dock controls
on showDockControls()
    try
        set dockChoice to (display dialog "Claude Ping Dock Control" & return & return & 
            getStatusText() & return & 
            getStatsText() & return & return & 
            "Dock Actions:" 
            buttons {"Hide", "Settings", "Toggle"} 
            default button "Toggle" 
            with title "🎯 Dock Control")
        
        set choice to button returned of dockChoice
        
        if choice is "Toggle" then
            if isRunning then
                stopPingSystem()
            else
                startPingSystem()
            end if
        else if choice is "Settings" then
            showSettingsPanel()
        end if
        
    on error
        -- User cancelled
    end try
end showDockControls

-- ===================================
-- EMERGENCY FUNCTIONS
-- ===================================

-- Nuclear stop - stops everything
on emergencyStop()
    try
        logMessage("Emergency stop initiated")
        
        -- Kill all processes
        do shell script "pkill -f 'claude' 2>/dev/null || true"
        do shell script "pkill -f 'ping' 2>/dev/null || true"
        do shell script "killall -9 osascript 2>/dev/null || true"
        
        -- Remove all temp files
        do shell script "rm -f /tmp/claude_ping_* 2>/dev/null || true"
        
        -- Reset state
        set isRunning to false
        set keepGUIOpen to false
        
        display notification "Emergency stop completed!" with title "Claude Ping Controller" sound name "Basso"
        
    on error errMsg
        logMessage("Emergency stop error: " & errMsg)
    end try
end emergencyStop

-- ===================================
-- STARTUP HELPER
-- ===================================

-- Quick start function for external calls
on quickStart()
    set interfaceMode to "headless"
    startPingLoop()
end quickStart

-- Quick stop function for external calls  
on quickStop()
    stopPingSystem()
end quickStop

-- Status check function for external calls
on quickStatus()
    return getDetailedStatus()
end quickStatus
