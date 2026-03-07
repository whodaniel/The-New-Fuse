#!/usr/bin/osascript
-- Universal MCP Configuration Wizard (Streamlined Workflow Version)
-- This wizard helps scan for available MCP capability providers and configure them in JSON files
-- Supports multiple AI tools including GitHub Copilot, Claude, and any other MCP-compatible tools

-- Global variables for tracking state
property currentStep : 0
property totalSteps : 5
property wizardTitle : "Universal MCP Configuration Wizard"
property configuredTools : {}
property foundProviders : {}
property selectedTool : ""
property homeFolder : ""
property workspaceFolder : ""
property lastServerCheck : 0
property mcpServerStatus : "unknown" -- "running", "stopped", or "unknown"

on run
    -- Initialize global variables
    set homeFolder to (path to home folder as string)
    set workspaceFolder to homeFolder & "Desktop:A1-Inter-LLM-Com:The New Fuse:"
    set configuredTools to {}
    set foundProviders to {}
    set selectedTool to ""
    set lastServerCheck to 0
    set mcpServerStatus to "unknown"
    
    -- Reset the step counter
    set currentStep to 0
    set totalSteps to 5
    
    -- Show welcome screen
    showWelcomeScreen()
    
    -- Start main wizard workflow
    startWorkflow()
end run

-- Show welcome screen
on showWelcomeScreen()
    set currentStep to 1
    set introText to "Welcome to the Universal MCP Configuration Wizard

This step-by-step wizard will guide you through:
1. Scanning your system for existing MCP configurations
2. Setting up MCP for your preferred tools
3. Configuring and registering AI agents with MCP

What is MCP? The Model Context Protocol allows AI agents to access tools, share context, and communicate with each other.

Current Step: 1/" & totalSteps & " - Welcome"
    
    -- Log to terminal for testing
    do shell script "echo '[Universal MCP Wizard] Starting Universal MCP Configuration Wizard...'"
    
    display dialog introText with title wizardTitle buttons {"Exit", "Start Wizard"} default button "Start Wizard"
    if button returned of result is "Exit" then
        quit
    end if
end showWelcomeScreen

-- Main entry point for the stepped workflow
on startWorkflow()
    -- Step 2: Scan system
    set currentStep to 2
    scanForMCPCapabilities()
    
    -- Step 3: Configuration options - will be handled by scanForMCPCapabilities result
    
    -- If we made it all the way through, show completion
    showCompletionScreen()
end startWorkflow

-- Helper to check if a file exists (Mac path)
on fileExists(macPath)
    try
        tell application "System Events"
            return (exists file macPath)
        end tell
    on error
        return false
    end try
end fileExists

-- Check if the MCP server is running
on checkMCPServerStatus(endpoint)
    -- Only check once per minute to avoid excessive network requests
    set currentTime to (do shell script "date +%s") as integer
    if (currentTime - lastServerCheck) < 60 and mcpServerStatus is not "unknown" then
        return mcpServerStatus
    end if
    
    set lastServerCheck to currentTime
    
    if endpoint is "" then
        set endpoint to "http://localhost:3772"
    end if
    
    -- Use curl with a short timeout to check if the server is responding
    try
        do shell script "curl -s -o /dev/null -w '%{http_code}' " & quoted form of endpoint & " --connect-timeout 2"
        -- If we get here, the request succeeded
        set mcpServerStatus to "running"
    on error
        set mcpServerStatus to "stopped"
    end try
    
    return mcpServerStatus
end checkMCPServerStatus

