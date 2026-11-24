import { app } from "./app";
import { registerRoutes } from "./routes";
import { getStorage } from "./storage";
import type { Server } from "http";

process.env.ALLOW_TEST_AUTH = "true";
process.env.SKIP_FOCUS_TIMER_CHECK = "true";

const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runAttackSuite() {
  console.log("\n=======================================================");
  console.log("   STEP 1: BACKEND ATTACK REPLAY & VERIFICATION SUITE   ");
  console.log("=======================================================\n");

  const server: Server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(PORT, "127.0.0.1", () => resolve()));
  console.log(`[Test Server] Running on ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, evidence: string) {
    if (condition) {
      console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
      console.log(`       Evidence: ${evidence}\n`);
      passed++;
    } else {
      console.error(`\x1b[31m[FAIL]\x1b[0m ${testName}`);
      console.error(`       Evidence: ${evidence}\n`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // ATTACK 1: SEC-01 Account Takeover via Spoofed login-google Body
    // -------------------------------------------------------------------------
    console.log("--- Executing Attack 1: Account Takeover via login-google body ---");
    const atk1Res = await fetch(`${BASE_URL}/api/auth/login-google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: "spoofed_google_user_victim_123",
        email: "victim@ascension.in",
      }),
    });
    const atk1Data = await atk1Res.json();
    assert(
      atk1Res.status === 401 && atk1Data.code === "invalid_token",
      "SEC-01 Account Takeover Blocked (Missing Token)",
      `Status: ${atk1Res.status}, Response: ${JSON.stringify(atk1Data)}`
    );

    // -------------------------------------------------------------------------
    // ATTACK 2: SEC-01 Fake Token Signature
    // -------------------------------------------------------------------------
    console.log("--- Executing Attack 2: Fake/Forged Token in login-google ---");
    const atk2Res = await fetch(`${BASE_URL}/api/auth/login-google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken: "fake_unverified_jwt_signature_xyz",
      }),
    });
    const atk2Data = await atk2Res.json();
    assert(
      atk2Res.status === 401 && atk2Data.code === "invalid_token",
      "SEC-01 Fake Token Signature Rejected",
      `Status: ${atk2Res.status}, Response: ${JSON.stringify(atk2Data)}`
    );

    // -------------------------------------------------------------------------
    // ATTACK 3: SEC-02 Identity Spoofing via x-firebase-uid Header
    // -------------------------------------------------------------------------
    console.log("--- Executing Attack 3: Impersonation via x-firebase-uid header ---");
    const atk3Res = await fetch(`${BASE_URL}/api/user`, {
      method: "GET",
      headers: {
        "x-firebase-uid": "spoofed_target_victim_999",
      },
    });
    const atk3Data = await atk3Res.json();
    assert(
      atk3Res.status === 401 && atk3Data.code === "invalid_token",
      "SEC-02 x-firebase-uid Spoofing Blocked (Bearer Token Strictly Required)",
      `Status: ${atk3Res.status}, Response: ${JSON.stringify(atk3Data)}`
    );

    // -------------------------------------------------------------------------
    // ATTACK 4: SEC-03 Focus Duration Exploit (duration = 50000 -> 250k XP)
    // -------------------------------------------------------------------------
    console.log("--- Executing Attack 4: Focus XP Exploit (duration = 50000) ---");
    const userAToken = "test_token_qa_user_alpha";
    const atk4Res = await fetch(`${BASE_URL}/api/focus/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ duration: 50000 }),
    });
    const atk4Data = await atk4Res.json();
    assert(
      atk4Res.status === 400 && atk4Data.error.includes("between 1 and 180"),
      "SEC-03 Focus 50000 Duration Exploit Blocked",
      `Status: ${atk4Res.status}, Response: ${JSON.stringify(atk4Data)}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: SEC-03 Focus Lifecycle (Start -> Elapsed Verification -> Complete -> Double-Claim)
    // -------------------------------------------------------------------------
    console.log("--- Executing Test 5: Focus Lifecycle & Double-Claim Rejection ---");
    const startRes = await fetch(`${BASE_URL}/api/focus/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ duration: 25, task: "Security Audit Verification" }),
    });
    const startData = await startRes.json();
    const sessionId = startData.sessionId;

    const completeRes = await fetch(`${BASE_URL}/api/focus/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    const completeData = await completeRes.json();

    const replayRes = await fetch(`${BASE_URL}/api/focus/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    const replayData = await replayRes.json();

    assert(
      completeRes.status === 200 && completeData.xpEarned === 100 && replayRes.status === 409,
      "SEC-03 Focus Validated XP Award & Double-Claim Rejected (409)",
      `Complete Status: ${completeRes.status} (xpEarned: ${completeData.xpEarned}), Replay Status: ${replayRes.status} (${JSON.stringify(replayData)})`
    );

    // -------------------------------------------------------------------------
    // ATTACK 6: SEC-02 Quest IDOR & Idempotent Completion
    // -------------------------------------------------------------------------
    console.log("--- Executing Attack 6: Quest IDOR & Idempotency ---");
    const userBToken = "test_token_qa_user_beta";
    const questsARes = await fetch(`${BASE_URL}/api/quests`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const questsA = await questsARes.json();
    const targetQuest = questsA[0];

    // User B tries to complete User A's quest (IDOR)
    const idorRes = await fetch(`${BASE_URL}/api/quests/${targetQuest.id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const idorData = await idorRes.json();

    // User A completes their quest legitimately
    const legRes = await fetch(`${BASE_URL}/api/quests/${targetQuest.id}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userAToken}`,
        "idempotency-key": "qa_test_idem_001",
      },
    });
    const legData = await legRes.json();

    // User A completes the SAME quest again
    const dupRes = await fetch(`${BASE_URL}/api/quests/${targetQuest.id}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userAToken}`,
      },
    });
    const dupData = await dupRes.json();

    assert(
      idorRes.status === 403 && legRes.status === 200 && dupRes.status === 409 && dupData.code === "already_completed",
      "SEC-02 Quest IDOR Blocked (403) & Idempotent Double-Claim Rejected (409)",
      `IDOR Status: ${idorRes.status}, Legitimate Status: ${legRes.status}, Duplicate Status: ${dupRes.status} (${JSON.stringify(dupData)})`
    );

    // -------------------------------------------------------------------------
    // TEST 7: DATA-02 Recovery Day Execution
    // -------------------------------------------------------------------------
    console.log("--- Executing Test 7: DATA-02 Recovery Day Execution ---");
    // Seed user with 1 shield
    const storage = getStorage();
    const userA = await storage.getUserByFirebaseUid("qa_user_alpha");
    if (userA) {
      await storage.updateUser(userA.id, { streakShields: 2, streak: 5 });
    }

    const recovRes = await fetch(`${BASE_URL}/api/user/recovery-day`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const recovData = await recovRes.json();
    assert(
      recovRes.status === 200 && recovData.success === true,
      "DATA-02 Recovery Day Schema & Execution Validated (No 500 error)",
      `Status: ${recovRes.status}, Remaining Shields: ${recovData.remainingShields}, Message: ${recovData.message}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: FUNC-02 Evening Debrief Submission & Daily Lookup
    // -------------------------------------------------------------------------
    console.log("--- Executing Test 8: FUNC-02 Evening Debrief ---");
    const debriefDate = "2026-11-24";
    const debriefRes = await fetch(`${BASE_URL}/api/debrief`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        date: debriefDate,
        reflectionText: "Maintained rigorous focus protocol across all tactical operations today.",
        selfHonestyRating: 10,
        focusDensityScoreOfDay: 85,
      }),
    });
    const debriefData = await debriefRes.json();

    const debriefDupRes = await fetch(`${BASE_URL}/api/debrief`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        date: debriefDate,
        reflectionText: "Second submission on same day should be rejected.",
      }),
    });

    const debriefTodayRes = await fetch(`${BASE_URL}/api/debrief/today`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const debriefTodayData = await debriefTodayRes.json();

    assert(
      debriefRes.status === 200 && debriefDupRes.status === 409 && debriefTodayRes.status === 200,
      "FUNC-02 Evening Debrief Created & Duplicate Same-Day Submission Blocked (409)",
      `Initial Status: ${debriefRes.status}, Duplicate Status: ${debriefDupRes.status}, Today Lookup ID: ${debriefTodayData?.id}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Level Math Payload & Timezone Contract
    // -------------------------------------------------------------------------
    console.log("--- Executing Test 9: Level Math & Timezone Contract ---");
    const userFetchRes = await fetch(`${BASE_URL}/api/user`, {
      headers: {
        Authorization: `Bearer ${userAToken}`,
        "X-Timezone": "Asia/Kolkata",
      },
    });
    const userFetchData = await userFetchRes.json();
    assert(
      userFetchRes.status === 200 &&
      typeof userFetchData.xpIntoLevel === "number" &&
      typeof userFetchData.xpForNextLevel === "number" &&
      typeof userFetchData.xpProgress === "number",
      "Server-Driven Level Math Payload Contract Verified",
      `Level: ${userFetchData.level}, XP: ${userFetchData.xp}, xpIntoLevel: ${userFetchData.xpIntoLevel}, xpForNextLevel: ${userFetchData.xpForNextLevel}, xpProgress: ${userFetchData.xpProgress}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: In-App User Deletion (Play Store Requirement)
    // -------------------------------------------------------------------------
    console.log("--- Executing Test 10: In-App Account Deletion (Play Store Compliance) ---");
    const userDelToken = "test_token_user_to_be_deleted";
    // 1. First request to auto-provision user
    await fetch(`${BASE_URL}/api/user`, {
      headers: { Authorization: `Bearer ${userDelToken}` },
    });

    // 2. Delete user
    const delRes = await fetch(`${BASE_URL}/api/user`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userDelToken}` },
    });
    const delData = await delRes.json();

    // 3. Subsequent request with deleted UID token must be blocked with 403
    const postDelRes = await fetch(`${BASE_URL}/api/user`, {
      headers: { Authorization: `Bearer ${userDelToken}` },
    });
    const postDelData = await postDelRes.json();

    assert(
      delRes.status === 200 && postDelRes.status === 403 && postDelData.error.includes("deleted"),
      "In-App Account Deletion Executed & Deleted Account Permanently Blocked (403)",
      `DELETE Status: ${delRes.status} (${JSON.stringify(delData)}), Post-Delete Status: ${postDelRes.status} (${JSON.stringify(postDelData)})`
    );

  } finally {
    server.close();
  }

  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAttackSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
