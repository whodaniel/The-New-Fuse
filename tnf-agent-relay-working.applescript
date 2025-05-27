-- TNF Agent Relay v2.1 (Working Version)
property relayID : "TNF-RELAY-001"
property isRunning : false

on run
    display dialog "🚀 TNF Agent Relay v2.1" & return & return & "Choose an action:" buttons {"Start Setup", "Exit"} default button "Start Setup"
    
    if button returned of result is "Start Setup" then
        my setupRelay()
    end if
end run

on setupRelay()
    -- Initialize
    set homeFolder to (path to home folder as string)
    set workspaceFolder to homeFolder & "Desktop:A1-Inter-LLM-Com:The New Fuse:"
    
    -- Create log
    set logPath to POSIX path of (workspaceFolder & "relay.log")
    do shell script "echo '[" & (current date) & "] TNF Relay initialized' >> " & quoted form of logPath
    
    display dialog "✅ TNF Agent Relay initialized!" & return & return & "Workspace: " & workspaceFolder buttons {"Continue"} default button "Continue"
    
    my mainMenu()
end setupRelay

on mainMenu()
    set choice to choose from list {"🔍 Discover Agents", "📡 Test Communication", "⚙️ MCP Status", "📋 View Logs", "❌ Exit"} with prompt "TNF Agent Relay Control:" with title "Main Menu"
    
    if choice is not false then
        set selected to item 1 of choice
        
        if selected contains "Discover" then
            my discoverAgents()
        else if selected contains "Test" then
            my testComm()
        else if selected contains "MCP" then
            my mcpStatus()
        else if selected contains "Logs" then
            my viewLogs()
        else
            return
        end if
        
        my mainMenu()
    end if
end mainMenu

on discoverAgents()
    set homeFolder to (path to home folder as string)
    set agents to ""
    
    tell application "System Events"
        if exists file (homeFolder & "Library:Application Support:Claude:claude_desktop_config.json") then
            set agents to agents & "✅ Claude MCP Agent" & return
        end if
        
        if exists file (homeFolder & "Library:Application Support:Code:User:mcp_config.json") then
            set agents to agents & "✅ VS Code MCP Agent" & return
        end if
        
        if exists file (homeFolder & "Library:Application Support:GitHub Copilot:mcp_config.json") then
            set agents to agents & "✅ Copilot MCP Agent" & return
        end if
    end tell
    
    if agents is "" then
        set agents to "❌ No MCP agents found"
    end if
    
    display dialog "🤖 Discovered Agents:" & return & return & agents buttons {"OK"} with title "Agent Discovery"
end discoverAgents

on testComm()
    set testMsg to "Test message from TNF Relay at " & (current date as text)
    
    -- Log test message
    set homeFolder to (path to home folder as string)
    set workspaceFolder to homeFolder & "Desktop:A1-Inter-LLM-Com:The New Fuse:"
    set logPath to POSIX path of (workspaceFolder & "relay.log")
    
    do shell script "echo '[" & (current date) & "] TEST MESSAGE: " & quoted form of testMsg & " >> " & quoted form of logPath
    
    display dialog "📡 Test message sent!" & return & return & testMsg buttons {"OK"} with title "Communication Test"
end testComm

on mcpStatus()
    set homeFolder to (path to home folder as string)
    set status to ""
    
    tell application "System Events"
        if exists file (homeFolder & "Library:Application Support:Claude:claude_desktop_config.json") then
            set status to status & "✅ Claude MCP: Found" & return
        else
            set status to status & "❌ Claude MCP: Not found" & return
        end if
        
        if exists file (homeFolder & "Library:Application Support:Code:User:mcp_config.json") then
            set status to status & "✅ VS Code MCP: Found" & return
        else
            set status to status & "❌ VS Code MCP: Not found" & return
        end if
    end tell
    
    try
        do shell script "curl -s http://localhost:3772 --connect-timeout 2"
        set status to status & "✅ MCP Server: Running"
    on error
        set status to status & "❌ MCP Server: Not responding"
    end try
    
    display dialog "⚙️ MCP Status:" & return & return & status buttons {"OK"} with title "MCP Integration"
end mcpStatus

on viewLogs()
    try
        set homeFolder to (path to home folder as string)
        set workspaceFolder to homeFolder & "Desktop:A1-Inter-LLM-Com:The New Fuse:"
        set logPath to POSIX path of (workspaceFolder & "relay.log")
        set logs to do shell script "tail -10 " & quoted form of logPath
        display dialog "📋 Recent Logs:" & return & return & logs buttons {"OK"} with title "Relay Logs"
    on error
        display dialog "No logs found." buttons {"OK"}
    end try
end viewLogs
