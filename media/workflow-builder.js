// VS Code webview messaging
const vscode = acquireVsCodeApi();

// State management
let state = {
    workflows: [],
    currentWorkflow: null,
    agents: [],
    stepTypes: [],
    selectedStep: null,
    selectedConnection: null,
    isDragging: false,
    dragStartPos: null,
    agentStatus: new Map(), // Track agent online/offline status
    agentDiscoveryInProgress: false
};

// Initialize workflow builder
function init() {
    // Load initial data
    vscode.postMessage({ command: 'loadWorkflows' });
    vscode.postMessage({ command: 'getAgents' });
    vscode.postMessage({ command: 'getStepTypes' });

    // Setup event listeners
    setupEventListeners();

    // Add periodic agent availability check
    setInterval(checkAgentAvailability, 30000); // Check every 30 seconds

    // Add refresh button handler
    document.getElementById('refresh-agents').addEventListener('click', refreshAgentDiscovery);
}

// Setup event listeners
function setupEventListeners() {
    // VS Code message handler
    window.addEventListener('message', handleMessage);

    // Button handlers
    document.getElementById('newWorkflow').addEventListener('click', () => {
        vscode.postMessage({ command: 'createWorkflow' });
    });

    document.getElementById('saveWorkflow').addEventListener('click', saveWorkflow);
    document.getElementById('executeWorkflow').addEventListener('click', executeWorkflow);
    document.getElementById('createWorkflow').addEventListener('click', () => {
        vscode.postMessage({ command: 'createWorkflow' });
    });
    document.getElementById('deleteWorkflow').addEventListener('click', deleteWorkflow);

    // Canvas event handlers for drag and drop
    const canvas = document.getElementById('canvas');
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);

    // Property change handlers
    setupPropertyChangeHandlers();
}

// Handle messages from VS Code
function handleMessage(event) {
    const message = event.data;
    switch (message.command) {
        case 'setWorkflows':
            state.workflows = message.workflows;
            renderWorkflowList();
            break;
        case 'setWorkflow':
            state.currentWorkflow = message.workflow;
            renderWorkflow();
            break;
        case 'setAgents':
            state.agents = message.agents;
            renderAgentDropdown();
            updateAgentStatusIndicator();
            break;
        case 'setStepTypes':
            state.stepTypes = message.stepTypes;
            renderStepTypes();
            break;
        case 'agentStatusUpdate':
            message.updates.forEach(update => {
                state.agentStatus.set(update.agentId, update.status);
            });
            updateAgentStatusIndicator();
            break;
        case 'agentDiscoveryStarted':
            state.agentDiscoveryInProgress = true;
            updateDiscoveryStatus();
            break;
        case 'agentDiscoveryComplete':
            state.agentDiscoveryInProgress = false;
            updateDiscoveryStatus();
            break;
    }
}

// Render workflow list
function renderWorkflowList() {
    const list = document.getElementById('workflow-list');
    list.innerHTML = '';

    state.workflows.forEach(workflow => {
        const item = document.createElement('div');
        item.className = 'workflow-item';
        if (state.currentWorkflow && workflow.id === state.currentWorkflow.id) {
            item.classList.add('active');
        }
        item.textContent = workflow.name;
        item.addEventListener('click', () => {
            vscode.postMessage({ command: 'loadWorkflow', workflowId: workflow.id });
        });
        list.appendChild(item);
    });
}

// Render current workflow
function renderWorkflow() {
    const noWorkflow = document.getElementById('no-workflow');
    const workflowEditor = document.getElementById('workflow-editor');

    if (!state.currentWorkflow) {
        noWorkflow.classList.remove('hidden');
        workflowEditor.classList.add('hidden');
        return;
    }

    noWorkflow.classList.add('hidden');
    workflowEditor.classList.remove('hidden');

    // Update workflow info
    document.getElementById('workflow-name').textContent = state.currentWorkflow.name;
    document.getElementById('workflow-description').textContent = state.currentWorkflow.description;

    // Enable buttons
    document.getElementById('saveWorkflow').disabled = false;
    document.getElementById('executeWorkflow').disabled = false;

    // Render steps and connections
    renderSteps();
    renderConnections();
}

// Render step types
function renderStepTypes() {
    const container = document.getElementById('step-types');
    container.innerHTML = '';

    state.stepTypes.forEach(type => {
        const item = document.createElement('div');
        item.className = 'step-type';
        item.textContent = type.name;
        item.draggable = true;
        item.addEventListener('dragstart', (e) => handleStepDragStart(e, type));
        container.appendChild(item);
    });
}

