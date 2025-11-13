import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, writeBatch, getDocs } from 'firebase/firestore';
// Firebase configuration - should be moved to environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "demo-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};
export class MultiAgentChatFirebaseService {
    app;
    auth;
    db;
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
    }
    async authenticateUser() {
        const result = await signInAnonymously(this.auth);
        return result.user;
    }
    subscribeToAgents(userId, callback) {
        const q = query(collection(this.db, 'agents'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const agents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(agents);
        });
    }
    subscribeToMessages(userId, callback) {
        const q = query(collection(this.db, 'messages'), where('userId', '==', userId), orderBy('timestamp', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            callback(messages);
        });
    }
    subscribeToRules(userId, callback) {
        const q = query(collection(this.db, 'rules'), where('userId', '==', userId), orderBy('priority', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const rules = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(rules);
        });
    }
    async createAgent(userId, agentData) {
        const docRef = await addDoc(collection(this.db, 'agents'), {
            ...agentData,
            userId,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            status: 'active'
        });
        return docRef.id;
    }
    async updateAgent(userId, id, updates) {
        const docRef = doc(this.db, 'agents', id);
        await updateDoc(docRef, {
            ...updates,
            lastActiveAt: new Date()
        });
    }
    async deleteAgent(userId, id) {
        await deleteDoc(doc(this.db, 'agents', id));
    }
    async addMessage(userId, messageData) {
        await addDoc(collection(this.db, 'messages'), {
            ...messageData,
            userId,
            timestamp: new Date(),
            type: messageData.sender === 'system' ? 'system' : 'user'
        });
    }
    async clearMessages(userId) {
        const q = query(collection(this.db, 'messages'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(this.db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    async createRule(userId, rule) {
        await addDoc(collection(this.db, 'rules'), {
            ...rule,
            userId
        });
    }
    async updateRule(userId, id, updates) {
        const docRef = doc(this.db, 'rules', id);
        await updateDoc(docRef, updates);
    }
    async deleteRule(userId, id) {
        await deleteDoc(doc(this.db, 'rules', id));
    }
    async clearAllData(userId) {
        // Clear agents
        const agentsQuery = query(collection(this.db, 'agents'), where('userId', '==', userId));
        const agentsSnapshot = await getDocs(agentsQuery);
        // Clear messages
        const messagesQuery = query(collection(this.db, 'messages'), where('userId', '==', userId));
        const messagesSnapshot = await getDocs(messagesQuery);
        // Clear rules
        const rulesQuery = query(collection(this.db, 'rules'), where('userId', '==', userId));
        const rulesSnapshot = await getDocs(rulesQuery);
        const batch = writeBatch(this.db);
        [...agentsSnapshot.docs, ...messagesSnapshot.docs, ...rulesSnapshot.docs].forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}
//# sourceMappingURL=multi-agent-chat-firebase.service.js.map