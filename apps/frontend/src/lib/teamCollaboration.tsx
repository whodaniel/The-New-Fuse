"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamManager = void 0;
class TeamCollaborationManager {
    constructor() {
        this.socket = null;
        this.members = new Map();
        this.projects = new Map();
        this.activities = [];
        this.chat = null;
        this.initializeWebSocket();
        this.initializeEventListeners();
    }
    static getInstance() {
        if (!TeamCollaborationManager.instance) {
            TeamCollaborationManager.instance = new TeamCollaborationManager();
        }
        return TeamCollaborationManager.instance;
    }
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/team-collaboration`;
        this.socket = new WebSocket(wsUrl);
        this.socket.addEventListener('open', () => {
            
            this.loadInitialData();
        });
        this.socket.addEventListener('message', (event) => {
            this.handleWebSocketMessage(JSON.parse(event.data));
        });
        this.socket.addEventListener('close', () => {
            
            setTimeout(() => this.initializeWebSocket(), 5000); // Reconnect after 5 seconds
        });
    }
    initializeEventListeners() {
        // Project creation
        document.querySelector('.create-project-btn')?.addEventListener('click', () => {
            this.showProjectModal();
        });
        // Member invitation
        document.querySelector('.invite-member-btn')?.addEventListener('click', () => {
            this.showInviteModal();
        });
        // Chat input
        const chatInput = document.querySelector('.chat-input');
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage(chatInput.value);
                chatInput.value = '';
            }
        });
    }
    async loadInitialData() {
        try {
            const [membersResponse, projectsResponse, activitiesResponse] = await Promise.all([
                fetch('/api/team/members'),
                fetch('/api/team/projects'),
                fetch('/api/team/activities')
            ]);
            if (!membersResponse.ok || !projectsResponse.ok || !activitiesResponse.ok) {
                throw new Error('Failed to load team data');
            }
            const members = await membersResponse.json();
            const projects = await projectsResponse.json();
            const activities = await activitiesResponse.json();
            members.forEach((member) => this.members.set(member.id, member));
            projects.forEach((project) => this.projects.set(project.id, project));
            this.activities = activities;
            this.renderTeamDashboard();
        }
        catch (error) {
            console.error('Error loading team data:', error);
            this.showError('Failed to load team data');
        }
    }
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'member_status':
                this.updateMemberStatus(message.data);
                break;
            case 'new_activity':
                this.addActivity(message.data);
                break;
            case 'project_update':
                this.updateProject(message.data);
                break;
            case 'chat_message':
                this.addChatMessage(message.data);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    renderTeamDashboard() {
        this.renderMembers();
        this.renderProjects();
        this.renderActivities();
        this.renderChat();
    }
    renderMembers() {
        const container = document.querySelector('.team-members');
        if (!container)
            return;
        const membersHtml = Array.from(this.members.values()).map(member => `
            <div class="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg">
                <div class="relative">
                    <img src="${member.avatar}" alt="${member.name}" class="w-10 h-10 rounded-full">
                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${member.status === 'online' ? 'bg-green-400' :
            member.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'} border-2 border-white"></span>
                </div>
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900">${member.name}</h3>
                    <p class="text-sm text-gray-500">${member.role}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                    </svg>
                </button>
            </div>
        `).join('');
        container.innerHTML = membersHtml;
    }
    renderProjects() {
        const container = document.querySelector('.team-projects');
        if (!container)
            return;
        const projectsHtml = Array.from(this.projects.values()).map(project => `
            <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-900">${project.name}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-800' :
            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'}">${project.status}</span>
                </div>
                <p class="text-gray-600 mb-4">${project.description}</p>
                <div class="flex items-center justify-between">
                    <div class="flex -space-x-2">
                        ${project.members.map(id => {
            const member = this.members.get(id);
            return member ? `
                                <img src="${member.avatar}" alt="${member.name}" 
                                     class="w-8 h-8 rounded-full border-2 border-white"
                                     title="${member.name}">
                            ` : '';
        }).join('')}
                    </div>
                    <button class="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
        container.innerHTML = projectsHtml;
    }
    renderActivities() {
        const container = document.querySelector('.team-activities');
        if (!container)
            return;
        const activitiesHtml = this.activities.map(activity => `
            <div class="flex items-start space-x-3 py-4">
                <div class="w-2 h-2 mt-2 rounded-full ${activity.type === 'project' ? 'bg-blue-500' :
            activity.type === 'agent' ? 'bg-green-500' :
                activity.type === 'workflow' ? 'bg-purple-500' :
                    'bg-gray-500'}"></div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">
                        <span class="font-medium">${this.members.get(activity.userId)?.name}</span>
                        ${activity.action}
                    </p>
                    <p class="text-xs text-gray-500">
                        ${new Date(activity.timestamp).toLocaleString()}
                    </p>
                </div>
            </div>
        `).join('');
        container.innerHTML = activitiesHtml;
    }
    renderChat() {
        const container = document.querySelector('.team-chat');
        if (!container || !this.chat)
            return;
        const chatHtml = this.chat.messages.map((message: any) => {
            const member = this.members.get(message.userId);
            const isCurrentUser = message.userId === this.getCurrentUserId();
            return `
                <div class="flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}">
                    <img src="${member?.avatar}" alt="${member?.name}" class="w-8 h-8 rounded-full">
                    <div class="flex-1">
                        <div class="flex items-center ${isCurrentUser ? 'justify-end' : ''}">
                            <span class="text-sm font-medium text-gray-900">${member?.name}</span>
                            <span class="text-xs text-gray-500 ml-2">
                                ${new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <div class="mt-1 inline-block rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}">
                            ${message.content}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = chatHtml;
        container.scrollTop = container.scrollHeight;
    }
    async sendChatMessage(content) {
        if (!content.trim() || !this.socket)
            return;
        const message = {
            type: 'chat_message',
            data: {
                content,
                timestamp: new Date().toISOString()
            }
        };
        this.socket.send(JSON.stringify(message));
    }
    updateMemberStatus(data) {
        const member = this.members.get(data.userId);
        if (member) {
            member.status = data.status;
            member.lastActive = new Date().toISOString();
            this.renderMembers();
        }
    }
    addActivity(activity) {
        this.activities.unshift(activity);
        this.activities = this.activities.slice(0, 50); // Keep only last 50 activities
        this.renderActivities();
    }
    updateProject(project) {
        this.projects.set(project.id, project);
        this.renderProjects();
    }
    addChatMessage(message) {
        if (!this.chat) {
            this.chat = { id: 'team-chat', messages: [] };
        }
        this.chat.messages.push(message);
        this.renderChat();
    }
    getCurrentUserId() {
        // Implementation depends on your authentication system
        return 'current-user-id';
    }
    showProjectModal() {
        // Implementation for project creation modal
    }
    showInviteModal() {
        // Implementation for member invitation modal
    }
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        errorDiv.role = 'alert';
        errorDiv.innerHTML = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
    // Public methods for external use
    inviteMember(email, role) {
        return fetch('/api/team/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role })
        }).then(respons(e: any) => {
            if (!response.ok)
                throw new Error('Failed to invite member');
        });
    }
    createProject(name, description) {
        return fetch('/api/team/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        }).then(respons(e: any) => {
            if (!response.ok)
                throw new Error('Failed to create project');
        });
    }
    getTeamMembers() {
        return Array.from(this.members.values());
    }
    getProjects() {
        return Array.from(this.projects.values());
    }
}
// Initialize team collaboration manager
const teamManager = TeamCollaborationManager.getInstance();
exports.teamManager = teamManager;

export {};
