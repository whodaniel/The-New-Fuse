-- TNF Agent Communication Relay v1.0
-- A universal relay for AI agent communication across environments

-- Global properties
property relayID : ""
property isRunning : false
property agentRegistry : {}
property messageLog : {}

-- Initialize the relay
on initializeRelay()
    set relayID to "TNF_relay_" & (do shell script "date +%s") & "_" & (random number from 1000 to 9999)
    set agentRegistry to {}
    set messageLog to {}
    set isRunning to false

    -- Setup directories for messages
    do shell script "mkdir -p /tmp/thefuse/vscode"
    do shell script "mkdir -p /tmp/thefuse/chrome"
    do shell script "mkdir -p /tmp/thefuse/terminal"

    return relayID
end initializeRelay

-- Add sample agents (in a real implementation these would be discovered)
on discoverAgents()
    set agentRegistry to {}

    -- VS Code agents
    set vsAgent to {id:"vscode_agent_1", name:"VS Code Agent", environment:"vscode", capabilities:"code_review,refactoring"}
    set end of agentRegistry to vsAgent

    -- Chrome agents
    set chromeAgent to {id:"chrome_agent_1", name:"Chrome Agent", environment:"chrome", capabilities:"web_interaction,content_extraction"}
    set end of agentRegistry to chromeAgent

    -- Terminal agents
    set terminalAgent to {id:"terminal_agent_1", name:"Terminal Agent", environment:"terminal", capabilities:"command_execution,system_analysis"}
    set end of agentRegistry to terminalAgent

    return "Discovered " & (count of agentRegistry) & " agents"
end discoverAgents

-- Format a message following The New Fuse A2A protocol
on formatMessage(targetId, actionType, messageContent)
    set formattedMessage to "{
        \"type\": \"COLLABORATION_REQUEST\",
        \"source\": \"" & relayID & "\",
        \"target\": \"" & targetId & "\",
        \"content\": {
            \"action\": \"" & actionType & "\",
            " & messageContent & "
        },
        \"timestamp\": \"" & (do shell script "date -u +\"%Y-%m-%dT%H:%M:%SZ\"") & "\"
    }"

    return formattedMessage
end formatMessage

-- Send a message to a specific agent
on sendAgentMessage(targetId, actionType, messageContent)
    -- Find the target agent
    set targetAgent to {}
    set targetEnvironment to ""

    repeat with agent in agentRegistry
        if (id of agent) is targetId then
            set targetAgent to agent
            set targetEnvironment to environment of agent
            exit repeat
        end if
    end repeat

    if targetEnvironment is "" then
        return "Error: Agent " & targetId & " not found"
    end if

    -- Format the message
    set formattedMessage to formatMessage(targetId, actionType, messageContent)

    -- Log the message
    set newLogEntry to {timestamp:current date, targetId:targetId, targetName:name of targetAgent, environment:targetEnvironment, content:formattedMessage}
    set end of messageLog to newLogEntry

    -- Write to the appropriate environment directory
    set messageFilename to "/tmp/thefuse/" & targetEnvironment & "/message_" & (do shell script "date +%s") & ".json"
    do shell script "echo '" & formattedMessage & "' > " & messageFilename

    return "Message sent to " & (name of targetAgent) & " via " & targetEnvironment & " (saved to " & messageFilename & ")"
end sendAgentMessage

-- Show the agent selection UI
on showAgentSelectionUI()
    -- Create list of agent options
    set agentOptions to {}
    repeat with agent in agentRegistry
        set end of agentOptions to (name of agent) & " (" & (id of agent) & ")"
    end repeat

    if (count of agentOptions) is 0 then
        display dialog "No agents available. Please discover agents first." buttons {"OK"} default button 1
        return {id:"", result:"no_agents"}
    end if

    -- Show agent selection dialog
    set agentChoice to choose from list agentOptions with prompt "Select target agent:" default items item 1 of agentOptions

    if agentChoice is false then
        return {id:"", result:"cancelled"}
    end if

    -- Extract agent ID from selection
    set selectedAgent to item 1 of agentChoice
    set idStart to offset of "(" in selectedAgent
    set idEnd to offset of ")" in selectedAgent
    set agentId to text (idStart + 1) thru (idEnd - 1) of selectedAgent

    return {id:agentId, result:"selected"}
end showAgentSelectionUI

-- Show message type selection UI
on showMessageTypeUI()
    set messageTypes to {"code_review", "refactoring", "documentation", "web_interaction", "command_execution", "custom"}

    set typeChoice to choose from list messageTypes with prompt "Select message type:" default items item 1 of messageTypes

    if typeChoice is false then
        return {type:"", result:"cancelled"}
    end if

    return {type:(item 1 of typeChoice), result:"selected"}
end showMessageTypeUI

