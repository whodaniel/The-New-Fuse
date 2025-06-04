import * as admin from 'firebase-admin';
export declare const auth: import("firebase-admin/auth").Auth;
export declare const db: admin.firestore.Firestore;
export declare const storage: import("firebase-admin/storage").Storage;
export declare const verify2FAToken: (uid: string, token: string) => Promise<any>;
export default admin;
