-- MCP Configuration Wizard
-- This AppleScript helps to configure MCP servers for various AI tools

on run
    display dialog "MCP Configuration Wizard" & return & return & 
        "This wizard will help you set up MCP servers for various AI tools including GitHub Copilot." buttons {"Cancel", "Continue"} default button "Continue"
    
    -- Define paths to important configuration files
    set homeFolder to (path to home folder as text)
    set claudeConfigPath to homeFolder & "Library:Application Support:Claude:claude_desktop_config.json"
    set workspaceFolder to homeFolder & "Desktop:A1-Inter-LLM-Com:The New Fuse:"
    set mcp_config_manager_path to workspaceFolder & "scripts:mcp-config-manager-server.js"
    
    -- Look for potential Copilot config locations
    set copilotConfigPath to homeFolder & "Library:Application Support:GitHub Copilot:mcp_config.json"
    set vscodeConfigPath to homeFolder & "Library:Application Support:Code:User:mcp_config.json"
    
    -- Define potential Copilot config paths
    set potentialConfigPaths to {copilotConfigPath, vscodeConfigPath}
    set configPathExists to false
    set existingConfigPath to ""
    
    -- Check if any of the potential config paths exist
    repeat with aPath in potentialConfigPaths
        try
            tell application "System Events"
                if exists file aPath then
                    set configPathExists to true
                    set existingConfigPath to aPath
                    exit repeat
                end if
            end tell
        on error
            -- Just continue to next path
        end try
    end repeat
    
    -- Ask user where to create the config if none exists
    if not configPathExists then
        set configOptions to {"GitHub Copilot directory", "VS Code User directory", "Custom location..."}
        set configChoice to choose from list configOptions with prompt "No Copilot MCP configuration found. Where would you like to create it?" default items {"VS Code User directory"}
        
        if configChoice is false then
            display dialog "Configuration cancelled." buttons {"OK"} default button "OK"
            return
        end if
        
        set selectedOption to item 1 of configChoice
        
        if selectedOption is "GitHub Copilot directory" then
            set targetConfigPath to copilotConfigPath
        else if selectedOption is "VS Code User directory" then
            set targetConfigPath to vscodeConfigPath
        else
            set customPath to text returned of (display dialog "Enter the full path to the configuration file:" default answer "")
            set targetConfigPath to customPath
        end if
        
        -- Create the directory if needed
        set targetConfigDir to do shell script "dirname " & quoted form of POSIX path of targetConfigPath
        do shell script "mkdir -p " & quoted form of targetConfigDir
    else
        set targetConfigPath to existingConfigPath
    end if
    
    -- Convert to POSIX path for shell commands
    set posixConfigPath to POSIX path of targetConfigPath
    
    -- Check if the config file exists, create it if not
    try
        do shell script "[ -f " & quoted form of posixConfigPath & " ] || echo '{\"mcpServers\": {}}' > " & quoted form of posixConfigPath
    on error errMsg
        display dialog "Error creating configuration file: " & errMsg buttons {"OK"} default button "OK"
        return
    end try
    
    -- Now add the MCP Configuration Manager to the target config file
    set mcp_manager_posix_path to POSIX path of mcp_config_manager_path
    
    -- Use Node.js to add the MCP Config Manager server
    set nodeCmd to "node " & workspaceFolder & "scripts/mcp-config-manager.cjs add " & quoted form of posixConfigPath & " \"mcp-config-manager\" \"node\" " & quoted form of mcp_manager_posix_path
    
    try
        set result to do shell script nodeCmd
        display dialog "MCP Configuration Manager added to " & targetConfigPath & ":" & return & return & result buttons {"OK"} default button "OK"
    on error errMsg
        display dialog "Error adding MCP Configuration Manager: " & errMsg buttons {"OK"} default button "OK"
        return
    end try
    
    -- Offer to set up web-search capability as well
    set setupWebSearch to button returned of (display dialog "Would you like to add web-search capability too?" buttons {"Skip", "Yes"} default button "Yes")
    
    if setupWebSearch is "Yes" then
        set webSearchCmd to "node " & workspaceFolder & "scripts/mcp-config-manager.cjs add " & quoted form of posixConfigPath & " \"web-search\" \"npx\" \"@modelcontextprotocol/server-websearch\""
        
        try
            set webSearchResult to do shell script webSearchCmd
            display dialog "Web Search added to " & targetConfigPath & ":" & return & return & webSearchResult buttons {"OK"} default button "OK"
        on error webSearchErr
            display dialog "Error adding Web Search: " & webSearchErr buttons {"OK"} default button "OK"
        end try
    end if
    
    -- Provide instructions on how to use the MCP Configuration
    display dialog "Configuration complete!" & return & return & 
        "The MCP Configuration Manager has been added to:" & return & 
        targetConfigPath & return & return & 
        "You can now use this configuration with GitHub Copilot or other tools that support the Model Context Protocol." buttons {"OK"} default button "OK"
    
end run
