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
        const chatHtml = this.chat.messages.map(messag(e: any) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbUNvbGxhYm9yYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZWFtQ29sbGFib3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUEyQ0EsTUFBTSx3QkFBd0I7SUFRMUI7UUFOUSxXQUFNLEdBQXFCLElBQUksQ0FBQztRQUNoQyxZQUFPLEdBQTRCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDN0MsYUFBUSxHQUE2QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQy9DLGVBQVUsR0FBa0IsRUFBRSxDQUFDO1FBQy9CLFNBQUksR0FBb0IsSUFBSSxDQUFDO1FBR2pDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFTSxNQUFNLENBQUMsV0FBVztRQUNyQixJQUFJLENBQUMsd0JBQXdCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckMsd0JBQXdCLENBQUMsUUFBUSxHQUFHLElBQUksd0JBQXdCLEVBQUUsQ0FBQztRQUN2RSxDQUFDO1FBQ0QsT0FBTyx3QkFBd0IsQ0FBQyxRQUFRLENBQUM7SUFDN0MsQ0FBQztJQUVPLG1CQUFtQjtRQUN2QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ3hFLE1BQU0sS0FBSyxHQUFHLEdBQUcsUUFBUSxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSx5QkFBeUIsQ0FBQztRQUU1RSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRW5DLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFD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SUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7U0FDeEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0sYUFBYSxDQUFDLElBQVksRUFBRSxXQUFtQjtRQUNsRCxPQUFPLEtBQUssQ0FBQyxvQkFBb0IsRUFBRTtZQUMvQixNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRTtZQUMvQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQztTQUM5QyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTSxjQUFjO1FBQ2pCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVNLFdBQVc7UUFDZCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDSjtBQUVELHdDQUF3QztBQUN4QyxNQUFNLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUdsRCxrQ0FBVyIsInNvdXJjZXNDb250ZW50IjpbImludGVyZmFjZSBUZWFtTWVtYmVyIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBlbWFpbDogc3RyaW5nO1xuICAgIHJvbGU6ICdvd25lcicgfCAnYWRtaW4nIHwgJ21lbWJlcic7XG4gICAgYXZhdGFyOiBzdHJpbmc7XG4gICAgc3RhdHVzOiAnb25saW5lJyB8ICdhd2F5JyB8ICdvZmZsaW5lJztcbiAgICBsYXN0QWN0aXZlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUZWFtUHJvamVjdCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBzdGF0dXM6ICdhY3RpdmUnIHwgJ2FyY2hpdmVkJyB8ICdjb21wbGV0ZWQnO1xuICAgIG1lbWJlcnM6IHN0cmluZ1tdOyAvLyBtZW1iZXIgSURzXG4gICAgY3JlYXRlZDogc3RyaW5nO1xuICAgIG1vZGlmaWVkOiBzdHJpbmc7XG4gICAgYWdlbnRzOiBzdHJpbmdbXTsgLy8gYWdlbnQgSURzXG59XG5cbmludGVyZmFjZSBBY3Rpdml0eUxvZyB7XG4gICAgaWQ6IHN0cmluZztcbiAgICB0eXBlOiAncHJvamVjdCcgfCAnYWdlbnQnIHwgJ3dvcmtmbG93JyB8ICdzeXN0ZW0nO1xuICAgIGFjdGlvbjogc3RyaW5nO1xuICAgIHVzZXJJZDogc3RyaW5nO1xuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xuICAgIGRldGFpbHM6IHtcbiAgICAgICAgW2tleTogc3RyaW5nXTogYW55O1xuICAgIH07XG59XG5cbmludGVyZmFjZSBUZWFtQ2hhdCB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBtZXNzYWdlczoge1xuICAgICAgICBpZDogc3RyaW5nO1xuICAgICAgICB1c2VySWQ6IHN0cmluZztcbiAgICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgICB0aW1lc3RhbXA6IHN0cmluZztcbiAgICAgICAgYXR0YWNobWVudHM/OiBzdHJpbmdbXTtcbiAgICB9W107XG59XG5cbmNsYXNzIFRlYW1Db2xsYWJvcmF0aW9uTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IFRlYW1Db2xsYWJvcmF0aW9uTWFuYWdlcjtcbiAgICBwcml2YXRlIHNvY2tldDogV2ViU29ja2V0IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBtZW1iZXJzOiBNYXA8c3RyaW5nLCBUZWFtTWVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIHByb2plY3RzOiBNYXA8c3RyaW5nLCBUZWFtUHJvamVjdD4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSBhY3Rpdml0aWVzOiBBY3Rpdml0eUxvZ1tdID0gW107XG4gICAgcHJpdmF0ZSBjaGF0OiBUZWFtQ2hhdCB8IG51bGwgPSBudWxsO1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplV2ViU29ja2V0KCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBUZWFtQ29sbGFib3JhdGlvbk1hbmFnZXIge1xuICAgICAgICBpZiAoIVRlYW1Db2xsYWJvcmF0aW9uTWFuYWdlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgVGVhbUNvbGxhYm9yYXRpb25NYW5hZ2VyLmluc3RhbmNlID0gbmV3IFRlYW1Db2xsYWJvcmF0aW9uTWFuYWdlcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBUZWFtQ29sbGFib3JhdGlvbk1hbmFnZXIuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplV2ViU29ja2V0KCk6IHZvaWQge1xuICAgICAgICBjb25zdCBwcm90b2NvbCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyAnd3NzOicgOiAnd3M6JztcbiAgICAgICAgY29uc3Qgd3NVcmwgPSBgJHtwcm90b2NvbH0vLyR7d2luZG93LmxvY2F0aW9uLmhvc3R9L2FwaS90ZWFtLWNvbGxhYm9yYXRpb25gO1xuXG4gICAgICAgIHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldCh3c1VybCk7XG5cbiAgICAgICAgdGhpcy5zb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdUZWFtIGNvbGxhYm9yYXRpb24gV2ViU29ja2V0IGNvbm5lY3RlZCcpO1xuICAgICAgICAgICAgdGhpcy5sb2FkSW5pdGlhbERhdGEoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5zb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVXZWJTb2NrZXRNZXNzYWdlKEpTT04ucGFyc2UoZXZlbnQuZGF0YSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNvY2tldC5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdUZWFtIGNvbGxhYm9yYXRpb24gV2ViU29ja2V0IGRpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmluaXRpYWxpemVXZWJTb2NrZXQoKSwgNTAwMCk7IC8vIFJlY29ubmVjdCBhZnRlciA1IHNlY29uZHNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplRXZlbnRMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgICAgIC8vIFByb2plY3QgY3JlYXRpb25cbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNyZWF0ZS1wcm9qZWN0LWJ0bicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1Byb2plY3RNb2RhbCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBNZW1iZXIgaW52aXRhdGlvblxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaW52aXRlLW1lbWJlci1idG4nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3dJbnZpdGVNb2RhbCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaGF0IGlucHV0XG4gICAgICAgIGNvbnN0IGNoYXRJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jaGF0LWlucHV0JykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgY2hhdElucHV0Py5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2hhdE1lc3NhZ2UoY2hhdElucHV0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICBjaGF0SW5wdXQudmFsdWUgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBsb2FkSW5pdGlhbERhdGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBbbWVtYmVyc1Jlc3BvbnNlLCBwcm9qZWN0c1Jlc3BvbnNlLCBhY3Rpdml0aWVzUmVzcG9uc2VdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIGZldGNoKCcvYXBpL3RlYW0vbWVtYmVycycpLFxuICAgICAgICAgICAgICAgIGZldGNoKCcvYXBpL3RlYW0vcHJvamVjdHMnKSxcbiAgICAgICAgICAgICAgICBmZXRjaCgnL2FwaS90ZWFtL2FjdGl2aXRpZXMnKVxuICAgICAgICAgICAgXSk7XG5cbiAgICAgICAgICAgIGlmICghbWVtYmVyc1Jlc3BvbnNlLm9rIHx8ICFwcm9qZWN0c1Jlc3BvbnNlLm9rIHx8ICFhY3Rpdml0aWVzUmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHRlYW0gZGF0YScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtZW1iZXJzID0gYXdhaXQgbWVtYmVyc1Jlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gYXdhaXQgcHJvamVjdHNSZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpdml0aWVzID0gYXdhaXQgYWN0aXZpdGllc1Jlc3BvbnNlLmpzb24oKTtcblxuICAgICAgICAgICAgbWVtYmVycy5mb3JFYWNoKChtZW1iZXI6IFRlYW1NZW1iZXIpID0+IHRoaXMubWVtYmVycy5zZXQobWVtYmVyLmlkLCBtZW1iZXIpKTtcbiAgICAgICAgICAgIHByb2plY3RzLmZvckVhY2goKHByb2plY3Q6IFRlYW1Qcm9qZWN0KSA9PiB0aGlzLnByb2plY3RzLnNldChwcm9qZWN0LmlkLCBwcm9qZWN0KSk7XG4gICAgICAgICAgICB0aGlzLmFjdGl2aXRpZXMgPSBhY3Rpdml0aWVzO1xuXG4gICAgICAgICAgICB0aGlzLnJlbmRlclRlYW1EYXNoYm9hcmQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgdGVhbSBkYXRhOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCdGYWlsZWQgdG8gbG9hZCB0ZWFtIGRhdGEnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlV2ViU29ja2V0TWVzc2FnZShtZXNzYWdlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ21lbWJlcl9zdGF0dXMnOlxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyU3RhdHVzKG1lc3NhZ2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICduZXdfYWN0aXZpdHknOlxuICAgICAgICAgICAgICAgIHRoaXMuYWRkQWN0aXZpdHkobWVzc2FnZS5kYXRhKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Byb2plY3RfdXBkYXRlJzpcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVByb2plY3QobWVzc2FnZS5kYXRhKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NoYXRfbWVzc2FnZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDaGF0TWVzc2FnZShtZXNzYWdlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1Vua25vd24gbWVzc2FnZSB0eXBlOicsIG1lc3NhZ2UudHlwZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlclRlYW1EYXNoYm9hcmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMucmVuZGVyTWVtYmVycygpO1xuICAgICAgICB0aGlzLnJlbmRlclByb2plY3RzKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQWN0aXZpdGllcygpO1xuICAgICAgICB0aGlzLnJlbmRlckNoYXQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlck1lbWJlcnMoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50ZWFtLW1lbWJlcnMnKTtcbiAgICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjtcblxuICAgICAgICBjb25zdCBtZW1iZXJzSHRtbCA9IEFycmF5LmZyb20odGhpcy5tZW1iZXJzLnZhbHVlcygpKS5tYXAobWVtYmVyID0+IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTQgcC00IGhvdmVyOmJnLWdyYXktNTAgcm91bmRlZC1sZ1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyZWxhdGl2ZVwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7bWVtYmVyLmF2YXRhcn1cIiBhbHQ9XCIke21lbWJlci5uYW1lfVwiIGNsYXNzPVwidy0xMCBoLTEwIHJvdW5kZWQtZnVsbFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImFic29sdXRlIGJvdHRvbS0wIHJpZ2h0LTAgdy0zIGgtMyByb3VuZGVkLWZ1bGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbWJlci5zdGF0dXMgPT09ICdvbmxpbmUnID8gJ2JnLWdyZWVuLTQwMCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgbWVtYmVyLnN0YXR1cyA9PT0gJ2F3YXknID8gJ2JnLXllbGxvdy00MDAnIDogJ2JnLWdyYXktNDAwJ1xuICAgICAgICAgICAgICAgICAgICB9IGJvcmRlci0yIGJvcmRlci13aGl0ZVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzcz1cImZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj4ke21lbWJlci5uYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC1zbSB0ZXh0LWdyYXktNTAwXCI+JHttZW1iZXIucm9sZX08L3A+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInRleHQtZ3JheS00MDAgaG92ZXI6dGV4dC1ncmF5LTYwMFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3ZnIGNsYXNzPVwidy01IGgtNVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIGQ9XCJNMTIgNXYuMDFNMTIgMTJ2LjAxTTEyIDE5di4wMU0xMiA2YTEgMSAwIDExMC0yIDEgMSAwIDAxMCAyem0wIDdhMSAxIDAgMTEwLTIgMSAxIDAgMDEwIDJ6bTAgN2ExIDEgMCAxMTAtMiAxIDEgMCAwMTAgMnpcIi8+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApLmpvaW4oJycpO1xuXG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBtZW1iZXJzSHRtbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlclByb2plY3RzKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudGVhbS1wcm9qZWN0cycpO1xuICAgICAgICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHByb2plY3RzSHRtbCA9IEFycmF5LmZyb20odGhpcy5wcm9qZWN0cy52YWx1ZXMoKSkubWFwKHByb2plY3QgPT4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJnLXdoaXRlIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ncmF5LTIwMCBwLTYgaG92ZXI6c2hhZG93LWxnIHRyYW5zaXRpb24tc2hhZG93IGR1cmF0aW9uLTIwMFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItNFwiPlxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3M9XCJ0ZXh0LWxnIGZvbnQtYm9sZCB0ZXh0LWdyYXktOTAwXCI+JHtwcm9qZWN0Lm5hbWV9PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJweC0yLjUgcHktMC41IHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtbWVkaXVtICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0LnN0YXR1cyA9PT0gJ2FjdGl2ZScgPyAnYmctZ3JlZW4tMTAwIHRleHQtZ3JlZW4tODAwJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0LnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgPyAnYmctYmx1ZS0xMDAgdGV4dC1ibHVlLTgwMCcgOlxuICAgICAgICAgICAgICAgICAgICAgICAgJ2JnLWdyYXktMTAwIHRleHQtZ3JheS04MDAnXG4gICAgICAgICAgICAgICAgICAgIH1cIj4ke3Byb2plY3Quc3RhdHVzfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtZ3JheS02MDAgbWItNFwiPiR7cHJvamVjdC5kZXNjcmlwdGlvbn08L3A+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCAtc3BhY2UteC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAke3Byb2plY3QubWVtYmVycy5tYXAoaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IHRoaXMubWVtYmVycy5nZXQoaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZW1iZXIgPyBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHttZW1iZXIuYXZhdGFyfVwiIGFsdD1cIiR7bWVtYmVyLm5hbWV9XCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ3LTggaC04IHJvdW5kZWQtZnVsbCBib3JkZXItMiBib3JkZXItd2hpdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwiJHttZW1iZXIubmFtZX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgIDogJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5qb2luKCcnKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ0ZXh0LWJsdWUtNjAwIGhvdmVyOnRleHQtYmx1ZS03MDAgZm9udC1tZWRpdW0gdGV4dC1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgVmlldyBEZXRhaWxzXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApLmpvaW4oJycpO1xuXG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBwcm9qZWN0c0h0bWw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJBY3Rpdml0aWVzKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudGVhbS1hY3Rpdml0aWVzJyk7XG4gICAgICAgIGlmICghY29udGFpbmVyKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgYWN0aXZpdGllc0h0bWwgPSB0aGlzLmFjdGl2aXRpZXMubWFwKGFjdGl2aXR5ID0+IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4IGl0ZW1zLXN0YXJ0IHNwYWNlLXgtMyBweS00XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInctMiBoLTIgbXQtMiByb3VuZGVkLWZ1bGwgJHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHkudHlwZSA9PT0gJ3Byb2plY3QnID8gJ2JnLWJsdWUtNTAwJyA6XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5LnR5cGUgPT09ICdhZ2VudCcgPyAnYmctZ3JlZW4tNTAwJyA6XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5LnR5cGUgPT09ICd3b3JrZmxvdycgPyAnYmctcHVycGxlLTUwMCcgOlxuICAgICAgICAgICAgICAgICAgICAnYmctZ3JheS01MDAnXG4gICAgICAgICAgICAgICAgfVwiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LTEgbWluLXctMFwiPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRleHQtc20gdGV4dC1ncmF5LTkwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJmb250LW1lZGl1bVwiPiR7dGhpcy5tZW1iZXJzLmdldChhY3Rpdml0eS51c2VySWQpPy5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7YWN0aXZpdHkuYWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwidGV4dC14cyB0ZXh0LWdyYXktNTAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAke25ldyBEYXRlKGFjdGl2aXR5LnRpbWVzdGFtcCkudG9Mb2NhbGVTdHJpbmcoKX1cbiAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApLmpvaW4oJycpO1xuXG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBhY3Rpdml0aWVzSHRtbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlckNoYXQoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50ZWFtLWNoYXQnKTtcbiAgICAgICAgaWYgKCFjb250YWluZXIgfHwgIXRoaXMuY2hhdCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGNoYXRIdG1sID0gdGhpcy5jaGF0Lm1lc3NhZ2VzLm1hcChtZXNzYWdlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lbWJlciA9IHRoaXMubWVtYmVycy5nZXQobWVzc2FnZS51c2VySWQpO1xuICAgICAgICAgICAgY29uc3QgaXNDdXJyZW50VXNlciA9IG1lc3NhZ2UudXNlcklkID09PSB0aGlzLmdldEN1cnJlbnRVc2VySWQoKTtcblxuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCBpdGVtcy1zdGFydCBzcGFjZS14LTMgJHtpc0N1cnJlbnRVc2VyID8gJ2ZsZXgtcm93LXJldmVyc2Ugc3BhY2UteC1yZXZlcnNlJyA6ICcnfVwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7bWVtYmVyPy5hdmF0YXJ9XCIgYWx0PVwiJHttZW1iZXI/Lm5hbWV9XCIgY2xhc3M9XCJ3LTggaC04IHJvdW5kZWQtZnVsbFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleCBpdGVtcy1jZW50ZXIgJHtpc0N1cnJlbnRVc2VyID8gJ2p1c3RpZnktZW5kJyA6ICcnfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+JHttZW1iZXI/Lm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC14cyB0ZXh0LWdyYXktNTAwIG1sLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtuZXcgRGF0ZShtZXNzYWdlLnRpbWVzdGFtcCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibXQtMSBpbmxpbmUtYmxvY2sgcm91bmRlZC1sZyBweC00IHB5LTIgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0N1cnJlbnRVc2VyID8gJ2JnLWJsdWUtNTAwIHRleHQtd2hpdGUnIDogJ2JnLWdyYXktMTAwIHRleHQtZ3JheS05MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHttZXNzYWdlLmNvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBgO1xuICAgICAgICB9KS5qb2luKCcnKTtcblxuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gY2hhdEh0bWw7XG4gICAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AgPSBjb250YWluZXIuc2Nyb2xsSGVpZ2h0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2VuZENoYXRNZXNzYWdlKGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIWNvbnRlbnQudHJpbSgpIHx8ICF0aGlzLnNvY2tldCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICB0eXBlOiAnY2hhdF9tZXNzYWdlJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVNZW1iZXJTdGF0dXMoZGF0YTogeyB1c2VySWQ6IHN0cmluZzsgc3RhdHVzOiBUZWFtTWVtYmVyWydzdGF0dXMnXSB9KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG1lbWJlciA9IHRoaXMubWVtYmVycy5nZXQoZGF0YS51c2VySWQpO1xuICAgICAgICBpZiAobWVtYmVyKSB7XG4gICAgICAgICAgICBtZW1iZXIuc3RhdHVzID0gZGF0YS5zdGF0dXM7XG4gICAgICAgICAgICBtZW1iZXIubGFzdEFjdGl2ZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTWVtYmVycygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRBY3Rpdml0eShhY3Rpdml0eTogQWN0aXZpdHlMb2cpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hY3Rpdml0aWVzLnVuc2hpZnQoYWN0aXZpdHkpO1xuICAgICAgICB0aGlzLmFjdGl2aXRpZXMgPSB0aGlzLmFjdGl2aXRpZXMuc2xpY2UoMCwgNTApOyAvLyBLZWVwIG9ubHkgbGFzdCA1MCBhY3Rpdml0aWVzXG4gICAgICAgIHRoaXMucmVuZGVyQWN0aXZpdGllcygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlUHJvamVjdChwcm9qZWN0OiBUZWFtUHJvamVjdCk6IHZvaWQge1xuICAgICAgICB0aGlzLnByb2plY3RzLnNldChwcm9qZWN0LmlkLCBwcm9qZWN0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJQcm9qZWN0cygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkQ2hhdE1lc3NhZ2UobWVzc2FnZTogVGVhbUNoYXRbJ21lc3NhZ2VzJ11bMF0pOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLmNoYXQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhdCA9IHsgaWQ6ICd0ZWFtLWNoYXQnLCBtZXNzYWdlczogW10gfTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoYXQubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJDaGF0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDdXJyZW50VXNlcklkKCk6IHN0cmluZyB7XG4gICAgICAgIC8vIEltcGxlbWVudGF0aW9uIGRlcGVuZHMgb24geW91ciBhdXRoZW50aWNhdGlvbiBzeXN0ZW1cbiAgICAgICAgcmV0dXJuICdjdXJyZW50LXVzZXItaWQnO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd1Byb2plY3RNb2RhbCgpOiB2b2lkIHtcbiAgICAgICAgLy8gSW1wbGVtZW50YXRpb24gZm9yIHByb2plY3QgY3JlYXRpb24gbW9kYWxcbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3dJbnZpdGVNb2RhbCgpOiB2b2lkIHtcbiAgICAgICAgLy8gSW1wbGVtZW50YXRpb24gZm9yIG1lbWJlciBpbnZpdGF0aW9uIG1vZGFsXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93RXJyb3IobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGVycm9yRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVycm9yRGl2LmNsYXNzTmFtZSA9ICdmaXhlZCB0b3AtNCByaWdodC00IGJnLXJlZC0xMDAgYm9yZGVyIGJvcmRlci1yZWQtNDAwIHRleHQtcmVkLTcwMCBweC00IHB5LTMgcm91bmRlZCc7XG4gICAgICAgIGVycm9yRGl2LnJvbGUgPSAnYWxlcnQnO1xuICAgICAgICBlcnJvckRpdi5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZXJyb3JEaXYpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGVycm9yRGl2LnJlbW92ZSgpLCA1MDAwKTtcbiAgICB9XG5cbiAgICAvLyBQdWJsaWMgbWV0aG9kcyBmb3IgZXh0ZXJuYWwgdXNlXG4gICAgcHVibGljIGludml0ZU1lbWJlcihlbWFpbDogc3RyaW5nLCByb2xlOiBUZWFtTWVtYmVyWydyb2xlJ10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIGZldGNoKCcvYXBpL3RlYW0vaW52aXRlJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWwsIHJvbGUgfSlcbiAgICAgICAgfSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBpbnZpdGUgbWVtYmVyJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVQcm9qZWN0KG5hbWU6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gZmV0Y2goJy9hcGkvdGVhbS9wcm9qZWN0cycsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG5hbWUsIGRlc2NyaXB0aW9uIH0pXG4gICAgICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHByb2plY3QnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFRlYW1NZW1iZXJzKCk6IFRlYW1NZW1iZXJbXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMubWVtYmVycy52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb2plY3RzKCk6IFRlYW1Qcm9qZWN0W10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnByb2plY3RzLnZhbHVlcygpKTtcbiAgICB9XG59XG5cbi8vIEluaXRpYWxpemUgdGVhbSBjb2xsYWJvcmF0aW9uIG1hbmFnZXJcbmNvbnN0IHRlYW1NYW5hZ2VyID0gVGVhbUNvbGxhYm9yYXRpb25NYW5hZ2VyLmdldEluc3RhbmNlKCk7XG5cbi8vIEV4cG9ydCBmb3IgdXNlIGluIG90aGVyIGZpbGVzXG5leHBvcnQgeyB0ZWFtTWFuYWdlciwgVGVhbU1lbWJlciwgVGVhbVByb2plY3QsIEFjdGl2aXR5TG9nLCBUZWFtQ2hhdCB9O1xuIl19
export {};