-- Step 2: Scan for MCP capabilities
on scanForMCPCapabilities()
    set stepTitle to "Step 2/" & totalSteps & " - System Scan"
    
    display dialog "Scanning your system for MCP capability providers..." with title stepTitle buttons {"Cancel"} default button "Cancel" giving up after 2
    
    -- Clear previous results
    set foundProviders to {}
    set mcpConfigManagerFound to false
    
    -- Look for MCP config manager
    set mcpConfigManagerScriptPath to workspaceFolder & "scripts:mcp-config-manager-server.js"
    set mcpConfigManagerFound to my fileExists(mcpConfigManagerScriptPath)
    
    -- Check if the MCP server is running
    set serverStatus to my checkMCPServerStatus("")
    
    -- Check for Copilot MCP configuration
    set copilotConfigPath to homeFolder & "Library:Application Support:GitHub Copilot:mcp_config.json"
    if my fileExists(copilotConfigPath) then
        set end of foundProviders to {name:"GitHub Copilot", path:copilotConfigPath, configured:true}
    else
        set end of foundProviders to {name:"GitHub Copilot", path:copilotConfigPath, configured:false}
    end if
    
    -- Check for VS Code MCP configuration
    set vscodeConfigPath to homeFolder & "Library:Application Support:Code:User:mcp_config.json"
    if my fileExists(vscodeConfigPath) then
        set end of foundProviders to {name:"VS Code", path:vscodeConfigPath, configured:true}
    else
        set end of foundProviders to {name:"VS Code", path:vscodeConfigPath, configured:false}
    end if
    
    -- Check for Claude MCP configuration
    set claudeConfigPath to homeFolder & "Library:Application Support:Claude:claude_desktop_config.json"
    if my fileExists(claudeConfigPath) then
        set end of foundProviders to {name:"Claude", path:claudeConfigPath, configured:true}
    else
        set end of foundProviders to {name:"Claude", path:claudeConfigPath, configured:false}
    end if
    
    -- Build status description
    set configuredCount to 0
    set statusList to ""
    repeat with provider in foundProviders
        set providerName to name of provider
        set providerConfigured to configured of provider
        
        if providerConfigured then
            set configuredCount to configuredCount + 1
            set statusList to statusList & "✓ " & providerName & " (Configured)" & return
        else
            set statusList to statusList & "○ " & providerName & " (Not Configured)" & return
        end if
    end repeat
    
    -- Show scan results with next steps
    set statusMessage to "MCP Configuration Status:" & return & return
    
    -- Show MCP server status
    if serverStatus is "running" then
        set statusMessage to statusMessage & "✓ MCP Server: Running" & return
    else
        set statusMessage to statusMessage & "⚠️ MCP Server: Not running" & return
    end if
    
    -- Show MCP config manager script status
    if mcpConfigManagerFound then
        set statusMessage to statusMessage & "✓ MCP Manager: Found" & return
    else
        set statusMessage to statusMessage & "⚠️ MCP Manager: Not found" & return
    end if
    
    set statusMessage to statusMessage & return & statusList
    
    if configuredCount > 0 then
        set statusMessage to statusMessage & return & return & "Some tools are already configured. You can configure additional tools or register agents."
    else
        set statusMessage to statusMessage & return & return & "No tools are configured yet. Let's set up MCP for your preferred tools."
    end if
    
    set statusMessage to statusMessage & return & return & "What would you like to do next?"
    
    -- Show status and next steps
    set nextOptions to {"Configure MCP for Tools", "Register Agent with MCP"}
    
    -- Add server options based on status
    if serverStatus is "running" then
        set end of nextOptions to "Check MCP Server Status"
    else
        set end of nextOptions to "Start MCP Server"
    end if
    
    set end of nextOptions to "Exit Wizard"
    set nextStep to choose from list nextOptions with prompt statusMessage with title stepTitle
    
    if nextStep is false then
        -- User cancelled - confirm exit
        set theAnswer to button returned of (display dialog "Do you want to exit the wizard?" buttons {"Continue Wizard", "Exit"} default button "Continue Wizard" with title wizardTitle)
        if theAnswer is "Exit" then
            do shell script "echo '[Universal MCP Wizard] Exiting.'"
            quit
        else
            -- User chose to continue, show scan results again
            scanForMCPCapabilities()
        end if
    else
        set selectedOption to item 1 of nextStep
        if selectedOption is "Configure MCP for Tools" then
            -- Go to step 3
            set currentStep to 3
            showToolConfigurationMenu()
        else if selectedOption is "Register Agent with MCP" then
            -- Skip to step 4
            set currentStep to 4
            registerAgentWorkflow()
        else if selectedOption is "Start MCP Server" then
            -- Try to start the MCP server
            try
                if mcpConfigManagerFound then
                    set serverPathPOSIX to POSIX path of (workspaceFolder & "scripts:mcp-config-manager-server.js")
                    do shell script "echo '[Universal MCP Wizard] Starting MCP server...'"
                    do shell script "node " & quoted form of serverPathPOSIX & " &> /tmp/mcp-server.log &"
                    display dialog "MCP server is now starting in the background." buttons {"Continue"} default button "Continue" with title "MCP Server Starting"
                    -- Refresh the view
                    scanForMCPCapabilities()
                    return
                else
                    display dialog "MCP server script not found. Please check your installation." buttons {"Continue"} default button "Continue" with title "Server Not Found"
                end if
            on error errMsg
                display dialog "Error starting MCP server: " & errMsg buttons {"Continue"} default button "Continue" with title "Server Error"
            end try
            scanForMCPCapabilities()
        else if selectedOption is "Check MCP Server Status" then
            -- Force a server status recheck
            set lastServerCheck to 0
            set serverStatus to my checkMCPServerStatus("")
            if serverStatus is "running" then
                display dialog "MCP Server is running and responsive." buttons {"Continue"} default button "Continue" with title "Server Status"
            else
                display dialog "MCP Server is not responding. You may need to start it." buttons {"Start Server", "Continue"} default button "Continue" with title "Server Status"
                if button returned of result is "Start Server" then
                    -- Try to start the server
                    if mcpConfigManagerFound then
                        set serverPathPOSIX to POSIX path of (workspaceFolder & "scripts:mcp-config-manager-server.js")
                        do shell script "node " & quoted form of serverPathPOSIX & " &> /tmp/mcp-server.log &"
                        display dialog "MCP server is now starting in the background." buttons {"Continue"} default button "Continue" with title "MCP Server Starting"
                    else
                        display dialog "MCP server script not found. Please check your installation." buttons {"Continue"} default button "Continue" with title "Server Not Found"
                    end if
                end if
            end if
            -- Refresh the view
            scanForMCPCapabilities()
            return
        else if selectedOption is "Exit Wizard" then
            do shell script "echo '[Universal MCP Wizard] Exiting.'"
            quit
        end if
    end if
