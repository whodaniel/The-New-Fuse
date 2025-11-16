// Enhanced Communication Hub UI JavaScript - Tabbed Container Version
(function() {
    // Get VS Code API (shared with tabbed container)
    const vscode = window.vscode || acquireVsCodeApi();
    
    // State management
    let hubState = {
        currentTab: 'hub-dashboard',
        sessions: [],
        agents: [],
        performanceMetrics: {},
        features: [],
        networkConnections: []
    };
    
    // DOM Elements will be initialized after DOM loads
    let elements = {};
    
    // Initialize when DOM is ready or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        // Wait a bit for the tabbed container to set up first
        setTimeout(() => {
            // Initialize DOM elements
            initializeElements();
            
            // Setup event listeners
            setupEventListeners();
            
            // Request initial state
            requestInitialState();
            
            // Setup message handler (reuse existing window listener if available)
            if (!window.communicationHubMessageHandler) {
                window.addEventListener('message', handleMessage);
                window.communicationHubMessageHandler = true;
            }
            
            // Start periodic updates
            startPeriodicUpdates();
        }, 100);
    }
    
    /**
     * Initialize DOM elements
     */
    function initializeElements() {
        elements = {
            // Hub internal tabs (within the communication tab)
            hubTabs: document.querySelectorAll('.hub-tab'),
            hubTabContents: document.querySelectorAll('.hub-tab-content'),
            
            // Dashboard
            dashboardMessageInput: document.getElementById('dashboard-message-input'),
            dashboardSendButton: document.getElementById('dashboard-send-button'),
            activeSessionsCount: document.getElementById('active-sessions-count'),
            connectedAgentsCount: document.getElementById('connected-agents-count'),
            messageRate: document.getElementById('message-rate'),
            networkHealth: document.getElementById('network-health'),
            
            // Sessions
            sessionList: document.getElementById('session-list'),
            createSessionBtn: document.getElementById('create-session-btn'),
            
            // Agents
            agentList: document.getElementById('agent-list'),
            
            // Performance
            memoryUsage: document.getElementById('memory-usage'),
            cpuUsage: document.getElementById('cpu-usage'),
            networkLatency: document.getElementById('network-latency'),
            throughput: document.getElementById('throughput'),
            errorRate: document.getElementById('error-rate'),
            uptime: document.getElementById('uptime'),
            
            // Features
            featureList: document.getElementById('feature-list'),
            
            // Network
            connectionList: document.getElementById('connection-list')
        };
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Hub internal tab switching (within communication panel)
        if (elements.hubTabs) {
            elements.hubTabs.forEach(tab => {
                tab.addEventListener('click', () => switchHubTab(tab.dataset.hubTab));
            });
        }
        
        // Dashboard
        if (elements.dashboardSendButton) {
            elements.dashboardSendButton.addEventListener('click', sendDashboardMessage);
        }
        if (elements.dashboardMessageInput) {
            elements.dashboardMessageInput.addEventListener('keydown', handleDashboardKeyDown);
        }
        
        // Sessions
        if (elements.createSessionBtn) {
            elements.createSessionBtn.addEventListener('click', createNewSession);
        }
        
        // Handle Enter key for message inputs within communication hub
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && e.target.tagName === 'TEXTAREA') {
                // Only handle if we're in the communication tab
                const communicationTab = document.querySelector('[data-tab-id="communication"]');
                if (communicationTab && communicationTab.classList.contains('active')) {
                    e.preventDefault();
                    if (e.target === elements.dashboardMessageInput) {
                        sendDashboardMessage();
                    }
                }
            }
        });
    }
    
    /**
     * Switch between hub internal tabs (within communication panel)
     */
    function switchHubTab(tabName) {
        // Update hub tab buttons
        if (elements.hubTabs) {
            elements.hubTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.hubTab === tabName);
            });
        }
        
        // Update hub tab content
        if (elements.hubTabContents) {
            elements.hubTabContents.forEach(content => {
                content.classList.toggle('active', content.dataset.hubTab === tabName);
            });
        }
        
        hubState.currentTab = tabName;
        
        // Request specific data for the tab
        switch (tabName) {
            case 'hub-sessions':
                requestSessions();
                break;
            case 'hub-agents':
                requestAgents();
                break;
            case 'hub-performance':
                requestPerformanceMetrics();
                break;
            case 'hub-features':
                requestFeatures();
                break;
            case 'hub-network':
                requestNetworkStatus();
                break;
        }
    }
    
    /**
     * Send message from dashboard
     */
    function sendDashboardMessage() {
        const text = elements.dashboardMessageInput?.value?.trim();
        if (text) {
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            elements.dashboardMessageInput.value = '';
            elements.dashboardMessageInput.focus();
        }
    }
    
    /**
     * Handle keyboard events for dashboard
     */
    function handleDashboardKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendDashboardMessage();
        }
    }
    
    /**
     * Create new session
     */
    function createNewSession() {
        const sessionName = prompt('Enter session name:');
        if (sessionName) {
            vscode.postMessage({
                command: 'createSession',
                sessionName: sessionName,
                platform: 'vscode'
            });
        }
    }
    
    /**
     * Request initial state
     */
    function requestInitialState() {
        vscode.postMessage({ command: 'getHubState' });
    }
    
    /**
     * Request sessions
     */
    function requestSessions() {
        vscode.postMessage({ command: 'getSessions' });
    }
    
    /**
     * Request agents
     */
    function requestAgents() {
        vscode.postMessage({ command: 'getAgents' });
    }
    
    /**
     * Request performance metrics
     */
    function requestPerformanceMetrics() {
        vscode.postMessage({ command: 'getPerformanceMetrics' });
    }
    
    /**
     * Request features
     */
    function requestFeatures() {
        // Features are included in initial state, but we can refresh them
        vscode.postMessage({ command: 'getHubState' });
    }
    
    /**
     * Request network status
     */
    function requestNetworkStatus() {
        // Network connections are included in initial state
        vscode.postMessage({ command: 'getHubState' });
    }
    
    /**
     * Handle messages from the extension
     */
    function handleMessage(event) {
        const message = event.data;
        
        // Only handle communication hub messages
        if (!message.command || !message.command.startsWith('hub:') && 
            !['initialState', 'sessionUpdate', 'agentUpdate', 'performanceUpdate', 'featureUpdate', 'connectionStatus', 'newMessage', 'showError'].includes(message.command)) {
            return;
        }
        
        switch (message.command) {
            case 'initialState':
            case 'hub:initialState':
                updateHubState(message.state);
                break;
                
            case 'sessionUpdate':
            case 'hub:sessionUpdate':
                updateSessions(message.sessions);
                break;
                
            case 'agentUpdate':
            case 'hub:agentUpdate':
                updateAgents(message.agents);
                break;
                
            case 'performanceUpdate':
            case 'hub:performanceUpdate':
                updatePerformanceMetrics(message.metrics);
                break;
                
            case 'featureUpdate':
            case 'hub:featureUpdate':
                updateFeatures(message.features);
                break;
                
            case 'connectionStatus':
            case 'hub:connectionStatus':
                updateNetworkConnections(message.connections);
                break;
                
            case 'newMessage':
            case 'hub:newMessage':
                // Handle new messages in the dashboard or current session
                break;
                
            case 'showError':
            case 'hub:showError':
                showError(message.error);
                break;
        }
    }
    
    /**
     * Update hub state
     */
    function updateHubState(state) {
        hubState = { ...hubState, ...state };
        
        // Update dashboard metrics
        updateDashboardMetrics();
        
        // Update current tab content
        switch (hubState.currentTab) {
            case 'hub-sessions':
                updateSessions(state.sessions);
                break;
            case 'hub-agents':
                updateAgents(state.agents);
                break;
            case 'hub-performance':
                updatePerformanceMetrics(state.performanceMetrics);
                break;
            case 'hub-features':
                updateFeatures(state.features);
                break;
            case 'hub-network':
                updateNetworkConnections(state.networkConnections);
                break;
        }
    }
    
    /**
     * Update dashboard metrics
     */
    function updateDashboardMetrics() {
        if (elements.activeSessionsCount) {
            elements.activeSessionsCount.textContent = hubState.sessions?.length || 0;
        }
        
        if (elements.connectedAgentsCount) {
            elements.connectedAgentsCount.textContent = hubState.agents?.length || 0;
        }
        
        if (elements.messageRate && hubState.performanceMetrics) {
            elements.messageRate.innerHTML = `${Math.round(hubState.performanceMetrics.messageRate || 0)}<span class="metric-unit">/min</span>`;
        }
        
        if (elements.networkHealth) {
            const connectedCount = hubState.networkConnections?.filter(([_, conn]) => conn.status === 'connected').length || 0;
            const totalCount = hubState.networkConnections?.length || 0;
            const isHealthy = connectedCount === totalCount && totalCount > 0;
            
            elements.networkHealth.innerHTML = `
                <span class="status-indicator ${isHealthy ? 'status-online' : 'status-error'}"></span>
                ${isHealthy ? 'Online' : 'Degraded'}
            `;
        }
    }
    
    /**
     * Update sessions display
     */
    function updateSessions(sessions) {
        if (!elements.sessionList) {return;}
        
        elements.sessionList.innerHTML = '';
        
        if (!sessions || sessions.length === 0) {
            elements.sessionList.innerHTML = '<div class="empty-state">No active sessions</div>';
            return;
        }
        
        sessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session-item';
            sessionElement.innerHTML = `
                <div class="session-header">
                    <div class="session-name">${escapeHtml(session.name)}</div>
                    <span class="status-indicator ${session.isActive ? 'status-online' : 'status-offline'}"></span>
                </div>
                <div class="session-stats">
                    ${session.participants?.length || 0} participants • 
                    ${session.messageCount || 0} messages • 
                    ${session.platform || 'unknown'}
                </div>
            `;
            
            sessionElement.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'joinSession',
                    sessionId: session.id
                });
            });
            
            elements.sessionList.appendChild(sessionElement);
        });
    }
    
    /**
     * Update agents display
     */
    function updateAgents(agents) {
        if (!elements.agentList) {return;}
        
        elements.agentList.innerHTML = '';
        
        if (!agents || agents.length === 0) {
            elements.agentList.innerHTML = '<div class="empty-state">No connected agents</div>';
            return;
        }
        
        agents.forEach(agent => {
            const agentElement = document.createElement('div');
            agentElement.className = 'agent-item';
            agentElement.innerHTML = `
                <div class="agent-header">
                    <div class="agent-name">${escapeHtml(agent.name)}</div>
                    <span class="status-indicator status-${agent.status}"></span>
                </div>
                <div class="agent-stats">
                    ${agent.platform} • ${agent.capabilities?.join(', ') || 'No capabilities'}
                </div>
            `;
            
            elements.agentList.appendChild(agentElement);
        });
    }
    
    /**
     * Update performance metrics
     */
    function updatePerformanceMetrics(metrics) {
        if (!metrics) {return;}
        
        if (elements.memoryUsage) {
            elements.memoryUsage.innerHTML = `${Math.round(metrics.memoryUsage || 0)}<span class="metric-unit">%</span>`;
        }
        
        if (elements.cpuUsage) {
            elements.cpuUsage.innerHTML = `${Math.round(metrics.cpuUsage || 0)}<span class="metric-unit">%</span>`;
        }
        
        if (elements.networkLatency) {
            elements.networkLatency.innerHTML = `${Math.round(metrics.networkLatency || 0)}<span class="metric-unit">ms</span>`;
        }
        
        if (elements.throughput) {
            elements.throughput.innerHTML = `${Math.round(metrics.throughput || 0)}<span class="metric-unit">B/s</span>`;
        }
        
        if (elements.errorRate) {
            elements.errorRate.innerHTML = `${Math.round(metrics.errorRate || 0)}<span class="metric-unit">%</span>`;
        }
        
        if (elements.uptime) {
            const hours = Math.floor((metrics.uptime || 0) / (1000 * 60 * 60));
            elements.uptime.innerHTML = `${hours}<span class="metric-unit">h</span>`;
        }
    }
    
    /**
     * Update features display
     */
    function updateFeatures(features) {
        if (!elements.featureList || !features) {return;}
        
        elements.featureList.innerHTML = '';
        
        features.forEach(feature => {
            const featureElement = document.createElement('div');
            featureElement.className = 'feature-item';
            featureElement.innerHTML = `
                <div class="feature-info">
                    <div class="feature-name">
                        <span class="status-indicator status-${feature.status}"></span>
                        ${escapeHtml(feature.name)}
                    </div>
                    <div class="feature-description">${escapeHtml(feature.description)}</div>
                </div>
                <input type="checkbox" class="feature-toggle" ${feature.enabled ? 'checked' : ''} 
                       data-feature-id="${feature.id}">
            `;
            
            const toggle = featureElement.querySelector('.feature-toggle');
            toggle.addEventListener('change', () => {
                vscode.postMessage({
                    command: 'toggleFeature',
                    featureId: feature.id,
                    enabled: toggle.checked
                });
            });
            
            elements.featureList.appendChild(featureElement);
        });
    }
    
    /**
     * Update network connections display
     */
    function updateNetworkConnections(connections) {
        if (!elements.connectionList || !connections) {return;}
        
        elements.connectionList.innerHTML = '';
        
        connections.forEach(([name, connection]) => {
            const connectionElement = document.createElement('div');
            connectionElement.className = 'connection-item';
            connectionElement.innerHTML = `
                <div class="connection-info">
                    <div class="connection-name">
                        <span class="status-indicator status-${connection.status}"></span>
                        ${escapeHtml(name.toUpperCase())}
                    </div>
                    <div class="connection-url">${escapeHtml(connection.url)}</div>
                </div>
                <div class="connection-actions">
                    <button class="btn-small" onclick="testConnection('${name}')">Test</button>
                </div>
            `;
            
            elements.connectionList.appendChild(connectionElement);
        });
    }
    
    /**
     * Test connection
     */
    window.testConnection = function(connectionName) {
        vscode.postMessage({
            command: 'testConnection',
            connectionName: connectionName
        });
    };
    
    /**
     * Show error message
     */
    function showError(errorMessage) {
        // For now, use console.error - could be enhanced with toast notifications
        console.error('Communication Hub Error:', errorMessage);
        
        // Could add a toast notification system here
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = errorMessage;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--vscode-errorBackground);
            color: var(--vscode-errorForeground);
            padding: 12px;
            border-radius: 4px;
            border: 1px solid var(--vscode-errorBorder);
            z-index: 1000;
            animation: fadeIn 0.3s ease-in;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
    
    /**
     * Start periodic updates
     */
    function startPeriodicUpdates() {
        // Update performance metrics every 5 seconds
        setInterval(() => {
            if (hubState.currentTab === 'performance' || hubState.currentTab === 'dashboard') {
                requestPerformanceMetrics();
            }
        }, 5000);
        
        // Update session/agent info every 30 seconds
        setInterval(() => {
            if (hubState.currentTab === 'sessions') {
                requestSessions();
            } else if (hubState.currentTab === 'agents') {
                requestAgents();
            }
        }, 30000);
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Add CSS for toast animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px 20px;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
})();
