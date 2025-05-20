import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Auth } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseConfig {
  constructor(private readonly configService: ConfigService) {
    this.initializeApp();
  }

  private initializeApp() {
    if (admin.apps.length > 0) {
      return; // Already initialized
    }

    const serviceAccountPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const firebaseConfigEnv = this.configService.get<string>('FIREBASE_CONFIG');
    const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

    let initialized = false;

    if (firebaseConfigEnv) {
      try {
        const serviceAccount = JSON.parse(firebaseConfigEnv);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket,
          projectId,
        });
        initialized = true;
        this.logger.log('Firebase Admin SDK initialized using FIREBASE_CONFIG.');
      } catch (error) {
        this.logger.error('Error parsing FIREBASE_CONFIG or initializing Firebase Admin SDK:', error);
      }
    }

    if (!initialized && serviceAccountPath) {
      try {
        // GOOGLE_APPLICATION_CREDENTIALS is a path to a file, not the content itself usually.
        // However, if it were the JSON content, admin.credential.cert would handle it if it's an object.
        // For safety, we assume it's a path as per standard Firebase/GCP practice.
        // If your setup passes JSON directly via this env var, the logic might need adjustment.
        admin.initializeApp({
          credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS path
          storageBucket,
          projectId,
        });
        initialized = true;
        this.logger.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
      } catch (error) {
        this.logger.error('Error initializing Firebase Admin SDK with GOOGLE_APPLICATION_CREDENTIALS:', error);
      }
    }

    if (!initialized) {
      this.logger.error('Firebase Admin SDK not initialized. Ensure FIREBASE_CONFIG or GOOGLE_APPLICATION_CREDENTIALS is correctly set.');
    }
  }

  private logger = {
    log: (message: string, ...optionalParams: any[]) => console.log(`[FirebaseConfig] ${message}`, ...optionalParams),
    error: (message: string, ...optionalParams: any[]) => console.error(`[FirebaseConfig] ${message}`, ...optionalParams),
  };

  getAuth(): Auth {
    return admin.auth();
  }

  getFirestore(): Firestore {
    return admin.firestore();
  }

  getStorage(): Storage {
    return admin.storage();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Invalid ID token');
    }
  }
}