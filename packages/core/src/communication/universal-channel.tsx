import * as vscode from 'vscode';

interface Participant {
    id: string;
    type: 'user' | 'ai_agent';
    capabilities: string[];
}

export class UniversalChannel {
    private static instance: UniversalChannel;
    private participants: Map<string, Participant> = new Map();
    // Define a more specific type for the event emitter if possible, e.g., for message structure
    private eventEmitter = new vscode.EventEmitter<unknown>(); // Using unknown for now

    private constructor() {
        this.initialize();
    }

    public static getInstance(): UniversalChannel {
        if (!UniversalChannel.instance) {
            UniversalChannel.instance = new UniversalChannel();
        }
        return UniversalChannel.instance;
    }

    private initialize() {
        // Register self as participant
        this.registerParticipant({
            id: 'augment',
            type: 'ai_agent',
            capabilities: ['code_analysis', 'communication', 'workspace_monitoring']
        });

        // Listen for new participants
        vscode.extensions.onDidChange(() => {
            this.discoverParticipants();
        });
    }

    // Placeholder for discoverParticipants - implementation needed
    private discoverParticipants() {
        // This method should scan for other extensions or services that can participate
        // For example, by looking for specific contributions in package.json of other extensions
        // or by checking for known communication endpoints.
        console.log('[UniversalChannel] Discovering participants...');
        // Example: vscode.extensions.all.forEach(ext => { ... });
    }

    // Placeholder for broadcastPresence - implementation needed
    private broadcastPresence(participant: Participant) {
        // This method should inform other participants about this participant's presence.
        // This could involve sending a specific message type to a broadcast channel or known participants.
        console.log(`[UniversalChannel] Broadcasting presence of ${participant.id}`);
        this.eventEmitter.fire({ type: 'presence', participant });
    }

    public registerParticipant(participant: Participant) {
        this.participants.set(participant.id, participant);
        this.broadcastPresence(participant);
    }

    public async sendMessage(to: string, message: any): Promise<void> {
        const recipient = this.participants.get(to);
        if (!recipient) {
            // It might be better to log an error and not throw if a recipient might appear later
            console.error(`[UniversalChannel] Recipient ${to} not found in the system.`);
            // Consider a retry mechanism or queuing if messages are critical and recipient might appear
            throw new Error(`Recipient ${to} not found in the system`);
        }

        const messagePacket = {
            from: 'augment',
            to,
            content: message,
            timestamp: new Date().toISOString()
        };

        // Try all available communication methods
        await Promise.all([
            this.sendViaExtension(messagePacket),
            this.sendViaFileSystem(messagePacket),
            this.sendViaCommandPalette(messagePacket)
        ]);
    }

    public onMessage(callback: (message: unknown) => void) {
        return this.eventEmitter.event(callback);
    }

    private async sendViaExtension(message: any): Promise<void> {
        const extension = vscode.extensions.getExtension(message.to);
        if (extension) {
            const api = await extension.activate();
            if (api.receiveMessage) {
                api.receiveMessage(message);
            }
        }
    }

    // Ensure this method is async if it performs async operations, or remove async if not.
    // For now, assuming it might become async, so keeping it as is.
    private async sendViaFileSystem(message: any): Promise<void> {
        // Implementation for file-based communication (e.g., writing to a shared temp file)
        // This is highly dependent on the agreed protocol with other participants.
        console.log(`[UniversalChannel] Attempting to send message to ${message.to} via FileSystem (not implemented).`, message);
        // Example: vscode.workspace.fs.writeFile(...)
        // Ensure proper error handling here.
        return Promise.resolve(); // Explicitly return a promise
    }

    private async sendViaCommandPalette(message: any): Promise<void> {
        try {
            await vscode.commands.executeCommand(`${message.to}.receiveMessage`, message);
            console.log(`[UniversalChannel] Message sent to ${message.to} via Command Palette.`);
        } catch (error) {
            console.error(`[UniversalChannel] Failed to send message to ${message.to} via Command Palette:`, error);
            // Handle error, e.g., if the command doesn't exist
        }
    }

    public getActiveParticipants(): Participant[] {
        return Array.from(this.participants.values());
    }
}