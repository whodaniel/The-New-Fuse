    delimiters: ['[[', ']]'],
    data() {
        return {
            agents: [],
            roles: {},
            newAgent: {
                name: '',
                role: '',
                description: '',
                personality: '',
                capabilities: [],
                language_proficiency: { primary: 'English', secondary: [] }
            },
            loading: false,
            error: null,
            success: null,
            nameError: null,
            roleError: null,
            languageError: null,
            secondaryLanguagesInput: '',
            selectedAgent: null,
            searchQuery: '',
            filterRole: '',
            commandInput: '',
            commandSuggestions: [],
            availableCommands: [
                { command: 'reset', description: 'Reset agent settings' },
                { command: 'status', description: 'Get agent status' },
                { command: 'help', description: 'List available commands' }
            ],
            agentsFilter: '',
            statusFilter: '',
            filteredAgents: [],
            sortKey: 'name',
            currentPage: 1,
            pageSize: 10,
            totalPages: 1
        };
    },
    computed: {
        isFormValid() {
            return this.newAgent.name && this.newAgent.role && !this.nameError && !this.roleError;
        },
        filteredAgents() {
            return this.agents.filter(agent => {
                const nameMatch = agent.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const roleMatch = this.filterRole ? agent.role === this.filterRole : true;
                return nameMatch && roleMatch;
            });
        }
    },
    async created() {
        await this.fetchInitialData();
        await this.fetchAgents();
    },
    methods: {
        async fetchInitialData() {
            try {
                const response = await axios.get('/api/initial-data');
                const data = response.data;
                this.roles = data.roles || {};
                this.agents = data.agents || [];
            }
            catch (error) {
                console.error('Error fetching initial data:', error);
                this.error = 'Failed to load dashboard data';
            }
        },
        async fetchAgents() {
            try {
                const params = {
                    page: this.currentPage,
                    per_page: this.pageSize,
                    sort_by: this.sortKey,
                    search: this.searchQuery,
                    status: this.statusFilter,
                };
                const response = await axios.get('/api/agents', { params });
                this.agents = response.data.agents;
                this.totalPages = response.data.total_pages;
                for (const agent of this.agents) {
                    const metricsResponse = await axios.get(`/api/agents/${agent.id}/performance`);
                    agent.performanceMetrics = metricsResponse.data;
                }
                this.filterAgents();
            }
            catch (error) {
                console.error('Error fetching agents:', error);
            }
        },
        filterAgents() {
            this.filteredAgents = this.agents.filter(agent => {
                const matchesQuery = agent.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesStatus = this.statusFilter ? agent.status === this.statusFilter : true;
                return matchesQuery && matchesStatus;
            });
        },
        validateName() {
            const name = this.newAgent.name.trim();
            if (!name) {
                this.nameError = 'Agent name is required';
            }
            else if (name.length < 2) {
                this.nameError = 'Agent name must be at least 2 characters long';
            }
            else if (!name.replace(' ', '').match(/^[a-zA-Z0-9]+$/)) {
                this.nameError = 'Agent name can only contain letters and numbers';
            }
            else {
                this.nameError = null;
            }
        },
        addSecondaryLanguage() {
            const lang = this.secondaryLanguagesInput.trim();
            if (!lang)
                return;
            if (lang.toLowerCase() === this.newAgent.language_proficiency.primary.toLowerCase()) {
                this.languageError = 'Secondary language cannot be the same as primary language';
                return;
            }
            if (this.newAgent.language_proficiency.secondary.includes(lang)) {
                this.languageError = 'Language already added';
                return;
            }
            this.newAgent.language_proficiency.secondary.push(lang);
            this.secondaryLanguagesInput = '';
            this.languageError = null;
        },
        removeSecondaryLanguage(lang) {
        },
        updateCapabilities() {
        },
        async createAgent() {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await fetch('/api/agents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newAgent)
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to create agent');
                }
                this.agents.push(data.agent);
                this.success = 'Agent created successfully';
                this.newAgent = {
                    name: '',
                    role: '',
                    description: '',
                    personality: '',
                    specialization: '',
                    capabilities: [],
                    language_proficiency: { "primary": "English" }
                };
            }
            catch (err) {
                this.error = err.message;
                console.error('Error creating agent:', err);
            }
            finally {
                this.loading = false;
            }
        },
        async deleteAgent(agentId) {
            var _a, _b;
            if (!confirm('Are you sure you want to delete this agent?'))
                return;
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axios.delete(`/api/agents/${agentId}`);
                this.agents = this.agents.filter(agent => agent.id !== agentId);
                this.success = 'Agent deleted successfully';
            }
            catch (err) {
                this.error = ((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to delete agent';
            }
            finally {
                this.loading = false;
            }
        },
        viewAgentDetails(agent) {
            this.selectedAgent = agent;
        },
        handleCommandInput() {
            if (this.commandInput.startsWith('/')) {
                const inputCommand = this.commandInput.slice(1);
                this.commandSuggestions = this.availableCommands.filter(cmd => cmd.command.startsWith(inputCommand));
            }
            else {
                this.commandSuggestions = [];
            }
        },
        selectCommand(suggestion) {
            this.commandInput = '/' + suggestion.command + ' ';
            this.commandSuggestions = [];
        },
        async executeCommand() {
            var _a, _b;
            if (!this.commandInput.startsWith('/'))
                return;
            const [command, ...args] = this.commandInput.slice(1).split(' ');
            try {
                const response = await axios.post(`/api/commands/${command}`, { args });
                this.success = response.data.message || 'Command executed successfully';
            }
            catch (error) {
                this.error = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Command execution failed';
            }
            finally {
                this.commandInput = '';
                this.commandSuggestions = [];
            }
        },
        async exportChat() {
            this.loading = true;
            try {
                const response = await axios.get('/api/export_chat', {
                    params: { format: this.exportFormat },
                    responseType: this.exportFormat === 'pdf' ? 'blob' : 'json'
                });
                if (this.exportFormat === 'json') {
                    const dataStr = JSON.stringify(response.data.chat_history, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'chat_history.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                else {
                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `chat_history.${this.exportFormat}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                this.success = 'Chat exported successfully';
            }
            catch (error) {
                this.error = 'Failed to export chat';
            }
            finally {
                this.loading = false;
            }
        },
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.fetchAgents();
            }
        }
    }
}).mount('#app');
class DashboardManager {
    constructor() {
        this.apiManager = new APIManager();
        this.setupMetricsMonitoring();
    }
    setupMetricsMonitoring() {
        this.metricsSocket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/metrics`);
        this.metricsSocket.onmessage = (event) => {
            const metrics = JSON.parse(event.data);
            this.updateMetricsDisplay(metrics);
        };
    }
    updateMetricsDisplay(metrics) {
        const metricsContainer = document.getElementById('metricsContainer');
        if (!metricsContainer)
            return;
        metricsContainer.innerHTML = `
            <h3>Metrics</h3>
            <p><strong>CPU Usage:</strong> ${metrics.cpuUsage}%</p>
            <p><strong>Memory Usage:</strong> ${metrics.memoryUsage}%</p>
            <p><strong>Active Connections:</strong> ${metrics.activeConnections}</p>
            <p><strong>Requests Per Second:</strong> ${metrics.requestsPerSecond}</p>
        `;
    }
}
export {};
//# sourceMappingURL=dashboard.js.map