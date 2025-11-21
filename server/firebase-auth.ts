// Firebase auth handling for the backend
// NOTE: This is a simplified MVP implementation
// In production, you should use Firebase Admin SDK to verify ID tokens

import { Request, Response, NextFunction } from "express";

export async function extractFirebaseUid(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // For MVP: Accept Firebase UID from custom header
  // The client will send this after successful Firebase authentication
  // 
  // SECURITY NOTE: In production, you MUST:
  // 1. Install firebase-admin package
  // 2. Verify the Firebase ID token sent in Authorization header
  // 3. Extract the UID from the verified token
  // 
  // Example production implementation:
  // const token = req.headers.authorization?.split('Bearer ')[1];
  // if (token) {
  //   const decodedToken = await admin.auth().verifyIdToken(token);
  //   req.firebaseUid = decodedToken.uid;
  // }
  
  const firebaseUid = req.headers["x-firebase-uid"] as string;
  if (firebaseUid) {
    req.firebaseUid = firebaseUid;
  }
  
  next();
}
