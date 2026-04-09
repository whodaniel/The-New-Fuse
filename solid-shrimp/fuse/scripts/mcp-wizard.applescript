#!/usr/bin/osascript
-- MCP Configuration Wizard
-- This wizard helps scan for available MCP capability providers and configure them in JSON files
-- It follows the correct MCP architecture where servers are capability providers, not traditional servers

on run
    -- Initialize
    set wizardTitle to "MCP Configuration Wizard"
    set introText to "This wizard will help you configure MCP capability providers for your agents."
    
    -- Log to terminal for testing
    do shell script "echo '[MCP Wizard] Starting MCP Configuration Wizard...'"
    
    -- Show introduction
    display dialog introText with title wizardTitle buttons {"Cancel", "Continue"} default button "Continue"
    
    -- Main wizard flow
    mainWizardFlow()
end run

-- Main wizard flow controller
on mainWizardFlow()
    set options to {"Scan System for MCP Capabilities", "Create/Update MCP Configuration", "Register Agent with MCP Tools", "Help/Documentation", "Exit"}
    
    set choice to choose from list options with prompt "What would you like to do?" default items {"Scan System for MCP Capabilities"} with title "MCP Configuration Wizard"
    
    if choice is false then
        return
    else
        set selectedOption to item 1 of choice
        
        if selectedOption is "Scan System for MCP Capabilities" then
            scanForMCPCapabilities()
        else if selectedOption is "Create/Update MCP Configuration" then
            createOrUpdateConfig()
        else if selectedOption is "Register Agent with MCP Tools" then
            registerAgentWithTools()
        else if selectedOption is "Help/Documentation" then
            showHelp()
        else
            -- Exit
            return
        end if
    end if
    
    -- Return to main menu after each action
    mainWizardFlow()
end mainWizardFlow

-- Scan for MCP capabilities
on scanForMCPCapabilities()
    set progressText to "Scanning for MCP capability providers..."
    
    -- Log to terminal for testing
    do shell script "echo '[MCP Wizard] Scanning for MCP capabilities...'"
    
    -- Show progress indicator
    display dialog progressText with title "Scanning..." buttons {"Cancel"} giving up after 2
    
    -- List of potential MCP capability categories to scan for
    set categories to {"Language Models", "File System Access", "Web Search", "Database Access", "AppleScript Automation", "Document Processing", "API Access"}
    
    -- Create empty results dictionary
    set foundCapabilities to {}
    
    -- Check for Node.js MCP packages
    try
        set nodeResult to do shell script "npm list -g | grep -i mcp"
        if nodeResult is not "" then
            set end of foundCapabilities to {category:"Node.js MCP Packages", details:nodeResult}
        end if
    on error
        -- No Node.js MCP packages found
    end try
    
    -- Check for Python MCP packages
    try
        set pythonResult to do shell script "pip list | grep -i mcp"
        if pythonResult is not "" then
            set end of foundCapabilities to {category:"Python MCP Packages", details:pythonResult}
        end if
    on error
        -- No Python MCP packages found
    end try
    
    -- Check for Docker images related to MCP
    try
        set dockerResult to do shell script "docker images | grep -i mcp"
        if dockerResult is not "" then
            set end of foundCapabilities to {category:"Docker MCP Images", details:dockerResult}
        end if
    on error
        -- No Docker MCP images found or Docker not running
    end try
    
    -- Check for local MCP implementations in common directories
    try
        set localResult to do shell script "find ~/Documents ~/Projects -name '*mcp*' -type d -maxdepth 3 2>/dev/null || echo ''"
        if localResult is not "" then
            set end of foundCapabilities to {category:"Local MCP Implementations", details:localResult}
        end if
    on error
        -- Error searching local directories
    end try
    
    -- Present results
    if length of foundCapabilities is 0 then
        display dialog "No MCP capability providers found. You may need to install some MCP packages or implement custom capability providers." buttons {"OK"} default button "OK"
    else
        set resultText to "Found MCP capability providers:" & return & return
        
        repeat with capItem in foundCapabilities
            set resultText to resultText & (category of capItem) & ":" & return & (details of capItem) & return & return
        end repeat
        
        set resultText to resultText & "Would you like to configure any of these capabilities?"
        
        set userChoice to display dialog resultText buttons {"Cancel", "Configure Now"} default button "Configure Now"
        
        if button returned of userChoice is "Configure Now" then
            createOrUpdateConfig()
        end if
    end if
end scanForMCPCapabilities

-- Create or update MCP configuration
on createOrUpdateConfig()
    -- Log to terminal for testing
    do shell script "echo '[MCP Wizard] Opening configuration interface...'"
    
    -- Choose config file
    set configFiles to {"claude_desktop_config.json", "mcp_config.json", "New Config File..."}
    set configChoice to choose from list configFiles with prompt "Select a configuration file to update:" default items {"claude_desktop_config.json"} with title "MCP Configuration"
    
    if configChoice is false then
        return
    end if
    
    set selectedConfig to item 1 of configChoice
    set configPath to ""
    
    if selectedConfig is "New Config File..." then
        set configPath to text returned of (display dialog "Enter the path for the new config file:" default answer "~/mcp_config.json" with title "New Config File")
    else if selectedConfig is "claude_desktop_config.json" then
        set configPath to "~/Library/Application Support/Claude/claude_desktop_config.json"
    else
        -- Find mcp_config.json in common locations
        try
            set findResult to do shell script "find ~/Desktop ~/Documents -name 'mcp_config.json' -type f 2>/dev/null | head -n 1"
            if findResult is not "" then
                set configPath to findResult
            else
                set configPath to "~/mcp_config.json"
            end if
        on error
            set configPath to "~/mcp_config.json"
        end try
    end if
    
    -- Expand ~ to full path
    set configPath to do shell script "echo " & quoted form of configPath
    
    -- Check if file exists
    set fileExists to do shell script "[ -f " & quoted form of configPath & " ] && echo 'yes' || echo 'no'"
    
    -- Parse existing config or create new
    if fileExists is "yes" then
        try
            set configContent to do shell script "cat " & quoted form of configPath
            display dialog "Current configuration:" & return & return & configContent buttons {"Cancel", "Edit"} default button "Edit"
        on error
            display dialog "Error reading configuration file. Creating new configuration." buttons {"OK"} default button "OK"
            createNewConfig(configPath)
        end try
    else
        createNewConfig(configPath)
    end if
    
    -- Add/edit MCP capability provider
    addEditMCPProvider(configPath)