end scanForMCPCapabilities

-- Step 3: Tool configuration menu
on showToolConfigurationMenu()
    set stepTitle to "Step 3/" & totalSteps & " - Tool Configuration"
    
    -- Build status list
    set statusList to ""
    repeat with provider in foundProviders
        set providerName to name of provider
        set providerConfigured to configured of provider
        
        if providerConfigured then
            set statusList to statusList & "✓ " & providerName & return
        else
            set statusList to statusList & "○ " & providerName & return
        end if
    end repeat
    
    set choicePrompt to "Select a tool to configure:" & return & return & statusList
    
    -- Show available tools to configure
    set toolOptions to {}
    repeat with provider in foundProviders
        set end of toolOptions to name of provider
    end repeat
    set end of toolOptions to "Custom Path..."
    set end of toolOptions to "Back to Scan Results"
    set end of toolOptions to "Continue to Agent Registration"
    
    set toolChoice to choose from list toolOptions with prompt choicePrompt with title stepTitle
    
    if toolChoice is false then
        -- User cancelled - go back to scan
        set currentStep to 2
        scanForMCPCapabilities()
    else
        set selectedOption to item 1 of toolChoice
        
        if selectedOption is "Back to Scan Results" then
            -- Go back to step 2
            set currentStep to 2
            scanForMCPCapabilities()
        else if selectedOption is "Continue to Agent Registration" then
            -- Move to step 4
            set currentStep to 4
            registerAgentWorkflow()
        else if selectedOption is "Custom Path..." then
            -- Handle custom path
            configureCustomPath()
        else
            -- Configure specific tool
            configureSingleTool(selectedOption)
        end if
    end if
end showToolConfigurationMenu

