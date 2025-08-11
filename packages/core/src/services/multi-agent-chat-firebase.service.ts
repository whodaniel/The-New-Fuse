import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { initializeApp, getApps, FirebaseApp } from /firebase/app'';
} from /firebase/auth';
} from /firebase/firestore';
          apiKey: this.configService.get<string>('FIREBASE_API_KEY'
          authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'
          storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'
          messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID'
          appId: this.configService.get<string>('FIREBASE_APP_ID'
          throw new Error('Firebase configuration is incomplete'
      setLogLevel('')
      console.error('placeholder'
      throw new Error('Firebase Auth is not initialized'
      console.error('placeholder'
    const appId = this.configService.get<string>('FIREBASE_APP_ID') || ';
      throw new Error('');
  async createAgent(userId: string, agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'
    const agentsRef = this.getCollection(userId, 'agents';
      throw new Error('Firestore is not initialized'
    const agentRef = doc(this.db, this.getCollectionPath(userId, 'agents';
      throw new Error('Firestore is not initialized'
    const agentRef = doc(this.db, this.getCollectionPath(userId, 'agents';
    const agentsRef = this.getCollection(userId, ';
  async addMessage(userId: string, message: Omit<Message, 'id' | 'timestamp'
    const messagesRef = this.getCollection(userId, 'messages';
      throw new Error('Firestore is not initialized'
    const messagesRef = this.getCollection(userId, 'messages';
    const messagesRef = this.getCollection(userId, ';
  async createRule(userId: string, rule: Omit<ConversationRule, 'id'
    const rulesRef = this.getCollection(userId, 'rules';
      throw new Error('Firestore is not initialized'
    const ruleRef = doc(this.db, this.getCollectionPath(userId, 'rules';
      throw new Error('Firestore is not initialized'
    const ruleRef = doc(this.db, this.getCollectionPath(userId, 'rules';
    const rulesRef = this.getCollection(userId, ';
      throw new Error('Firestore is not initialized'
    const collections = ['agents', 'messages', ';