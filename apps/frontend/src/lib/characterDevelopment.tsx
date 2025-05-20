export {}
exports.characterManager = void 0;
class CharacterDevelopmentManager {
    constructor() {
        this.currentProfile = null;
        this.storageKey = 'current_character_profile';
        this.loadProfile();
    }
    static getInstance() {
        if (!CharacterDevelopmentManager.instance) {
            CharacterDevelopmentManager.instance = new CharacterDevelopmentManager();
        }
        return CharacterDevelopmentManager.instance;
    }
    loadProfile() {
        const savedProfile = localStorage.getItem(this.storageKey);
        this.currentProfile = savedProfile ? JSON.parse(savedProfile) : null;
    }
    async createNewProfile(name, role) {
        const newProfile = {
            id: crypto.randomUUID(),
            name,
            role,
            avatar: this.generateDefaultAvatar(),
            personality: {
                analytical_creative: 50,
                professional_casual: 50
            },
            archetype: this.getDefaultArchetype(),
            voice: {
                type: 'Natural',
                pitch: 1.0,
                speed: 1.0
            }
        };
        this.currentProfile = newProfile;
        await this.saveProfile();
        return newProfile;
    }
    generateDefaultAvatar() {
        return '/assets/default-avatar.png';
    }
    getDefaultArchetype() {
        return {
            id: 'mentor',
            name: 'The Mentor',
            description: 'Wise, guiding, supportive',
            traits: ['wisdom', 'patience', 'guidance']
        };
    }
    async updatePersonality(traits) {
        if (!this.currentProfile)
            throw new Error('No active profile');
        this.currentProfile.personality = Object.assign(Object.assign({}, this.currentProfile.personality), traits);
        await this.saveProfile();
        this.updatePreview();
    }
    async setArchetype(archetypeId) {
        if (!this.currentProfile)
            throw new Error('No active profile');
        const archetype = await this.fetchArchetype(archetypeId);
        this.currentProfile.archetype = archetype;
        await this.saveProfile();
        this.updatePreview();
    }
    async fetchArchetype(id) {
        try {
            const response = await fetch(`/api/archetypes/${id}`);
            if (!response.ok)
                throw new Error('Failed to fetch archetype');
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching archetype:', error);
            throw error;
        }
    }
    async updateVoiceSettings(settings) {
        if (!this.currentProfile)
            throw new Error('No active profile');
        this.currentProfile.voice = Object.assign(Object.assign({}, this.currentProfile.voice), settings);
        await this.saveProfile();
        await this.previewVoice();
    }
    async previewVoice() {
        if (!this.currentProfile)
            return;
        try {
            const response = await fetch('/api/voice/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.currentProfile.voice),
            });
            if (!response.ok)
                throw new Error('Failed to generate voice preview');
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        }
        catch (error) {
            console.error('Error previewing voice:', error);
            throw error;
        }
    }
    async saveProfile() {
        if (!this.currentProfile)
            return;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentProfile));
            await this.syncWithServer();
        }
        catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }
    async syncWithServer() {
        if (!this.currentProfile)
            return;
        try {
            const response = await fetch('/api/character-profiles', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.currentProfile),
            });
            if (!response.ok)
                throw new Error('Failed to sync profile with server');
        }
        catch (error) {
            console.error('Error syncing profile:', error);
            throw error;
        }
    }
    updatePreview() {
        const previewWindow = document.querySelector('.preview-window .space-y-2');
        if (!previewWindow || !this.currentProfile)
            return;
        const personality = this.currentProfile.personality;
        const archetype = this.currentProfile.archetype;
        let responseStyle = '';
        if (personality.analytical_creative < 40) {
            responseStyle = 'precise and analytical';
        }
        else if (personality.analytical_creative > 60) {
            responseStyle = 'creative and innovative';
        }
        const previewResponse = `I am ${this.currentProfile.name}, a ${responseStyle} AI assistant specializing in ${this.currentProfile.role}. How can I help you today?`;
        previewWindow.innerHTML = `
            <p class="text-green-400">User > Hello, who are you?</p>
            <p class="text-blue-400">Agent > ${previewResponse}</p>
        `;
    }
    getCurrentProfile() {
        return this.currentProfile;
    }
}
const characterManager = CharacterDevelopmentManager.getInstance();
exports.characterManager = characterManager;
export {};
//# sourceMappingURL=characterDevelopment.js.map