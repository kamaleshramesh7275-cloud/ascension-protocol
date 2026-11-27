import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getStorage } from "../storage";
import { verifyFirebaseToken } from "../firebase-admin";

const LOCAL_TOKEN_SECRET =
  process.env.SESSION_SECRET ||
  process.env.DATABASE_URL ||
  "ascension_local_session_secret_dev";

export function signLocalSessionToken(firebaseUid: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      uid: firebaseUid,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", LOCAL_TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  return `local_jwt.${payload}.${sig}`;
}

export function verifyLocalSessionToken(token: string): { uid: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "local_jwt") return null;
    const [, payload, sig] = parts;
    const expected = crypto
      .createHmac("sha256", LOCAL_TOKEN_SECRET)
      .update(payload)
      .digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.uid || (parsed.exp && Date.now() > Number(parsed.exp))) {
      return null;
    }
    return { uid: String(parsed.uid) };
  } catch {
    return null;
  }
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function enrichUserWithLevelData(user: any) {
  if (!user) return user;
  const xp = user.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const xpForNextLevel = 100;
  const xpProgress = xpIntoLevel / xpForNextLevel;

  return {
    ...user,
    level,
    xpIntoLevel,
    xpForNextLevel,
    xpProgress,
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      code: "invalid_token",
      error: "Missing or invalid authorization header. Bearer token required.",
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      code: "invalid_token",
      error: "Empty Bearer token provided.",
    });
  }

  let decodedUser: { uid: string; email?: string; name?: string; picture?: string; isAnonymous: boolean };

  try {
    // If running in automated local test mode with explicit test token flag
    if (process.env.ALLOW_TEST_AUTH === "true" && token.startsWith("test_token_")) {
      const uid = token.replace("test_token_", "");
      decodedUser = {
        uid,
        email: `${uid}@test.ascension.protocol`,
        name: `Test User ${uid.slice(0, 6)}`,
        isAnonymous: uid.startsWith("anon_"),
      };
    } else if (token.startsWith("local_jwt.")) {
      const verified = verifyLocalSessionToken(token);
      if (!verified) {
        return res.status(401).json({
          code: "invalid_token",
          error: "Invalid or expired local session token.",
        });
      }
      decodedUser = { uid: verified.uid, isAnonymous: false };
    } else {
      decodedUser = await verifyFirebaseToken(token);
    }
  } catch (error: any) {
    if (error?.code === "auth/id-token-expired" || error?.message?.includes("expired")) {
      return res.status(401).json({
        code: "token_expired",
        error: "Firebase token expired. Re-authentication required.",
      });
    }

    return res.status(401).json({
      code: "invalid_token",
      error: "Invalid Firebase token.",
    });
  }

  const firebaseUid = decodedUser.uid;
  const storage = getStorage();

  // Check if account was explicitly deleted
  if (await storage.isUserDeleted(firebaseUid)) {
    return res.status(403).json({ error: "Account has been deleted" });
  }

  // Parse & validate timezone from X-Timezone header
  const tzHeader = req.headers["x-timezone"] as string | undefined;
  const timezone = tzHeader && isValidTimezone(tzHeader) ? tzHeader : "UTC";
  (req as any).timezone = timezone;

  let user = await storage.getUserByFirebaseUid(firebaseUid);

  // Auto-provision ONLY upon first presentation of a cryptographically valid token
  if (!user) {
    const isGuest = decodedUser.isAnonymous || firebaseUid.startsWith("anon_");
    const email = decodedUser.email || (isGuest ? `guest_${firebaseUid.slice(0, 8)}@ascensions.in` : `${firebaseUid.slice(0, 10)}@ascension.protocol`);
    const name = decodedUser.name || (isGuest ? "Guest Ascendant" : "Ascendant");

    user = await storage.createUser({
      firebaseUid,
      name,
      email,
      avatarUrl: decodedUser.picture || null,
      timezone,
      onboardingCompleted: false,
    });

    if (!isGuest) {
      await storage.updateUser(user.id, { coins: 150 });
    }
  }

  // Inject subscription status
  const { getSubscriptionStatus } = await import("../utils/subscription");
  const { isPremium, isTrial, trialEndsAt } = getSubscriptionStatus(user);

  (user as any).isPremium = isPremium;
  (user as any).isTrial = isTrial;
  (user as any).trialEndsAt = trialEndsAt;

  const enrichedUser = enrichUserWithLevelData(user);

  req.firebaseUid = firebaseUid;
  (req as any).user = enrichedUser;

  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  next();
}

export async function requireAdminPassword(req: Request, res: Response, next: NextFunction) {
  const adminPassword = req.headers["x-admin-password"] as string;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
}
