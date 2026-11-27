import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getStorage } from "../storage";
import { insertFeedbackSchema } from "@shared/schema";

const router = Router();
const DAILY_FEEDBACK_LIMIT = 5;

const SENSITIVE_KEY_RE = /token|password|secret|authorization|cookie|credential/i;

function sanitizeDiagnostics(diag: any) {
  if (!diag || typeof diag !== "object") return null;
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(diag)) {
    if (SENSITIVE_KEY_RE.test(k)) continue;
    clean[k] = v;
  }
  if (Array.isArray(clean.recentErrors)) {
    clean.recentErrors = clean.recentErrors.slice(0, 15).map((err: any) => ({
      time: String(err?.time || "").slice(0, 60),
      message: String(err?.message || "").replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]").slice(0, 300),
      endpoint: err?.endpoint ? String(err.endpoint).slice(0, 150) : undefined,
      statusCode: typeof err?.statusCode === "number" ? err.statusCode : undefined,
    }));
  }
  return clean;
}

/**
 * POST /api/feedback
 * Submit a bug report, feature request, or general suggestion.
 * Rate-limited to 5 submissions per user per 24 hours.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const parsed = insertFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid feedback payload",
      });
    }

    const storage = getStorage();
    const cfg = await storage.getSystemConfig();
    const dailyLimit = cfg?.limits?.dailyFeedbackLimit ?? DAILY_FEEDBACK_LIMIT;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await storage.countUserFeedbackSince(user.id, since);
    if (recentCount >= dailyLimit) {
      return res.status(429).json({
        error: `Daily submission limit reached (${dailyLimit}/24h). Please try again tomorrow.`,
      });
    }

    const created = await storage.createFeedback({
      userId: user.id,
      userName: user.name || "Hunter",
      type: parsed.data.type,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      diagnostics: sanitizeDiagnostics(parsed.data.diagnostics),
      status: "open",
      upvoteCount: 0,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("[FEEDBACK] Submit failed:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

/**
 * GET /api/feedback/mine
 * Returns the authenticated user's own submissions & status updates.
 */
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const storage = getStorage();
    const items = await storage.getUserFeedback(user.id);
    res.json({ items });
  } catch (err) {
    console.error("[FEEDBACK] Fetch mine failed:", err);
    res.status(500).json({ error: "Failed to fetch your feedback" });
  }
});

/**
 * GET /api/feedback/popular
 * Public community board of feature requests & suggestions with upvote state.
 */
router.get("/popular", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const sort = req.query.sort === "new" ? "new" : "top";

    const storage = getStorage();
    const items = await storage.getPublicFeatureRequests(user.id, { status, sort });
    // Strip diagnostics from public board responses
    const sanitized = items.map(({ diagnostics: _diag, ...rest }) => rest);
    res.json({ items: sanitized });
  } catch (err) {
    console.error("[FEEDBACK] Fetch popular failed:", err);
    res.status(500).json({ error: "Failed to fetch community requests" });
  }
});

/**
 * POST /api/feedback/:id/upvote
 * Toggle upvote on a feature request or suggestion.
 */
router.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const storage = getStorage();
    const result = await storage.toggleFeedbackUpvote(req.params.id, user.id);
    res.json(result);
  } catch (err: any) {
    if (err?.message === "Feedback item not found") {
      return res.status(404).json({ error: "Feedback item not found" });
    }
    console.error("[FEEDBACK] Upvote failed:", err);
    res.status(500).json({ error: "Failed to toggle upvote" });
  }
});

export default router;
