import * as admin from "firebase-admin";

let isInitialized = false;

export function getFirebaseAdmin(): typeof admin {
  if (!isInitialized && !admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        isInitialized = true;
        console.log("[FirebaseAdmin] Initialized successfully with service account cert.");
      } catch (e) {
        console.error("[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, attempting default initialization:", e);
        admin.initializeApp();
        isInitialized = true;
      }
    } else {
      console.warn("[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON not set. Initializing with default credentials.");
      admin.initializeApp();
      isInitialized = true;
    }
  }
  return admin;
}

export async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email?: string; name?: string; picture?: string; isAnonymous: boolean }> {
  const firebaseAdmin = getFirebaseAdmin();
  const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken, true);
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    picture: decodedToken.picture,
    isAnonymous: decodedToken.firebase?.sign_in_provider === "anonymous",
  };
}