// Save current workflow
function saveWorkflow() {
    if (!state.currentWorkflow) return;
    vscode.postMessage({
        command: 'saveWorkflow',
        workflow: state.currentWorkflow
    });
}

// Execute current workflow
function executeWorkflow() {
    if (!state.currentWorkflow) return;
    vscode.postMessage({
        command: 'executeWorkflow',
        workflowId: state.currentWorkflow.id
    });
}

// Delete current workflow
function deleteWorkflow() {
    if (!state.currentWorkflow) return;
    vscode.postMessage({
        command: 'deleteWorkflow',
        workflowId: state.currentWorkflow.id
    });
}

// Canvas drag and drop handlers
function handleCanvasMouseDown(e) {
    const target = e.target.closest('.step');
    if (!target) return;

    state.isDragging = true;
    state.selectedStep = target.dataset.stepId;
    state.dragStartPos = {
        x: e.clientX - target.offsetLeft,
        y: e.clientY - target.offsetTop
    };
}

function handleCanvasMouseMove(e) {
    if (!state.isDragging || !state.selectedStep) return;

    const step = document.querySelector(`[data-step-id="${state.selectedStep}"]`);
    if (!step) return;

    const x = e.clientX - state.dragStartPos.x;
    const y = e.clientY - state.dragStartPos.y;

    step.style.left = `${x}px`;
    step.style.top = `${y}px`;

    updateConnections();
}

function handleCanvasMouseUp() {
    if (!state.isDragging || !state.selectedStep) return;

    const step = document.querySelector(`[data-step-id="${state.selectedStep}"]`);
    if (step) {
        const stepId = state.selectedStep;
        const stepIndex = state.currentWorkflow.steps.findIndex(s => s.id === stepId);
        if (stepIndex >= 0) {
            state.currentWorkflow.steps[stepIndex].position = {
                x: parseInt(step.style.left),
                y: parseInt(step.style.top)
            };
        }
    }

    state.isDragging = false;
    state.selectedStep = null;
    state.dragStartPos = null;
}

function handleStepDragStart(e, stepType) {
    const pos = {
        x: e.clientX - canvas.getBoundingClientRect().left,
        y: e.clientY - canvas.getBoundingClientRect().top
    };

    const newStep = {
        id: `step-${Date.now()}`,
        name: `New ${stepType.name}`,
        type: stepType.type,
        action: '',
        inputs: {},
        outputs: {},
        position: pos
    };

    state.currentWorkflow.steps.push(newStep);
    renderSteps();
    selectStep(newStep.id);
}

function renderSteps() {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = '';

    state.currentWorkflow.steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'step';
        stepEl.dataset.stepId = step.id;
        stepEl.style.left = `${step.position?.x || 0}px`;
        stepEl.style.top = `${step.position?.y || 0}px`;

        stepEl.innerHTML = `
            <div class="step-header">
                <div class="step-title">${step.name}</div>
                <div class="step-type-badge">${step.type}</div>
            </div>
            <div class="step-body">
                ${step.agentId ? `<div class="step-agent">Agent: ${step.agentId}</div>` : ''}
            </div>
        `;

        stepEl.addEventListener('click', () => selectStep(step.id));
        canvas.appendChild(stepEl);
    });
}

function renderConnections() {
    if (!state.currentWorkflow?.connections) return;

    const canvas = document.getElementById('canvas');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('connections');

    state.currentWorkflow.connections.forEach(conn => {
        const sourceStep = document.querySelector(`[data-step-id="${conn.sourceStepId}"]`);
        const targetStep = document.querySelector(`[data-step-id="${conn.targetStepId}"]`);
        if (!sourceStep || !targetStep) return;

        const path = createConnectionPath(sourceStep, targetStep);
        svg.appendChild(path);
    });

    canvas.appendChild(svg);
}

function setupPropertyChangeHandlers() {
    // Workflow properties
    document.getElementById('workflow-name-input').addEventListener('change', (e) => {
        if (!state.currentWorkflow) return;
        state.currentWorkflow.name = e.target.value;
        document.getElementById('workflow-name').textContent = e.target.value;
    });

    document.getElementById('workflow-description-input').addEventListener('change', (e) => {
        if (!state.currentWorkflow) return;
        state.currentWorkflow.description = e.target.value;
        document.getElementById('workflow-description').textContent = e.target.value;
    });

    // Step properties
    document.getElementById('step-name-input').addEventListener('change', (e) => {
        if (!state.selectedStep) return;
        updateSelectedStep({ name: e.target.value });
        renderSteps();
    });
}