-- Configure a single tool
on configureSingleTool(toolName)
    set stepTitle to "Step 3/" & totalSteps & " - Configuring " & toolName
    
    display dialog "Preparing to configure MCP for " & toolName & "..." with title stepTitle buttons {"Continue"} default button "Continue"
    
    -- Common variables used across all tools
    set configPath to ""
    set jsonNameDetail to ""
    set isClaudeStyle to false
    set appSupportSubPath to ""
    
    if toolName is "GitHub Copilot" then
        set appSupportSubPath to "GitHub Copilot"
        set configPath to homeFolder & "Library:Application Support:" & appSupportSubPath & ":mcp_config.json"
        set jsonNameDetail to "Universal MCP Provider for GitHub Copilot"
    else if toolName is "VS Code" then
        set appSupportSubPath to "Code:User" -- VS Code uses a subfolder "User"
        set configPath to homeFolder & "Library:Application Support:" & appSupportSubPath & ":mcp_config.json"
        set jsonNameDetail to "Universal MCP Provider for VS Code"
    else if toolName is "Claude" then
        set appSupportSubPath to "Claude"
        set configPath to homeFolder & "Library:Application Support:" & appSupportSubPath & ":claude_desktop_config.json"
        set jsonNameDetail to "Universal MCP Provider for Claude"
        set isClaudeStyle to true
    else
        display dialog "Internal error: Configuration for " & toolName & " is not supported by this function." buttons {"OK"} default button "OK"
        return
    end if
    
    -- Present configuration options
    set endpointOptions to {"http://localhost:3772", "http://localhost:3773", "http://localhost:3774", "Custom endpoint..."}
    set endpointChoice to choose from list endpointOptions with prompt "Select an endpoint for the MCP provider:" & return & return & "Standard port is 3772, but you can choose alternatives if you have multiple MCP services." with title stepTitle
    
    if endpointChoice is false then
        -- User cancelled - go back to tool selection
        showToolConfigurationMenu()
        return
    end if
    
    set selectedEndpoint to item 1 of endpointChoice
    if selectedEndpoint is "Custom endpoint..." then
        set customEndpointResult to display dialog "Enter the custom endpoint URL:" default answer "http://localhost:3775" with title stepTitle
        set selectedEndpoint to text returned of customEndpointResult
    end if
    
    -- Generate the configuration template
    set mcpConfigTemplate to ""
    if isClaudeStyle then
        set mcpConfigTemplate to "{
  \"initialized\": true,
  \"version\": \"1.0\",
  \"mcp\": {
    \"enabled\": true,
    \"initialize\": {
      \"enabled\": true
    },
    \"capabilities\": [
      {
        \"id\": \"universal-mcp\",
        \"name\": \"" & jsonNameDetail & "\",
        \"endpoint\": \"" & selectedEndpoint & "\",
        \"authentication\": {
          \"type\": \"none\"
        }
      }
    ]
  }
}"
    else
        set mcpConfigTemplate to "{
  \"initialized\": true,
  \"version\": \"1.0\",
  \"capabilities\": [
    {
      \"id\": \"universal-mcp\",
      \"name\": \"" & jsonNameDetail & "\",
      \"endpoint\": \"" & selectedEndpoint & "\",
      \"authentication\": {
        \"type\": \"none\"
      }
    }
  ],
  \"initialize\": {
    \"enabled\": true
  }
}"
    end if
    
    -- Show configuration preview
    set reviewMessage to "MCP Configuration Summary for " & toolName & ":" & return & return
    set reviewMessage to reviewMessage & "• Endpoint: " & selectedEndpoint & return
    set reviewMessage to reviewMessage & "• Configuration will be saved to:" & return & "  " & configPath
    
    set confirmResult to display dialog reviewMessage buttons {"Back", "Create Configuration"} default button "Create Configuration" with title stepTitle
    if button returned of confirmResult is "Back" then
        -- Go back to tool selection
        showToolConfigurationMenu()
        return
    end if
    
    -- Create the configuration
    try
        set posixConfigPath to POSIX path of configPath
        set parentDirPosix to do shell script "dirname " & quoted form of posixConfigPath
        do shell script "mkdir -p " & quoted form of parentDirPosix
        
        do shell script "echo " & quoted form of mcpConfigTemplate & " > " & quoted form of posixConfigPath
        
        -- Update our stored provider list to show this tool as configured
        repeat with i from 1 to length of foundProviders
            if name of item i of foundProviders is toolName then
                set configured of item i of foundProviders to true
                exit repeat
            end if
        end repeat
        
        -- Add to configured tools list
        if toolName is not in configuredTools then
            set end of configuredTools to toolName
        end if
        
        -- Show success and next steps
        set successMessage to "✓ " & toolName & " MCP configuration created successfully!" & return & return
        set successMessage to successMessage & "Configuration saved to:" & return & configPath & return & return
        set successMessage to successMessage & "What would you like to do next?"
        
        set nextOptions to {"Configure Another Tool", "Continue to Agent Registration", "View Configuration Summary", "Exit Wizard"}
        set nextChoice to choose from list nextOptions with prompt successMessage with title stepTitle
        
        if nextChoice is false then
            -- User cancelled - go back to tool menu
            showToolConfigurationMenu()
        else
            set nextStep to item 1 of nextChoice
            
            if nextStep is "Configure Another Tool" then
                showToolConfigurationMenu()
            else if nextStep is "Continue to Agent Registration" then
                set currentStep to 4
                registerAgentWorkflow()
            else if nextStep is "View Configuration Summary" then
                showConfigurationSummary()
            else
                -- Exit
                showCompletionScreen()
            end if
        end if
        
    on error errMsg
        display dialog "Error creating " & toolName & " configuration: " & errMsg buttons {"Back to Tool Selection"} default button "Back to Tool Selection" with title stepTitle
        showToolConfigurationMenu()
    end try
end configureSingleTool

