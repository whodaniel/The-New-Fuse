import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

// Add 2FA verification utilities
export const verify2FAToken = async (uid: string, token: string) => {
  try {
    const user = await auth.getUser(uid);
    const secret = user.customClaims?.['2faSecret'];
    if (!secret) return false;
    
    import { authenticator  } from 'otplib';
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
};

export default admin;
