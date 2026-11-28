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
  // 1. Try Firebase Admin first
  try {
    const firebaseAdmin = getFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken, true);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      isAnonymous: decodedToken.firebase?.sign_in_provider === "anonymous",
    };
  } catch (firebaseErr: any) {
    // 2. Fallback: Verify Google OAuth2 OpenID Connect ID Token directly via Google OAuth API
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const payload: any = await res.json();
        const validAud =
          payload.aud === "1077180336436-ah94p7rvqirst2htnsfk91peo3tf8tdc.apps.googleusercontent.com" ||
          String(payload.aud || "").startsWith("1077180336436");

        if (validAud && payload.sub) {
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && Number(payload.exp) < now) {
            const expErr: any = new Error("Firebase token expired. Re-authentication required.");
            expErr.code = "auth/id-token-expired";
            throw expErr;
          }
          return {
            uid: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            isAnonymous: false,
          };
        }
      }
    } catch (googleErr: any) {
      if (googleErr?.code === "auth/id-token-expired") {
        throw googleErr;
      }
    }

    // If both failed, rethrow the original error
    throw firebaseErr;
  }
}