-- Configure custom path
on configureCustomPath()
    set stepTitle to "Step 3/" & totalSteps & " - Custom Configuration"
    
    set customPathResult to display dialog "Enter the full path for the custom MCP JSON configuration file:" default answer (homeFolder & "Desktop:custom_mcp_config.json") buttons {"Back", "Continue"} default button "Continue" with title stepTitle
    
    if button returned of customPathResult is "Back" then
        showToolConfigurationMenu()
        return
    end if
    
    set customPath to text returned of customPathResult
    if customPath is "" then
        display dialog "Path cannot be empty." buttons {"Try Again"} default button "Try Again" with title stepTitle
        configureCustomPath()
        return
    end if
    
    -- Present configuration options
    set endpointOptions to {"http://localhost:3772", "http://localhost:3773", "http://localhost:3774", "Custom endpoint..."}
    set endpointChoice to choose from list endpointOptions with prompt "Select an endpoint for the MCP provider:" & return & return & "Standard port is 3772, but you can choose alternatives if you have multiple MCP services." with title stepTitle
    
    if endpointChoice is false then
        -- User cancelled - go back
        configureCustomPath()
        return
    end if
    
    set selectedEndpoint to item 1 of endpointChoice
    if selectedEndpoint is "Custom endpoint..." then
        set customEndpointResult to display dialog "Enter the custom endpoint URL:" default answer "http://localhost:3775" with title stepTitle
        set selectedEndpoint to text returned of customEndpointResult
    end if
    
    -- Generic MCP configuration template for custom path
    set mcpConfigTemplate to "{
  \"initialized\": true,
  \"version\": \"1.0\",
  \"capabilities\": [
    {
      \"id\": \"custom-universal-mcp\",
      \"name\": \"Universal MCP Provider (Custom)\",
      \"endpoint\": \"" & selectedEndpoint & "\",
      \"authentication\": {
        \"type\": \"none\"
      }
    }
  ],
  \"initialize\": {
    \"enabled\": true
  }
}"
    
    -- Show configuration preview
    set reviewMessage to "Custom MCP Configuration Summary:" & return & return
    set reviewMessage to reviewMessage & "• Endpoint: " & selectedEndpoint & return
    set reviewMessage to reviewMessage & "• Configuration will be saved to:" & return & "  " & customPath
    
    set confirmResult to display dialog reviewMessage buttons {"Back", "Create Configuration"} default button "Create Configuration" with title stepTitle
    if button returned of confirmResult is "Back" then
        configureCustomPath()
        return
    end if
    
    -- Create the configuration
    try
        set posixCustomPath to POSIX path of customPath
        set parentDirPosix to do shell script "dirname " & quoted form of posixCustomPath
        do shell script "mkdir -p " & quoted form of parentDirPosix
        do shell script "echo " & quoted form of mcpConfigTemplate & " > " & quoted form of posixCustomPath
        
        -- Add to configured tools list
        if "Custom Configuration" is not in configuredTools then
            set end of configuredTools to "Custom Configuration"
        end if
        
        -- Show success and next steps
        set successMessage to "✓ Custom MCP configuration created successfully!" & return & return
        set successMessage to successMessage & "Configuration saved to:" & return & customPath & return & return
        set successMessage to successMessage & "What would you like to do next?"
        
        set nextOptions to {"Configure Another Tool", "Continue to Agent Registration", "View Configuration Summary", "Exit Wizard"}
        set nextChoice to choose from list nextOptions with prompt successMessage with title stepTitle
        
        if nextChoice is false then
            -- User cancelled - go back to tool menu
            showToolConfigurationMenu()
        else
            set nextStep to item 1 of nextChoice
            
            if nextStep is "Configure Another Tool" then
                showToolConfigurationMenu()
            else if nextStep is "Continue to Agent Registration" then
                set currentStep to 4
                registerAgentWorkflow()
            else if nextStep is "View Configuration Summary" then
                showConfigurationSummary()
            else
                -- Exit
                showCompletionScreen()
            end if
        end if
        
    on error errMsg
        display dialog "Error creating custom configuration: " & errMsg buttons {"Back"} default button "Back" with title stepTitle
        configureCustomPath()
    end try
end configureCustomPath

-- Show configuration summary
on showConfigurationSummary()
    set stepTitle to "Configuration Summary"
    
    set summaryText to "MCP Configuration Summary:" & return & return
    
    if length of configuredTools is 0 then
        set summaryText to summaryText & "No tools have been configured yet." & return
    else
        repeat with tool in configuredTools
            set summaryText to summaryText & "✓ " & tool & " has been configured" & return
        end repeat
    end if
    
    set summaryText to summaryText & return & "What would you like to do next?"
    
    set nextOptions to {"Configure More Tools", "Continue to Agent Registration", "Exit Wizard"}
    set nextChoice to choose from list nextOptions with prompt summaryText with title stepTitle
    
    if nextChoice is false then
        -- User cancelled - go back to tool menu
        showToolConfigurationMenu()
    else
        set nextStep to item 1 of nextChoice
        
        if nextStep is "Configure More Tools" then
            showToolConfigurationMenu()
        else if nextStep is "Continue to Agent Registration" then
            set currentStep to 4
            registerAgentWorkflow()
        else
            -- Exit
            showCompletionScreen()
        end if
    end if
end showConfigurationSummary

