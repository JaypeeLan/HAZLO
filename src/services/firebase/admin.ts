import * as admin from 'firebase-admin';
import path from 'path';
import { ENV } from '../../config/env';

if (!admin.apps.length) {
  let credential;

  if (process.env.NODE_ENV !== 'development') {
    // In production, use environment variables
    const serviceAccount = {
      projectId: ENV.FIREBASE_PROJECT_ID,
      privateKeyId: ENV.FIREBASE_PRIVATE_KEY_ID,
      privateKey: ENV.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
    } as admin.ServiceAccount;

    credential = admin.credential.cert(serviceAccount);
  } else {
    // In development, use the file
    credential = admin.credential.cert(
      path.join(__dirname, '../../../firebase.json')
    );
  }

  admin.initializeApp({
    credential,
    projectId: ENV.FIREBASE_PROJECT_ID,
  });
}

export const firebaseAdmin = admin;
export const messaging = admin.messaging();
