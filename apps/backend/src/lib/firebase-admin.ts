import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const messaging = admin.messaging();