-- Step 4: Agent registration workflow
on registerAgentWorkflow()
    set stepTitle to "Step 4/" & totalSteps & " - Agent Registration"
    
    if length of configuredTools is 0 then
        set warningMessage to "Warning: No MCP tools have been configured yet." & return & return
        set warningMessage to warningMessage & "It's recommended to configure MCP for at least one tool before registering an agent." & return & return
        set warningMessage to warningMessage & "Would you like to configure tools first or proceed with agent registration?"
        
        set warningOptions to {"Configure Tools First", "Proceed with Registration"}
        set warningChoice to choose from list warningOptions with prompt warningMessage with title stepTitle
        
        if warningChoice is false or warningChoice contains "Configure Tools First" then
            set currentStep to 3
            showToolConfigurationMenu()
            return
        end if
    end if
    
    -- Introduction to agent registration
    set introMessage to "Agent Registration Workflow" & return & return
    set introMessage to introMessage & "This step will create a JSON file that registers an AI agent with MCP." & return
    set introMessage to introMessage & "The agent will be able to use the MCP capabilities you've configured." & return & return
    set introMessage to introMessage & "Would you like to proceed?"
    
    set introResult to display dialog introMessage buttons {"Back", "Continue"} default button "Continue" with title stepTitle
    
    if button returned of introResult is "Back" then
        -- Go back to previous step or summary
        if length of configuredTools > 0 then
            showConfigurationSummary()
        else
            set currentStep to 2
            scanForMCPCapabilities()
        end if
        return
    end if
    
    -- Get agent information - Name
    set agentNameResult to display dialog "Enter the agent name:" default answer "MyAgent" buttons {"Back", "Continue"} default button "Continue" with title stepTitle
    
    if button returned of agentNameResult is "Back" then
        registerAgentWorkflow()
        return
    end if
    
    set agentName to text returned of agentNameResult
    if agentName is "" then
        display dialog "Agent name cannot be empty." buttons {"Try Again"} default button "Try Again" with title stepTitle
        registerAgentWorkflow()
        return
    end if
    
    -- Get agent information - ID
    set agentIDResult to display dialog "Enter the agent ID (leave blank to auto-generate):" default answer "" buttons {"Back", "Continue"} default button "Continue" with title stepTitle
    
    if button returned of agentIDResult is "Back" then
        registerAgentWorkflow()
        return
    end if
    
    set agentID to text returned of agentIDResult
    if agentID is "" then
        -- Generate a simple UUID-like ID
        set agentID to "agent-" & do shell script "openssl rand -hex 8"
    end if
    
    -- Capability selection using a step-by-step interface
    registerAgentCapabilities(agentName, agentID)
end registerAgentWorkflow

