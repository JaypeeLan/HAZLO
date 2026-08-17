import * as admin from 'firebase-admin';
import path from 'path';
import { ENV } from '../../config/env';

const normalizePrivateKey = (key?: string) => {
  if (!key) return key;
  let normalized = key.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
};

if (!admin.apps.length) {
  let credential;

  if (process.env.NODE_ENV !== 'development') {
    const serviceAccount = {
      projectId: ENV.FIREBASE_PROJECT_ID,
      privateKey: normalizePrivateKey(ENV.FIREBASE_PRIVATE_KEY),
      clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
    } as admin.ServiceAccount;

    credential = admin.credential.cert(serviceAccount);
  } else {
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
