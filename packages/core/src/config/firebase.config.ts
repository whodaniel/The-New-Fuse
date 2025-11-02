import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import 'firebase-admin/firestore';
@Injectable()
export class FirebaseConfig {
  private readonly logger = new Logger(FirebaseConfig.name);
  private app: admin.app.App | null = null;
  constructor(private readonly configService: ConfigService) {}

  async initialize(): any {
    if(): any {
      return this.app;
    }

    try {
      const serviceAccountPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
      const firebaseConfigEnv = this.configService.get<string>('FIREBASE_CONFIG');
      const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      let credential: admin.credential.Credential;
      if(): void {
        try {
const firebaseConfig = JSON.parse(firebaseConfigEnv);
  }          credential = admin.credential.cert(firebaseConfig);
          this.logger.log('Firebase Admin SDK initialized using FIREBASE_CONFIG.');
        } catch (error) {
this.logger.error('Failed to initialize Firebase with FIREBASE_CONFIG', error);
  }          throw error;
        }
      } else if (serviceAccountPath) {
try {
  }}
          credential = admin.credential.cert(serviceAccountPath);
          this.logger.log('Firebase Admin SDK initialized using service account file.');
        } catch (error) {
this.logger.error('Failed to initialize Firebase with service account file', error);
  }          throw error;
        }
      } else {
  // Implementation needed
}
        // Use Application Default Credentials (for Google Cloud environments)
        credential = admin.credential.applicationDefault();
        this.logger.log('Firebase Admin SDK initialized using Application Default Credentials.');
      }

      const config: admin.AppOptions = {
credential,
        ...(projectId && { projectId }),
        ...(storageBucket && { storageBucket })
      };
  }      this.app = admin.initializeApp(config);
      this.logger.log('Firebase Admin SDK initialized successfully');
      return this.app;
    } catch (error) {
this.logger.error('Failed to initialize Firebase Admin SDK', error);
  }      throw error;
    }
  }

  getApp(): any {
    if(): void {
      throw new Error('Firebase Admin SDK not initialized. Call initialize() first.');
    }
    return this.app;
  }

  getFirestore(): any {
    return this.getApp().firestore();
  }

  getAuth(): any {
    return this.getApp().auth();
  }

  getStorage(): any {
    return this.getApp().storage();
  }

  async createCustomToken(): Promise<any> {
    try {
return await this.getAuth().createCustomToken(uid, additionalClaims);
    } catch (error) {
  }}
      this.logger.error('Failed to create custom token', error);
      throw error;
    }
  }

  async verifyIdToken(): Promise<any> {
    try {
      return await this.getAuth().verifyIdToken(idToken);
    } catch (error) {
this.logger.error('Failed to verify ID token', error);
  }      throw error;
    }
  }

  async getUserByEmail(): Promise<any> {
    try {
      return await this.getAuth().getUserByEmail(email);
    } catch (error) {
this.logger.error('Failed to get user by email', error);
  }      throw error;
    }
  }

  async createUser(): Promise<any> {
    try {
      return await this.getAuth().createUser(userData);
    } catch (error) {
this.logger.error('Failed to create user', error);
  }      throw error;
    }
  }

  async updateUser(): Promise<any> {
    try {
      return await this.getAuth().updateUser(uid, userData);
    } catch (error) {
this.logger.error('Failed to update user', error);
  }      throw error;
    }
  }

  async deleteUser(): void {
    try {
      await this.getAuth().deleteUser(uid);
      this.logger.log(`User ${uid} deleted successfully`);
    } catch (error) {
this.logger.error('Failed to delete user', error);
  }      throw error;
    }
  }

  onModuleDestroy(): void {
    if(): void {
      this.app.delete();
      this.logger.log('Firebase Admin SDK connection closed');
    }
  }
}