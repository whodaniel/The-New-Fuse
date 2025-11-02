
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { Agent, Message, ConversationRule } from '../types/multi-agent-chat.types';

@Injectable()
export class MultiAgentChatFirebaseService {
    private firebaseApp: FirebaseApp;
    private auth: Auth;
    private db: Firestore;

    constructor(private configService: ConfigService) {
        if (!getApps().length) {
            this.firebaseApp = initializeApp({
                apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
                authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
                projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
                storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
                messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID'),
                appId: this.configService.get<string>('FIREBASE_APP_ID'),
            });
        } else {
            this.firebaseApp = getApps()[0];
        }
        this.auth = getAuth(this.firebaseApp);
        this.db = getFirestore(this.firebaseApp);
    }

    async authenticateUser(): Promise<User> {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                unsubscribe();
                if (user) {
                    resolve(user);
                } else {
                    signInAnonymously(this.auth)
                        .then((userCredential) => {
                            resolve(userCredential.user);
                        })
                        .catch(reject);
                }
            });
        });
    }

    subscribeToAgents(userId: string, callback: (agents: Agent[]) => void): () => void {
        const agentsRef = collection(this.db, `users/${userId}/agents`);
        return onSnapshot(agentsRef, (snapshot) => {
            const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
            callback(agents);
        });
    }

    subscribeToMessages(userId: string, callback: (messages: Message[]) => void): () => void {
        const messagesRef = collection(this.db, `users/${userId}/messages`);
        return onSnapshot(messagesRef, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            callback(messages);
        });
    }

    subscribeToRules(userId: string, callback: (rules: ConversationRule[]) => void): () => void {
        const rulesRef = collection(this.db, `users/${userId}/rules`);
        return onSnapshot(rulesRef, (snapshot) => {
            const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationRule));
            callback(rules);
        });
    }

    async createAgent(userId: string, agentData: Omit<Agent, 'id'>): Promise<string> {
        const agentsRef = collection(this.db, `users/${userId}/agents`);
        const newAgentRef = doc(agentsRef);
        await setDoc(newAgentRef, agentData);
        return newAgentRef.id;
    }

    async updateAgent(userId: string, agentId: string, updates: Partial<Agent>): Promise<void> {
        const agentRef = doc(this.db, `users/${userId}/agents`, agentId);
        await setDoc(agentRef, updates, { merge: true });
    }

    async deleteAgent(userId: string, agentId: string): Promise<void> {
        const agentRef = doc(this.db, `users/${userId}/agents`, agentId);
        await deleteDoc(agentRef);
    }

    async addMessage(userId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
        const messagesRef = collection(this.db, `users/${userId}/messages`);
        const newMessageRef = doc(messagesRef);
        await setDoc(newMessageRef, { ...message, timestamp: new Date() });
    }

    async clearMessages(userId: string): Promise<void> {
        const messagesRef = collection(this.db, `users/${userId}/messages`);
        const snapshot = await getDocs(messagesRef);
        const batch = writeBatch(this.db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    async createRule(userId: string, rule: Omit<ConversationRule, 'id'>): Promise<void> {
        const rulesRef = collection(this.db, `users/${userId}/rules`);
        const newRuleRef = doc(rulesRef);
        await setDoc(newRuleRef, rule);
    }

    async updateRule(userId: string, ruleId: string, updates: Partial<ConversationRule>): Promise<void> {
        const ruleRef = doc(this.db, `users/${userId}/rules`, ruleId);
        await setDoc(ruleRef, updates, { merge: true });
    }

    async deleteRule(userId: string, ruleId: string): Promise<void> {
        const ruleRef = doc(this.db, `users/${userId}/rules`, ruleId);
        await deleteDoc(ruleRef);
    }

    async clearAllData(userId: string): Promise<void> {
        await this.clearMessages(userId);
        const agentsRef = collection(this.db, `users/${userId}/agents`);
        const agentsSnapshot = await getDocs(agentsRef);
        const agentBatch = writeBatch(this.db);
        agentsSnapshot.docs.forEach(doc => agentBatch.delete(doc.ref));
        await agentBatch.commit();
        const rulesRef = collection(this.db, `users/${userId}/rules`);
        const rulesSnapshot = await getDocs(rulesRef);
        const ruleBatch = writeBatch(this.db);
        rulesSnapshot.docs.forEach(doc => ruleBatch.delete(doc.ref));
        await ruleBatch.commit();
    }
}
