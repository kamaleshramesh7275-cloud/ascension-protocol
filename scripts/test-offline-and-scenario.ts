/**
 * Test script for Offline Sync & Tactical Scenario Injector
 */
async function run() {
  const base = "http://localhost:5000";
  const testUid = `admin_tester_${Date.now()}`;
  console.log("🧪 Testing Scenario Injector & Offline Sync endpoints...");

  const headers = {
    "Content-Type": "application/json",
    "x-firebase-uid": testUid,
  };

  // 1. Register test user with correct schema
  const regRes = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      firebaseUid: testUid,
      name: "Tactical Admin",
      email: `admin_${Date.now()}@ascension.test`,
      avatarUrl: "https://avatar.vercel.sh/admin",
    }),
  });
  const regData = await regRes.json();
  console.log("✅ Registered operator:", regData);

  // 2. Test Offline Sync
  console.log("\n📡 Testing POST /api/focus-sessions/air-gap/sync-offline...");
  const syncRes = await fetch(`${base}/api/focus-sessions/air-gap/sync-offline`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      sessions: [
        {
          declarationOutput: "Offline Kernel Module Compilation",
          obstaclePreMortem: "Total Air-Gap Isolation",
          scheduledMinutes: 45,
          actualMinutes: 45,
          status: "completed",
          breachesCount: 0,
        },
      ],
      breaches: [
        {
          details: "Offline tab boundary crossed",
          type: "visibility_lost",
          penalty: 15,
        },
      ],
    }),
  });
  const syncData = await syncRes.json();
  console.log("✅ Sync result:", syncData);
  if (!syncData.success || syncData.syncedSessions !== 1 || syncData.syncedBreaches !== 1) {
    throw new Error("Offline sync failed verification!");
  }

  // 3. Test Scenario Injector: defector_liquidation
  console.log("\n💀 Testing Scenario: defector_liquidation...");
  const defRes = await fetch(`${base}/api/protocol/scenario-inject`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scenarioType: "defector_liquidation" }),
  });
  const defData = await defRes.json();
  console.log("✅ Defector liquidation result:", defData);
  if (!defData.success) throw new Error("Defector liquidation failed!");

  // 4. Test Scenario Injector: court_decree
  console.log("\n⚖️ Testing Scenario: court_decree...");
  const courtRes = await fetch(`${base}/api/protocol/scenario-inject`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scenarioType: "court_decree" }),
  });
  const courtData = await courtRes.json();
  console.log("✅ Court decree result:", courtData);
  if (!courtData.success) throw new Error("Court decree failed!");

  // 5. Test Scenario Injector: reset_mission
  console.log("\n🔄 Testing Scenario: reset_mission...");
  const resetRes = await fetch(`${base}/api/protocol/scenario-inject`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scenarioType: "reset_mission" }),
  });
  const resetData = await resetRes.json();
  console.log("✅ Reset mission result:", resetData);
  if (!resetData.success) throw new Error("Reset mission failed!");

  console.log("\n🎉 ALL SCENARIO & OFFLINE ENDPOINTS VERIFIED 100% OPERATIONAL!");
}

run().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
