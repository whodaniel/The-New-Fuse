import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  Auth,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  setLogLevel,
  Firestore,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { Agent, Message, ConversationRule, ChatSession } from '../types/multi-agent-chat.types';

@Injectable()
export class MultiAgentChatFirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private currentUser: User | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0];
      } else {
        const firebaseConfig = {
          apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
          authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
          messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID'),
          appId: this.configService.get<string>('FIREBASE_APP_ID')
        };

        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
          throw new Error('Firebase configuration is incomplete');
        }

        this.app = initializeApp(firebaseConfig);
      }

      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      setLogLevel('debug');

      // Set up auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
      });

    } catch (error) {
      console.error('Failed to initialize Firebase for Multi-Agent Chat:', error);
      throw error;
    }
  }

  async authenticateUser(customToken?: string): Promise<User> {
    if (!this.auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      let userCredential;
      if (customToken) {
        userCredential = await signInWithCustomToken(this.auth, customToken);
      } else {
        userCredential = await signInAnonymously(this.auth);
      }
      
      this.currentUser = userCredential.user;
      return this.currentUser;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  private getCollectionPath(userId: string, collectionName: string): string {
    const appId = this.configService.get<string>('FIREBASE_APP_ID') || 'default-app-id';
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
  }

  private getCollection(userId: string, collectionName: string): CollectionReference<DocumentData> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    return collection(this.db, this.getCollectionPath(userId, collectionName));
  }

  // Agent management
  async createAgent(userId: string, agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const agentsRef = this.getCollection(userId, 'agents');
    const agentData = {
      ...agent,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    const docRef = await addDoc(agentsRef, agentData);
    return docRef.id;
  }

  async updateAgent(userId: string, agentId: string, updates: Partial<Agent>): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    
    const agentRef = doc(this.db, this.getCollectionPath(userId, 'agents'), agentId);
    await updateDoc(agentRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteAgent(userId: string, agentId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    
    const agentRef = doc(this.db, this.getCollectionPath(userId, 'agents'), agentId);
    await deleteDoc(agentRef);
  }

  subscribeToAgents(userId: string, callback: (agents: Agent[]) => void): () => void {
    const agentsRef = this.getCollection(userId, 'agents');
    const q = query(agentsRef);
    
    return onSnapshot(q, (snapshot) => {
      const agents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Agent));
      callback(agents);
    });
  }

  // Message management
  async addMessage(userId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    const messagesRef = this.getCollection(userId, 'messages');
    const messageData = {
      ...message,
      timestamp: new Date()
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    return docRef.id;
  }

  async clearMessages(userId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    
    const messagesRef = this.getCollection(userId, 'messages');
    const snapshot = await getDocs(messagesRef);
    
    if (!snapshot.empty) {
      const batch = writeBatch(this.db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  subscribeToMessages(userId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = this.getCollection(userId, 'messages');
    const q = query(messagesRef);
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      
      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      callback(messages);
    });
  }

  // Rule management
  async createRule(userId: string, rule: Omit<ConversationRule, 'id'>): Promise<string> {
    const rulesRef = this.getCollection(userId, 'rules');
    const docRef = await addDoc(rulesRef, rule);
    return docRef.id;
  }

  async updateRule(userId: string, ruleId: string, updates: Partial<ConversationRule>): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    
    const ruleRef = doc(this.db, this.getCollectionPath(userId, 'rules'), ruleId);
    await updateDoc(ruleRef, updates);
  }

  async deleteRule(userId: string, ruleId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }
    
    const ruleRef = doc(this.db, this.getCollectionPath(userId, 'rules'), ruleId);
    await deleteDoc(ruleRef);
  }

  subscribeToRules(userId: string, callback: (rules: ConversationRule[]) => void): () => void {
    const rulesRef = this.getCollection(userId, 'rules');
    const q = query(rulesRef);
    
    return onSnapshot(q, (snapshot) => {
      const rules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ConversationRule));
      callback(rules);
    });
  }

  // Batch operations
  async clearAllData(userId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }

    const collections = ['agents', 'messages', 'rules'];
    const batch = writeBatch(this.db);

    for (const collectionName of collections) {
      const collectionRef = this.getCollection(userId, collectionName);
      const snapshot = await getDocs(collectionRef);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    await batch.commit();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isInitialized(): boolean {
    return this.app !== null && this.auth !== null && this.db !== null;
  }
}