function renderAgentDropdown() {
    const select = document.getElementById('step-agent-input');
    select.innerHTML = '<option value="">Select Agent</option>';

    // Add special handling for Copilot agent
    const copilotAgent = {
        id: 'github.copilot',
        name: 'GitHub Copilot',
        type: 'code-assistant'
    };

    // Add Copilot as first option
    const copilotOption = document.createElement('option');
    copilotOption.value = copilotAgent.id;
    copilotOption.textContent = copilotAgent.name;
    const copilotStatus = state.agentStatus.get(copilotAgent.id);
    if (copilotStatus !== 'online') {
        copilotOption.classList.add('agent-offline');
        copilotOption.textContent += ' (offline)';
    }
    select.appendChild(copilotOption);

    // Add other discovered agents
    state.agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.name;
        const status = state.agentStatus.get(agent.id);
        if (status !== 'online') {
            option.classList.add('agent-offline');
            option.textContent += ' (offline)';
        }
        select.appendChild(option);
    });
}

function selectStep(stepId) {
    state.selectedStep = stepId;
    const step = state.currentWorkflow.steps.find(s => s.id === stepId);
    if (!step) return;

    document.getElementById('step-properties').classList.remove('hidden');
    document.getElementById('step-name-input').value = step.name;
    document.getElementById('step-type-input').value = step.type;
    document.getElementById('step-agent-input').value = step.agentId || '';
    document.getElementById('step-action-input').value = step.action || '';
}

function updateConnections() {
    if (!state.currentWorkflow?.connections) return;
    renderConnections();
}

function createConnectionPath(sourceEl, targetEl) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('connection-line');

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const start = {
        x: sourceRect.right,
        y: sourceRect.top + sourceRect.height / 2
    };

    const end = {
        x: targetRect.left,
        y: targetRect.top + targetRect.height / 2
    };

    const control1 = {
        x: start.x + Math.min(100, (end.x - start.x) / 2),
        y: start.y
    };

    const control2 = {
        x: end.x - Math.min(100, (end.x - start.x) / 2),
        y: end.y
    };

    path.setAttribute('d', `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`);

    return path;
}

// Add function to check agent availability
function checkAgentAvailability() {
    vscode.postMessage({
        command: 'checkAgentStatus',
        agents: ['github.copilot', ...state.agents.map(a => a.id)]
    });
}

// Add agent discovery refresh handler
function refreshAgentDiscovery() {
    vscode.postMessage({ command: 'refreshAgents' });
}

// Add new helper functions for status updates
function updateAgentStatusIndicator() {
    const statusElement = document.getElementById('agent-status');
    if (!statusElement) return; // Element might not exist yet

    const activeAgents = Array.from(state.agentStatus.entries())
        .filter(([_, status]) => status === 'online').length;

    statusElement.innerHTML = `
        <span class="agent-count">${activeAgents}</span>
        Agents Connected (${state.agents.length} total)
    `;

    // Update agent dropdown to show status
    const select = document.getElementById('step-agent-input');
    if (select) {
        Array.from(select.options).forEach(option => {
            if (option.value) {
                const status = state.agentStatus.get(option.value);
                option.classList.toggle('agent-offline', status !== 'online');
            }
        });
    }
}

function updateDiscoveryStatus() {
    const refreshButton = document.getElementById('refresh-agents');
    if (!refreshButton) return; // Element might not exist yet

    refreshButton.disabled = state.agentDiscoveryInProgress;
    refreshButton.innerHTML = state.agentDiscoveryInProgress ?
        '<span class="spinner"></span> Discovering...' :
        'Refresh Agents';
}

// Add CSS for status indicators
const style = document.createElement('style');
style.textContent = `
    .agent-offline {
        color: var(--vscode-disabledForeground);
        font-style: italic;
    }

    .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid var(--vscode-foreground);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {transform: rotate(360deg);}
    }

    .status-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 22px;
        background: var(--vscode-statusBar-background);
        color: var(--vscode-statusBar-foreground);
        display: flex;
        align-items: center;
        padding: 0 10px;
        font-size: 12px;
    }

    .status-indicator {
        display: flex;
        align-items: center;
        margin-right: 10px;
    }

    .agent-count {
        font-weight: bold;
        margin-right: 5px;
    }

    .refresh-button {
        background: none;
        border: none;
        color: var(--vscode-statusBar-foreground);
        cursor: pointer;
        padding: 0 5px;
    }

    .refresh-button:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Initialize on load
init();
