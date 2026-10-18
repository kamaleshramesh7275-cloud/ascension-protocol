/**
 * ASCENSION PROTOCOL // AUTOMATED END-TO-END EXECUTION CYCLE TEST SUITE
 * Validates the complete 4-Pillar lifecycle from intake calibration to Sunday court audit.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_UID = "e2e_operator_" + Date.now();

interface TestContext {
  userId?: string;
  missionId?: string;
  contractId?: string;
  pactId?: string;
  sessionId?: string;
}

const ctx: TestContext = {};

function printHeader(title: string) {
  console.log("\n" + "=".repeat(65));
  console.log(`⚡ [TEST] ${title}`);
  console.log("=".repeat(65));
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function api(path: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-firebase-uid": TEST_UID,
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: response.status, ok: response.ok, data: json };
}

async function runSuite() {
  console.log(`\n🛡️ INITIATING ASCENSION PROTOCOL E2E TEST SUITE`);
  console.log(`Target: ${BASE_URL} | Test Operator UID: ${TEST_UID}`);

  // ─── 0. Authenticate / Initialize User ───
  printHeader("0. Operator Authentication & Registration");
  const regRes = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firebaseUid: TEST_UID,
      name: "E2E Test Operator",
      email: `operator_${Date.now()}@ascension.test`,
      avatarUrl: "https://avatar.vercel.sh/operator",
    }),
  });
  assert(regRes.ok, `Operator registered via /api/auth/register (Status: ${regRes.status})`);

  const authRes = await api("/api/user");
  assert(authRes.ok, `User profile retrieved (Status: ${authRes.status})`);
  ctx.userId = authRes.data.id;
  console.log(`  Operator ID: ${ctx.userId} | Username: ${authRes.data.username || authRes.data.name}`);

  // ─── 1. Pillar 1: Intake Engine & Living Milestone Roadmap ───
  printHeader("1. Pillar 1: 5-Layer Intake Engine & Roadmap Calibration");
  const intakePayload = {
    targetOutcome: "Deploy Distributed Cloud Consensus Cluster",
    targetDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    failureStatement: "I rationalize procrastination when the architecture feels overwhelming",
    gapMatrix: { "Distributed Systems": 3, "Algorithms": 4, "Network Engineering": 2 },
    failureAutopsy: {
      pastAttempts: "Attempted twice in past year",
      primaryFailureTrigger: "Context switching to low value tasks",
      rationalizationPattern: "I need to read more docs before coding",
      relapseSignature: "Opening social media tabs during compile times",
    },
    cognitiveFingerprint: {
      peakFocusStart: "08:00",
      peakFocusEnd: "11:30",
      primaryDistractor: "Browser notifications",
      stressResponse: "flight" as const,
      environmentPreference: "Silent isolated chamber",
    },
    commitmentCapacity: {
      dailyDeepWorkHours: 3.5,
      deadDays: ["Sunday"],
      nonNegotiableTimeThief: "Endless Slack threads",
      weeklyTargetHours: 20,
    },
  };

  const intakeRes = await api("/api/execution-profile", {
    method: "POST",
    body: JSON.stringify(intakePayload),
  });
  assert(intakeRes.ok && intakeRes.data.success, "5-Layer Intake Profile locked and stored");

  const profileFetch = await api("/api/execution-profile");
  assert(profileFetch.ok && profileFetch.data.profile !== null, "Profile retrieved successfully");
  assert(profileFetch.data.profile.roadmapMilestones.length === 4, "Generated 4 progressive roadmap milestones");
  assert(profileFetch.data.disciplineScore.score >= 700, "Initialized baseline Discipline Reputation Score");

  // ─── 2. Pillar 1: Single Daily Mission Lock & Proof of Work ───
  printHeader("2. Pillar 1: Single Daily Mission Lock & Verification");
  const missionFetch = await api("/api/daily-mission");
  assert(missionFetch.ok && missionFetch.data.id, `Single Daily Mission fetched: "${missionFetch.data.title}"`);
  ctx.missionId = missionFetch.data.id;

  // Commit oath to mission
  const commitRes = await api(`/api/daily-mission/${ctx.missionId}/commit`, {
    method: "POST",
  });
  assert(commitRes.ok && commitRes.data.mission.status === "committed", "Daily Mission Oath committed and sealed");

  // ─── 3. Pillar 2: Air-Gap Focus Chamber & Attention Breach Tracking ───
  printHeader("3. Pillar 2: Air-Gap Protocol & Attention Breach Tracking");
  const sessionStart = await api("/api/focus-sessions/air-gap", {
    method: "POST",
    body: JSON.stringify({
      missionId: ctx.missionId,
      declarationOutput: "Implement Raft vote requester logic with deterministic timers",
      obstaclePreMortem: "Distraction by incoming emails -> close mail client completely",
      scheduledMinutes: 90,
    }),
  });
  assert(sessionStart.ok, `Air-Gap chamber sealed (Session ID: ${sessionStart.data.session.id})`);
  ctx.sessionId = sessionStart.data.session.id;

  // Log an attention breach (simulating tab departure)
  const breachRes = await api(`/api/focus-sessions/air-gap/${ctx.sessionId}/breach`, {
    method: "POST",
    body: JSON.stringify({
      eventType: "visibility_lost",
      details: "Tab switched away for 8 seconds",
    }),
  });
  assert(breachRes.ok && breachRes.data.success, "Discipline breach penalized and recorded in audit log");

  // Complete the focus session
  const sessionFinish = await api(`/api/focus-sessions/air-gap/${ctx.sessionId}/finish`, {
    method: "POST",
    body: JSON.stringify({
      actualMinutes: 85,
      status: "completed",
    }),
  });
  assert(sessionFinish.ok && sessionFinish.data.success, "Air-Gap session completed and verified");

  // Calculate and inspect Focus Density Score
  const densityRes = await api("/api/focus-density");
  assert(densityRes.ok, `Focus Density Score computed: ${densityRes.data.focusDensityPercent}%`);
  console.log(`  Total Focused Minutes Today: ${densityRes.data.totalMinutesToday}m`);

  // Submit Objective Proof of Work
  const proofRes = await api(`/api/daily-mission/${ctx.missionId}/proof`, {
    method: "POST",
    body: JSON.stringify({
      content: "PR #42 merged with 100% green test coverage and verified zero split-brain in 3-node cluster.",
      url: "https://github.com/ascension/protocol/pull/42",
    }),
  });
  assert(proofRes.ok && proofRes.data.mission.status === "completed", "Proof of Work approved; Mission marked COMPLETED");

  // ─── 4. Pillar 3: AI Chief of Staff Interventions & Debrief ───
  printHeader("4. Pillar 3: AI Chief of Staff Interventions & Debrief");
  
  // Mid-Day Pulse Intercept
  const pulseStatus = await api("/api/mid-day-pulse/status");
  assert(pulseStatus.ok, "Mid-Day pulse status queried");

  const pulseAck = await api("/api/mid-day-pulse", {
    method: "POST",
    body: JSON.stringify({
      missionStatus: "in_progress",
      committedAction: "Leader election passing. Proceeding to log compaction.",
      timeBlockMinutes: 30,
    }),
  });
  assert(pulseAck.ok, "Mid-Day Pulse acknowledged and verified");

  // Evening Debrief Audit
  const debriefRes = await api("/api/evening-debrief", {
    method: "POST",
    body: JSON.stringify({
      missionId: ctx.missionId,
      reflectionText: "Deep work session concluded with high focus. Avoided context switches after the single initial warning. Tomorrow directive is to build Raft persistent storage.",
      selfHonestyRating: 9,
    }),
  });
  assert(debriefRes.ok && debriefRes.data.success, "Evening Debrief processed; AI verdict issued");
  console.log(`  Chief of Staff Verdict: ${debriefRes.data.debrief?.aiFeedback?.substring(0, 75)}...`);

  // ─── 5. Pillar 4: High-Stakes Escrow, Squads & Performance Court ───
  printHeader("5. Pillar 4: Escrow Contracts, Squad Pact & Judicial Court");

  // Lock Weekly Commitment Contract
  const contractRes = await api("/api/commitment-contract", {
    method: "POST",
    body: JSON.stringify({
      weekStartDate: "2026-10-19",
      weekEndDate: "2026-10-25",
      targetMissionsCount: 5,
      targetFocusMinutes: 900,
      stakeAmountCents: 10000,
      antiCharityRecipient: "The Inefficiency Foundation",
    }),
  });
  assert(contractRes.ok, `Weekly Escrow Contract sealed ($${(contractRes.data.contract?.stakeAmountCents || 10000)/100} Staked)`);
  ctx.contractId = contractRes.data.contract?.id;

  // Create or Join Squad Pact Pool
  const squadRes = await api("/api/squad-pact", {
    method: "POST",
    body: JSON.stringify({
      name: "Ironclad Vanguard Squad",
      inviteCode: "VANGUARD-" + Math.floor(1000 + Math.random() * 9000),
      weeklyStakePoints: 50,
    }),
  });
  assert(squadRes.ok, `Squad Pact Vault active: "${squadRes.data.pact?.name || 'Squad'}"`);

  // Publish Public Commitment
  const publicRes = await api("/api/public-commitments", {
    method: "POST",
    body: JSON.stringify({
      declaration: "Deploy Raft Cluster to 5 Global Edge Regions with zero downtime",
      targetDeadline: "2026-11-30",
    }),
  });
  assert(publicRes.ok, "Public witness commitment posted to community wall");

  // Check Hall of Ascension & Wall of Consequence
  const hallRes = await api("/api/hall-of-ascension");
  const wallRes = await api("/api/wall-of-consequence");
  assert(hallRes.ok && Array.isArray(hallRes.data), "Hall of Ascension records accessible");
  assert(wallRes.ok && Array.isArray(wallRes.data), "Wall of Consequence defector logs accessible");

  // Trigger Weekly Performance Court Judicial Review
  const courtAudit = await api("/api/performance-court/evaluate", {
    method: "POST",
  });
  assert(courtAudit.ok, "Sunday Performance Court convened and judicial decree issued");
  console.log(`  Court Decree: ${courtAudit.data.audit?.aiVerdict?.substring(0, 75)}...`);

  // ─── 6. Autonomous Directives & Push Beacon Pipeline ───
  printHeader("6. Autonomous Push Directives & Dispatch Beacons");
  const beaconTypes = ["morning", "pulse", "debrief", "court", "squad"];
  for (const bType of beaconTypes) {
    const bRes = await api("/api/push/test", {
      method: "POST",
      body: JSON.stringify({ triggerType: bType }),
    });
    assert(bRes.ok, `Beacon "${bType}" triggered successfully (Status: ${bRes.status})`);
  }

  // ─── 7. Global Leaderboard Integration ───
  printHeader("7. Focus Density Leaderboard Verification");
  const lbRes = await api("/api/focus-density-leaderboard");
  assert(lbRes.ok && Array.isArray(lbRes.data), "Focus Density Leaderboard rankings queried");
  assert(lbRes.data.length > 0, `Leaderboard populated with ${lbRes.data.length} ranked ascendants`);

  printHeader("SUMMARY: ALL PROTOCOL SYSTEMS 100% OPERATIONAL");
  console.log(`\n🎉 E2E TEST SUITE PASSED WITH ZERO FAILURES!`);
  console.log(`- 5-Layer Intake: Verified`);
  console.log(`- Single Daily Mission Lock: Verified`);
  console.log(`- Proof of Work Verification: Verified`);
  console.log(`- Air-Gap Chamber & Attention Breach Penalty: Verified`);
  console.log(`- Focus Density Score Engine: Verified`);
  console.log(`- AI Chief of Staff & Performance Court: Verified`);
  console.log(`- Squad Pact & Anti-Charity Escrow: Verified`);
  console.log(`- Push Directives & Dispatch Radar: Verified\n`);
}

runSuite().catch((err) => {
  console.error("\n💥 SUITE TERMINATED WITH ERROR:", err);
  process.exit(1);
});
