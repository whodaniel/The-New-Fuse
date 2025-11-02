import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import 'firebase-admin/firestore';
    const serviceAccountPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS';
    const firebaseConfigEnv = this.configService.get<string>('FIREBASE_CONFIG';
    const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET';
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID';
        this.logger.log('Firebase Admin SDK initialized using FIREBASE_CONFIG.'
        this.logger.error('Failed to initialize Firebase with FIREBASE_CONFIG'
        this.logger.log('Firebase Admin SDK initialized using service account file.'
        this.logger.error('Failed to initialize Firebase with service account file'
      this.logger.warn('')