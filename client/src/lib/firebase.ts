// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCG6MOlkw0EREki69YhwA2qm1I0EmrTQAI",
  authDomain: "ascension-957b6.firebaseapp.com",
  projectId: "ascension-957b6",
  storageBucket: "ascension-957b6.firebasestorage.app",
  appId: "1:1077180336436:web:23631ba82fc1100b03bd61",
  messagingSenderId: "1077180336436",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Detect iOS, mobile, or standalone PWA environment where popups are restricted
export function isStandaloneOrMobile(): boolean {
  if (typeof window === "undefined") return false;
  const isStandalone = 
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isStandalone || isMobile;
}

// Lazily get FCM messaging — only in supported browsers
export async function getFCMMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

export interface GoogleAuthResult {
  user: User;
  isRedirect?: boolean;
}

/**
 * Initiates Google Sign-In.
 * Automatically attempts popup on desktop, and falls back to redirect on mobile/standalone PWA
 * or if popups are blocked by browser security policies.
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult | null> => {
  // Standalone PWAs on mobile fail if popups are attempted; use redirect directly
  if (isStandaloneOrMobile()) {
    console.log("[Firebase Auth] Mobile or Standalone PWA environment detected. Using signInWithRedirect...");
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return { user: cred.user, isRedirect: false };
  } catch (error: any) {
    console.warn("[Firebase Auth] signInWithPopup encountered issue:", error.code, error.message);
    if (
      error.code === "auth/popup-blocked" || 
      error.code === "auth/popup-closed-by-user" || 
      error.code === "auth/cancelled-popup-request"
    ) {
      console.log("[Firebase Auth] Falling back to signInWithRedirect...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

/**
 * Checks for and resolves a completed Google redirect sign-in.
 */
export const getGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log("[Firebase Auth] Retrieved redirect user:", result.user.email);
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error("[Firebase Auth] getRedirectResult error:", error);
    throw error;
  }
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error handling auth redirect:", error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export type FirebaseUser = User & {
  onboardingCompleted?: boolean;
};

/**
 * Parses Firebase auth errors into actionable user-facing messages.
 */
export function formatFirebaseAuthError(error: any): { title: string; description: string } {
  const code = error?.code || "";
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "your current domain";

  switch (code) {
    case "auth/unauthorized-domain":
      return {
        title: "Domain Not Authorized in Firebase",
        description: `This domain (${currentHost}) is not listed in Firebase Authentication > Settings > Authorized Domains. Please add "${currentHost}" in your Firebase Console, or sign in using Username/Password below.`,
      };
    case "auth/popup-blocked":
      return {
        title: "Popup Blocked by Browser",
        description: "Your browser blocked the Google authentication popup. Tap again to log in via secure page redirect.",
      };
    case "auth/popup-closed-by-user":
      return {
        title: "Sign-In Cancelled",
        description: "The Google sign-in window was closed before finishing. Tap the button again to retry.",
      };
    case "auth/network-request-failed":
      return {
        title: "Network Connection Issue",
        description: "Could not reach Google authentication servers. Please verify your internet connection.",
      };
    case "auth/operation-not-allowed":
      return {
        title: "Google Auth Not Enabled",
        description: "Google sign-in is disabled in your Firebase project. Please enable Google in Firebase Console > Authentication > Sign-in method.",
      };
    default:
      return {
        title: "Google Sign-In Failed",
        description: error?.message || "Could not complete sign-in with Google. Please use local username/password or Guest mode.",
      };
  }
}