-- Get message template based on type
on getMessageTemplate(messageType)
    if messageType is "code_review" then
        return "\"task_type\": \"code_review\",
            \"context\": {
                \"file\": \"packages/core/src/services/agent/agent.service.ts\",
                \"focus_areas\": [\"error_handling\", \"memory_management\"]
            },
            \"priority\": \"medium\""
    else if messageType is "refactoring" then
        return "\"task_type\": \"refactor\",
            \"context\": {
                \"file\": \"packages/ui-components/src/core/agent/AgentCard.tsx\",
                \"objective\": \"Improve performance and readability\"
            },
            \"priority\": \"high\""
    else if messageType is "documentation" then
        return "\"task_type\": \"documentation\",
            \"context\": {
                \"topic\": \"Agent Communication Protocol\",
                \"audience\": \"developers\"
            },
            \"priority\": \"low\""
    else if messageType is "web_interaction" then
        return "\"task_type\": \"content_extraction\",
            \"context\": {
                \"url\": \"https://example.com/documentation\",
                \"elements\": [\"main-content\", \"sidebar-navigation\"]
            },
            \"priority\": \"medium\""
    else if messageType is "command_execution" then
        return "\"task_type\": \"system_analysis\",
            \"context\": {
                \"command\": \"analyze_system_performance\",
                \"args\": [\"--detailed\", \"--format=json\"]
            },
            \"priority\": \"low\""
    else
        return "\"task_type\": \"custom\",
            \"context\": {
                \"description\": \"Custom task\"
            },
            \"priority\": \"medium\""
    end if
end getMessageTemplate

-- Show the message content UI
on showMessageContentUI(messageType)
    set template to getMessageTemplate(messageType)

    set contentDialog to display dialog "Edit message content:" default answer template buttons {"Cancel", "Send"} default button 2

    if button returned of contentDialog is "Cancel" then
        return {content:"", result:"cancelled"}
    end if

    return {content:(text returned of contentDialog), result:"edited"}
end showMessageContentUI

-- Show message log UI
on showMessageLogUI()
    if (count of messageLog) is 0 then
        display dialog "No messages have been sent yet." buttons {"OK"} default button 1
        return
    end if

    set logText to "Message Log:" & return & return

    -- Show the most recent messages (up to 5)
    set startIndex to 1
    if (count of messageLog) > 5 then
        set startIndex to (count of messageLog) - 4
    end if

    repeat with i from startIndex to (count of messageLog)
        set entry to item i of messageLog
        set logText to logText & "Time: " & (timestamp of entry) & return
        set logText to logText & "Target: " & (targetName of entry) & " (" & (targetId of entry) & ")" & return
        set logText to logText & "Environment: " & (environment of entry) & return
        set logText to logText & "Content: " & (text 1 thru 100 of (content of entry)) & "..." & return & return
    end repeat

    display dialog logText buttons {"OK"} default button 1
end showMessageLogUI

-- Show the about dialog
on showAboutUI()
    set aboutText to "TNF Agent Communication Relay v1.0" & return & return
    set aboutText to aboutText & "This application enables AI agents to communicate across different environments in The New Fuse ecosystem:" & return & return
    set aboutText to aboutText & "• VS Code Extension" & return
    set aboutText to aboutText & "• Chrome Extension" & return
    set aboutText to aboutText & "• Terminal Applications" & return
    set aboutText to aboutText & "• Redis-connected agents" & return & return
    set aboutText to aboutText & "Messages follow The New Fuse A2A protocol as defined in the documentation." & return & return
    set aboutText to aboutText & "Relay ID: " & relayID

    display dialog aboutText buttons {"OK"} default button 1
end showAboutUI

-- Show main UI
on showMainUI()
    set mainTitle to "TNF Agent Communication Relay"

    -- Determine status text
    set statusText to "Running"
    if not isRunning then
        set statusText to "Stopped"
    end if

    set mainText to return & "Status: " & statusText & return
    set mainText to mainText & "Relay ID: " & relayID & return
    set mainText to mainText & "Discovered Agents: " & (count of agentRegistry)

    display dialog mainTitle & mainText buttons {"Start/Stop", "Discover", "Send Message", "Logs", "About", "Quit"} default button 3
    return button returned of result
end showMainUI

-- Main application run loop
on run
    -- Initialize
    initializeRelay()

    -- Main loop
    repeat
        set userChoice to showMainUI()

        if userChoice is "Start/Stop" then
            -- Toggle the running state
            set isRunning to not isRunning

        else if userChoice is "Discover" then
            -- Discover available agents
            set discoverResult to discoverAgents()
            display dialog discoverResult buttons {"OK"} default button 1

        else if userChoice is "Send Message" then
            -- Only allow sending if the relay is running
            if not isRunning then
                display dialog "Please start the relay first." buttons {"OK"} default button 1
            else
                -- Select agent
                set agentSelection to showAgentSelectionUI()

                if (result of agentSelection) is "selected" then
                    -- Select message type
                    set messageTypeSelection to showMessageTypeUI()

                    if (result of messageTypeSelection) is "selected" then
                        -- Edit message content
                        set contentResult to showMessageContentUI(type of messageTypeSelection)

                        if (result of contentResult) is "edited" then
                            -- Send the message
                            set sendResult to sendAgentMessage(id of agentSelection, type of messageTypeSelection, content of contentResult)
                            display dialog sendResult buttons {"OK"} default button 1
                        end if
                    end if
                end if
            end if

        else if userChoice is "Logs" then
            -- Show message logs
            showMessageLogUI()

        else if userChoice is "About" then
            -- Show about dialog
            showAboutUI()

        else if userChoice is "Quit" then
            -- Exit the application
            exit repeat
        end if
    end repeat
end run
