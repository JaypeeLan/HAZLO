import * as admin from 'firebase-admin';
import path from 'path';
import { ENV } from '../../config/env';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.join(__dirname, '../../../firebase.json')
    ),
    projectId: ENV.FIREBASE_PROJECT_ID,
  });
}

export const firebaseAdmin = admin;
export const messaging = admin.messaging();
