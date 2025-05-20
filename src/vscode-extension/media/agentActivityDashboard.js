// Agent Activity Dashboard Client-side JavaScript
(function() {
  // Get message passing API
  const vscode = acquireVsCodeApi();
  
  // Elements
  const monitoringToggle = document.getElementById('monitoring-toggle');
  const refreshButton = document.getElementById('refresh-button');
  const activeAgentsCount = document.getElementById('active-agents');
  const toolUsagesCount = document.getElementById('tool-usages');
  const errorCount = document.getElementById('error-count');
  const avgResponse = document.getElementById('avg-response');
  const agentsList = document.getElementById('agents-list');
  const activeToolsList = document.getElementById('active-tools-list');
  const recentToolsList = document.getElementById('recent-tools-list');
  const toolMetricsList = document.getElementById('tool-metrics-list');
  const backendToggle = document.getElementById('backend-toggle');
  const backendUrl = document.getElementById('backend-url');
  const saveBackendSettings = document.getElementById('save-backend-settings');
  
  // State
  let lastUpdate = Date.now();
  
  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    // Request initial data
    vscode.postMessage({ command: 'refresh' });
  });
  
  // Handle refresh button click
  refreshButton.addEventListener('click', () => {
    vscode.postMessage({ command: 'refresh' });
  });
  
  // Handle monitoring toggle
  monitoringToggle.addEventListener('change', () => {
    vscode.postMessage({ 
      command: 'toggleMonitoring', 
      enabled: monitoringToggle.checked 
    });
  });
  
  // Handle backend settings
  saveBackendSettings.addEventListener('click', () => {
    vscode.postMessage({
      command: 'setBackendSettings',
      enabled: backendToggle.checked,
      url: backendUrl.value
    });
  });
  
  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
      case 'updateDashboard':
        updateDashboard(message.data);
        break;
    }
  });
  
  // Update the dashboard with new data
  function updateDashboard(data) {
    lastUpdate = Date.now();
    
    // Update toggle state
    monitoringToggle.checked = data.enabled;
    
    // Update backend settings
    backendToggle.checked = data.backendEnabled;
    backendUrl.value = data.backendUrl;
    
    // Update summary metrics
    activeAgentsCount.textContent = data.agentCount;
    toolUsagesCount.textContent = data.totalToolUsage;
    errorCount.textContent = data.errorCount;
    avgResponse.textContent = formatTime(data.avgResponseTime);
    
    // Update agents list
    if (data.agents.length > 0) {
      agentsList.innerHTML = '';
      data.agents.forEach(agent => {
        const agentItem = document.createElement('div');
        agentItem.className = 'agent-item';
        agentItem.innerHTML = `
          <div class="agent-name">
            <span class="status-indicator active"></span>
            ${sanitize(agent)}
          </div>
        `;
        agentsList.appendChild(agentItem);
      });
    } else {
      agentsList.innerHTML = '<div class="no-data">No active agents</div>';
    }
    
    // Update active tool executions
    if (data.activeToolExecutions && data.activeToolExecutions.length > 0) {
      activeToolsList.innerHTML = '';
      data.activeToolExecutions.forEach(tool => {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';
        toolItem.innerHTML = `
          <div class="tool-name">
            <span class="status-indicator active"></span>
            ${sanitize(tool.toolId)}
          </div>
          <div class="tool-elapsed">${formatTime(tool.elapsedMs)}</div>
        `;
        activeToolsList.appendChild(toolItem);
      });
    } else {
      activeToolsList.innerHTML = '<div class="no-data">No active tool executions</div>';
    }
    
    // Update recent tools
    if (data.recentTools && data.recentTools.length > 0) {
      recentToolsList.innerHTML = '';
      data.recentTools.forEach(tool => {
        const toolItem = document.createElement('div');
        toolItem.className = 'recent-tool-item';
        toolItem.innerHTML = `
          <div class="tool-info">
            <span class="status-indicator ${tool.success ? 'success' : 'error'}"></span>
            <span class="tool-id">${sanitize(tool.toolId)}</span>
            <span class="agent-id">${sanitize(tool.agentId)}</span>
          </div>
          <div class="tool-time">${formatTimeAgo(tool.timestamp)}</div>
        `;
        recentToolsList.appendChild(toolItem);
      });
    } else {
      recentToolsList.innerHTML = '<div class="no-data">No recent tool usage</div>';
    }
    
    // Update tool metrics
    if (data.tools && data.tools.length > 0) {
      toolMetricsList.innerHTML = '';
      data.tools.forEach(tool => {
        const toolMetricItem = document.createElement('div');
        toolMetricItem.className = 'tool-metric-item';
        
        // Calculate success rate percentage
        const successRatePercent = Math.round(tool.successRate * 100);
        
        toolMetricItem.innerHTML = `
          <div class="tool-metric-header">
            <div class="tool-metric-name">${sanitize(tool.toolId)}</div>
            <div class="tool-metric-count">${tool.count} uses</div>
          </div>
          <div class="tool-metric-details">
            <div class="tool-metric-success-rate">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${successRatePercent}%"></div>
              </div>
              <div class="progress-text">${successRatePercent}% success</div>
            </div>
            <div class="tool-metric-time">
              Avg: ${formatTime(tool.avgResponseTime)}
            </div>
          </div>
        `;
        toolMetricsList.appendChild(toolMetricItem);
      });
    } else {
      toolMetricsList.innerHTML = '<div class="no-data">No tool metrics available</div>';
    }
  }
  
  // Format milliseconds as human-readable time
  function formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }
  
  // Format timestamp as time ago
  function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    } else {
      return `${Math.floor(seconds / 86400)}d ago`;
    }
  }
  
  // Sanitize strings for display
  function sanitize(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
  }
})();