end createOrUpdateConfig

-- Create a new configuration file
on createNewConfig(configPath)
    set initialConfig to "{
  \"mcpServers\": {
  }
}"
    
    do shell script "echo " & quoted form of initialConfig & " > " & quoted form of configPath
    display dialog "Created new configuration file at:" & return & configPath buttons {"OK"} default button "OK"
end createNewConfig

-- Add or edit an MCP capability provider
on addEditMCPProvider(configPath)
    -- Get provider name
    set providerName to text returned of (display dialog "Enter a name for this MCP capability provider:" default answer "my-mcp-capability" with title "Provider Configuration")
    
    -- Get command
    set commandOptions to {"node", "python", "npx", "/usr/local/bin/node", "/usr/bin/python", "docker", "Other..."}
    set commandChoice to choose from list commandOptions with prompt "Select the command to execute this capability provider:" default items {"npx"} with title "Provider Command"
    
    if commandChoice is false then
        return
    end if
    
    set selectedCommand to item 1 of commandChoice
    
    if selectedCommand is "Other..." then
        set selectedCommand to text returned of (display dialog "Enter the command:" default answer "/usr/local/bin/" with title "Custom Command")
    end if
    
    -- Get arguments
    set argString to text returned of (display dialog "Enter command arguments (separate with spaces):" default answer "-y @modelcontextprotocol/server-example" with title "Command Arguments")
    
    -- Convert argument string to array format for JSON
    set argScript to "echo '" & argString & "' | awk '{for(i=1;i<=NF;i++) print \"\\\"\" $i \"\\\",\"}' | sed '$s/,$//' | sed 's/^/[/;s/$/]/' | tr -d '\\n'"
    set argsJSON to do shell script argScript
    
    -- Create provider JSON
    set providerJSON to "\"" & providerName & "\": {
      \"command\": \"" & selectedCommand & "\",
      \"args\": " & argsJSON & "
    }"
    
    -- Update the config file
    updateConfigFile(configPath, providerName, providerJSON)
    
    display dialog "MCP capability provider '" & providerName & "' has been configured." buttons {"OK"} default button "OK"
end addEditMCPProvider

-- Update the config file with new provider
on updateConfigFile(configPath, providerName, providerJSON)
    -- Check if provider already exists
    set checkCmd to "grep -q '\"" & providerName & "\":' " & quoted form of configPath & " && echo 'exists' || echo 'new'"
    set providerExists to do shell script checkCmd
    
    if providerExists is "exists" then
        -- Replace existing provider
        set sedCmd to "sed -i '' -e '/" & providerName & "\":/,/}/c\\
    " & providerJSON & ",' " & quoted form of configPath
        do shell script sedCmd
    else
        -- Add new provider
        set awkCmd to "awk '
        /\"mcpServers\": {/ {
            print $0;
            if (NR == FNR) {
                print \"    " & providerJSON & ",\";
            } else {
                print \"    " & providerJSON & "\";
            }
            next;
        }
        1' " & quoted form of configPath & " > " & quoted form of configPath & ".tmp && mv " & quoted form of configPath & ".tmp " & quoted form of configPath
        
        do shell script awkCmd
    end if
end updateConfigFile

-- Register an agent with MCP tools
on registerAgentWithTools()
    display dialog "This will register an agent with access to MCP tools." & return & return & "Note: In a real implementation, this would update agent configurations in The New Fuse database." buttons {"Cancel", "Continue"} default button "Continue"
    
    set agentName to text returned of (display dialog "Enter the agent name:" default answer "MCP-Wizard-Agent" with title "Agent Registration")
    
    -- Show success message
    display dialog "Agent '" & agentName & "' has been registered with access to MCP tools." & return & return & "The agent can now use MCP capabilities as defined in your configuration." buttons {"OK"} default button "OK"
end registerAgentWithTools

-- Show help and documentation
on showHelp()
    set helpText to "MCP Configuration Wizard Help

What is MCP?
MCP (Model Context Protocol) is a standardized communication protocol for AI models and agents to share context and execute capabilities.

About MCP Capability Providers:
- MCP capability providers expose functionality to LLMs through the MCP protocol
- They are NOT traditional servers that need to be started or run continuously
- They are accessed on-demand when an LLM needs to use their capabilities
- Configuration defines what capabilities are available and how they can be accessed

Configuration Format:
{
  \"mcpServers\": {
    \"provider-name\": {
      \"command\": \"executable-name\",
      \"args\": [\"arg1\", \"arg2\", ...]
    }
  }
}

Best Practices:
- Use meaningful names for capability providers
- Use absolute paths for command executables when needed
- Keep configuration files in version control
- Document the capabilities provided by each MCP provider"

    display dialog helpText buttons {"OK"} default button "OK"
end showHelp
