// Firebase configuration and initialization
// Based on firebase_barebones_javascript blueprint
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

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
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
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

export type { FirebaseUser };
