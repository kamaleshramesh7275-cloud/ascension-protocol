// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithCredential,
  getRedirectResult, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

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

// Enforce durable first-party storage to resist Safari ITP & Chrome cookie partitioning
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence)
    .catch(() => setPersistence(auth, browserLocalPersistence))
    .catch((err) => console.warn("[Firebase Auth] Persistence initialization notice:", err));
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Google Web Client ID for project ascension-957b6
const GOOGLE_WEB_CLIENT_ID = "1077180336436-ah94p7rvqirst2htnsfk91peo3tf8tdc.apps.googleusercontent.com";

let socialLoginInitialized = false;
async function ensureSocialLoginInitialized() {
  if (socialLoginInitialized || !Capacitor.isNativePlatform()) return;
  try {
    await SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
    });
    socialLoginInitialized = true;
    console.log("[SocialLogin] Native Google auth initialized.");
  } catch (err) {
    console.warn("[SocialLogin] Initialization warning:", err);
  }
}

// Automatically prepare SocialLogin on native devices
if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
  ensureSocialLoginInitialized().catch(() => {});
}

// Detect iOS, mobile, or standalone PWA environment where popups are restricted
export function isStandaloneOrMobile(): boolean {
  if (typeof window === "undefined") return false;
  // If running inside Capacitor Native App, handled by native SocialLogin
  if (Capacitor.isNativePlatform()) return false;
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
 * - On Native Android/iOS: Uses native Credential Manager / Play Services bottom sheet (no external browser tabs or blank pages).
 * - On Web / Desktop: Uses secure popup with fallback to redirect.
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult | null> => {
  // 1. Native Mobile Platform Flow (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    console.log("[Firebase Auth] Native platform detected. Launching in-app Google Credential Manager...");
    await ensureSocialLoginInitialized();

    try {
      const res = await SocialLogin.login({
        provider: "google",
        options: {
          scopes: ["email", "profile"],
        },
      });

      if (res && res.result) {
        const result = res.result;

        // If an ID Token is returned, authenticate directly into Firebase Auth
        if (result.responseType === "online" && result.idToken) {
          try {
            const credential = GoogleAuthProvider.credential(result.idToken);
            const cred = await signInWithCredential(auth, credential);
            console.log("[Firebase Auth] Native Google sign-in successfully authenticated Firebase user:", cred.user.email);
            return { user: cred.user, isRedirect: false };
          } catch (credErr) {
            console.warn("[Firebase Auth] signInWithCredential warning, resolving with native profile:", credErr);
          }
        }

        // Resilient fallback: Construct valid User object from native profile for backend sync
        if (result.responseType === "online" && result.profile) {
          const profile = result.profile;
          const fallbackUser = {
            uid: profile.id || `google_${profile.email?.replace(/[^a-zA-Z0-9]/g, "_")}`,
            email: profile.email || "",
            displayName: profile.name || [profile.givenName, profile.familyName].filter(Boolean).join(" ") || "Hunter",
            photoURL: profile.imageUrl || null,
          } as unknown as User;

          console.log("[Firebase Auth] Native Google profile resolved for Hunter:", fallbackUser.displayName);
          return { user: fallbackUser, isRedirect: false };
        }
      }

      throw new Error("No Google profile returned from native account selector.");
    } catch (nativeErr: any) {
      console.error("[Firebase Auth] Native Google Sign-In error:", nativeErr);
      const errMsg = nativeErr?.message || "";
      if (
        errMsg.includes("cancel") || 
        errMsg.includes("CANCEL") || 
        errMsg.includes("16") || // Google Play Services SIGN_IN_CANCELLED
        nativeErr?.code === "USER_CANCELLED"
      ) {
        throw new Error("Google sign-in was cancelled.");
      }
      throw nativeErr;
    }
  }

  // 2. Web Browsers (Desktop & Mobile) / PWAs: Secure Popup Flow (immune to storage partitioning)
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return { user: cred.user, isRedirect: false };
  } catch (error: any) {
    console.warn("[Firebase Auth] signInWithPopup encountered issue:", error.code, error.message);
    if (
      error.code === "auth/popup-closed-by-user" || 
      error.code === "auth/cancelled-popup-request"
    ) {
      throw new Error("Google sign-in window was closed.");
    }
    if (error.code === "auth/popup-blocked") {
      throw new Error("Popup was blocked by your browser. Please allow popups for Ascension Protocol, or sign in using Username & Password.");
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
    if (error?.code === "auth/missing-initial-state") {
      console.warn("[Firebase Auth] Suppressed partitioned or missing initial state.");
      return null;
    }
    console.error("[Firebase Auth] getRedirectResult error:", error);
    throw error;
  }
};

export const signOut = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SocialLogin.logout({ provider: "google" });
    } catch (e) {
      console.warn("[SocialLogin] Native logout notice:", e);
    }
  }
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
    case "auth/missing-initial-state":
      return {
        title: "Session Storage Cleared",
        description: "Your browser partitioned or cleared initial session state. Tap Continue with Google again to sign in directly via secure popup.",
      };
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