-- Handle capability selection for agent registration
on registerAgentCapabilities(agentName, agentID)
    set stepTitle to "Step 4/" & totalSteps & " - Agent Capabilities"
    
    -- Pre-defined capabilities
    set availableCapabilities to {"text-generation", "code-generation", "image-generation", "tool-execution", "data-analysis"}
    set selectedCapabilities to {}
    
    -- Selected status display
    set selectedStatus to ""
    
    -- Main capability selection loop
    set continueSelection to true
    repeat while continueSelection
        -- Update status of selections
        set selectedStatus to ""
        if length of selectedCapabilities is 0 then
            set selectedStatus to "No capabilities selected yet."
        else
            repeat with cap in selectedCapabilities
                set selectedStatus to selectedStatus & "✓ " & cap & return
            end repeat
        end if
        
        -- Show capability options
        set capabilityMessage to "Select agent capabilities:" & return & return
        set capabilityMessage to capabilityMessage & "Currently selected:" & return & selectedStatus & return
        set capabilityMessage to capabilityMessage & "Choose capabilities one by one or select an action below:"
        
        -- Build options list - available capabilities + actions
        set capabilityOptions to {}
        repeat with cap in availableCapabilities
            if cap is not in selectedCapabilities then
                set end of capabilityOptions to cap
            end if
        end repeat
        set end of capabilityOptions to "Add Custom Capability..."
        set end of capabilityOptions to "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯"
        if length of selectedCapabilities > 0 then
            set end of capabilityOptions to "✓ Complete Capability Selection"
        end if
        set end of capabilityOptions to "◀ Back to Agent Information"
        
        set capChoice to choose from list capabilityOptions with prompt capabilityMessage with title stepTitle
        
        if capChoice is false then
            -- User cancelled - confirm
            set confirmResult to display dialog "Cancel capability selection?" buttons {"Continue Selection", "Back to Agent Information"} default button "Continue Selection" with title stepTitle
            if button returned of confirmResult is "Back to Agent Information" then
                registerAgentWorkflow()
                return
            end if
            -- Otherwise continue in the loop
        else
            set selectedOption to item 1 of capChoice
            
            if selectedOption is "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯" then
                -- Separator - do nothing
            else if selectedOption is "Add Custom Capability..." then
                -- Handle custom capability
                set customCapResult to display dialog "Enter custom capability:" default answer "" buttons {"Cancel", "Add"} default button "Add" with title stepTitle
                if button returned of customCapResult is "Add" then
                    set customCapText to text returned of customCapResult
                    if customCapText is not "" and customCapText is not in selectedCapabilities then
                        set end of selectedCapabilities to customCapText
                    end if
                end if
            else if selectedOption is "✓ Complete Capability Selection" then
                -- Done with capabilities
                set continueSelection to false
            else if selectedOption is "◀ Back to Agent Information" then
                -- Go back
                registerAgentWorkflow()
                return
            else
                -- Selected a capability - add it
                if selectedOption is not in selectedCapabilities then
                    set end of selectedCapabilities to selectedOption
                end if
            end if
        end if
    end repeat
    
    -- Check if at least one capability was selected
    if length of selectedCapabilities is 0 then
        set noCapResult to display dialog "No capabilities selected. Agent requires at least one capability." buttons {"Add Capabilities"} default button "Add Capabilities" with title stepTitle
        registerAgentCapabilities(agentName, agentID)
        return
    end if
    
    -- Format capabilities as JSON array items
    set capabilitiesJSONParts to {}
    repeat with cap in selectedCapabilities
        set end of capabilitiesJSONParts to "\"" & cap & "\""
    end repeat
    
    -- Combine with commas
    set oldDelimiters to AppleScript's text item delimiters
    set AppleScript's text item delimiters to ", "
    set capabilitiesJSON to capabilitiesJSONParts as text
    set AppleScript's text item delimiters to oldDelimiters
    
    -- Generate the agent registration template
    set agentRegistration to "{
  \"agentId\": \"" & agentID & "\",
  \"name\": \"" & agentName & "\",
  \"capabilities\": [" & capabilitiesJSON & "],
  \"mcp\": {
    \"version\": \"1.0\",
    \"initialize\": {
      \"enabled\": true
    }
  }
}"
    
    -- Choose save location
    set registrationPathOptions to {"Default Location", "Specify Custom Location"}
    set pathChoice to choose from list registrationPathOptions with prompt "Where would you like to save the agent registration JSON file?" with title stepTitle
    
    if pathChoice is false then
        -- User cancelled - go back to capability selection
        registerAgentCapabilities(agentName, agentID)
        return
    end if
    
    set registrationPath to ""
    if pathChoice contains "Default Location" then
        -- Use default path
        set registrationPath to workspaceFolder & "agent_registration_" & agentID & ".json"
    else
        -- Get custom path
        set customPathResult to display dialog "Enter the full path for the agent registration file:" default answer (workspaceFolder & "agent_registration_" & agentID & ".json") buttons {"Back", "Continue"} default button "Continue" with title stepTitle
        
        if button returned of customPathResult is "Back" then
            -- Go back to location selection
            registerAgentCapabilities(agentName, agentID)
            return
        end if
        
        set registrationPath to text returned of customPathResult
    end if
    
    -- Show registration summary
    set summaryMessage to "Agent Registration Summary:" & return & return
    set summaryMessage to summaryMessage & "• Agent Name: " & agentName & return
    set summaryMessage to summaryMessage & "• Agent ID: " & agentID & return
    set summaryMessage to summaryMessage & "• Capabilities: " & length of selectedCapabilities & " selected" & return
    set summaryMessage to summaryMessage & "• Registration will be saved to:" & return & "  " & registrationPath & return & return
    set summaryMessage to summaryMessage & "Create this agent registration?"
    
    set confirmResult to display dialog summaryMessage buttons {"Back", "Create Registration"} default button "Create Registration" with title stepTitle
    
    if button returned of confirmResult is "Back" then
        -- Go back to capability selection
        registerAgentCapabilities(agentName, agentID)
        return
    end if
    
    -- Create the registration file
    try
        set posixRegistrationPath to POSIX path of registrationPath
        set parentDirPosix to do shell script "dirname " & quoted form of posixRegistrationPath
        do shell script "mkdir -p " & quoted form of parentDirPosix
        do shell script "echo " & quoted form of agentRegistration & " > " & quoted form of posixRegistrationPath
        
        -- Show success message
        set successMessage to "✓ Agent registration created successfully!" & return & return
        set successMessage to successMessage & "Registration file saved to:" & return & registrationPath & return & return
        set successMessage to successMessage & "What would you like to do next?"
        
        set nextOptions to {"Register Another Agent", "View Agent Details", "Configuration Summary", "Complete Wizard"}
        set nextChoice to choose from list nextOptions with prompt successMessage with title stepTitle
        
        if nextChoice is false then
            -- Default to completion
            showCompletionScreen()
        else
            set nextStep to item 1 of nextChoice
            
            if nextStep is "Register Another Agent" then
                registerAgentWorkflow()
            else if nextStep is "View Agent Details" then
                -- Show detailed agent information
                showAgentDetails(agentName, agentID, selectedCapabilities, registrationPath)
            else if nextStep is "Configuration Summary" then
                showConfigurationSummary()
            else
                -- Complete
                showCompletionScreen()
            end if
        end if
        
    on error errMsg
        display dialog "Error creating agent registration: " & errMsg buttons {"Try Again"} default button "Try Again" with title stepTitle
        registerAgentWorkflow()
    end try
end registerAgentCapabilities

-- Show agent details screen
on showAgentDetails(agentName, agentID, capabilities, registrationPath)
    set stepTitle to "Agent Details"
    
    -- Format capabilities list
    set capabilitiesList to ""
    repeat with cap in capabilities
        set capabilitiesList to capabilitiesList & "• " & cap & return
    end repeat
    
    set detailsMessage to "Agent Details:" & return & return
    set detailsMessage to detailsMessage & "Name: " & agentName & return
    set detailsMessage to detailsMessage & "ID: " & agentID & return & return
    set detailsMessage to detailsMessage & "Capabilities:" & return & capabilitiesList & return
    set detailsMessage to detailsMessage & "Registration File:" & return & registrationPath & return & return
    set detailsMessage to detailsMessage & "What would you like to do next?"
    
    set nextOptions to {"Register Another Agent", "Configuration Summary", "Complete Wizard"}
    set nextChoice to choose from list nextOptions with prompt detailsMessage with title stepTitle
    
    if nextChoice is false then
        -- Default to completion
        showCompletionScreen()
    else
        set nextStep to item 1 of nextChoice
        
        if nextStep is "Register Another Agent" then
            registerAgentWorkflow()
        else if nextStep is "Configuration Summary" then
            showConfigurationSummary()
        else
            -- Complete
            showCompletionScreen()
        end if
    end if
end showAgentDetails

-- Step 5: Show completion screen
on showCompletionScreen()
    set currentStep to totalSteps
    set stepTitle to "Step " & currentStep & "/" & totalSteps & " - Wizard Complete"
    
    -- Check MCP server status
    set serverStatus to my checkMCPServerStatus("")
    
    -- Summarize what was accomplished
    set completionMessage to "✓ Universal MCP Configuration Wizard Complete" & return & return
    
    if length of configuredTools is 0 then
        set completionMessage to completionMessage & "No MCP tools were configured." & return
    else
        set completionMessage to completionMessage & "Configured MCP for " & length of configuredTools & " tool(s):" & return
        repeat with tool in configuredTools
            set completionMessage to completionMessage & "• " & tool & return
        end repeat
    end if
    
    -- Add server status information
    set completionMessage to completionMessage & return & "MCP Server Status: "
    if serverStatus is "running" then
        set completionMessage to completionMessage & "✓ Running and ready" & return
    else
        set completionMessage to completionMessage & "⚠️ Not detected" & return
        set completionMessage to completionMessage & "⚠️ You need to start your MCP server for the configurations to work." & return
    end if
    
    set completionMessage to completionMessage & return & "The MCP configurations are now ready to use." & return & return
    set completionMessage to completionMessage & "Next Steps:" & return
    if serverStatus is not "running" then
        set completionMessage to completionMessage & "1. Start your MCP server using 'node mcp-config-manager-server.js'" & return
    end if
    set completionMessage to completionMessage & (if serverStatus is not "running" then "2" else "1") & ". Restart your configured tools" & return
    set completionMessage to completionMessage & (if serverStatus is not "running" then "3" else "2") & ". Your agents should now be able to access MCP capabilities" & return & return
    
    if length of configuredTools is 0 then
        set completionMessage to completionMessage & "⚠️ Note: You haven't configured any tools yet. You may want to start over and configure tools first." & return & return
    end if
    
    set completionMessage to completionMessage & "Thank you for using the Universal MCP Configuration Wizard!"
    
    display dialog completionMessage buttons {"Start MCP Server", "Exit", "Start Over"} default button "Exit" with title stepTitle
    
    set buttonResult to button returned of result
    if buttonResult is "Start Over" then
        -- Reset and start over
        set configuredTools to {}
        set foundProviders to {}
        set selectedTool to ""
        set currentStep to 0
        
        -- Show welcome and restart workflow
        showWelcomeScreen()
        startWorkflow()
    else if buttonResult is "Start MCP Server" then
        -- Try to launch the MCP server
        try
            set serverPath to workspaceFolder & "scripts:mcp-config-manager-server.js"
            if my fileExists(serverPath) then
                set serverPathPOSIX to POSIX path of serverPath
                do shell script "echo '[Universal MCP Wizard] Starting MCP server...'"
                do shell script "node " & quoted form of serverPathPOSIX & " &> /tmp/mcp-server.log &"
                display dialog "MCP server starting in the background. Configuration complete!" buttons {"Exit"} default button "Exit" with title "MCP Server Started"
            else
                display dialog "MCP server script not found at: " & serverPath & ". Please locate and run the server manually." buttons {"OK"} default button "OK" with title "Server Not Found"
            end if
        on error errMsg
            display dialog "Error starting MCP server: " & errMsg buttons {"OK"} default button "OK" with title "Server Start Error"
        end try
        quit
    else
        -- Exit
        do shell script "echo '[Universal MCP Wizard] Completed and exiting.'"
        quit
    end if
end showCompletionScreen