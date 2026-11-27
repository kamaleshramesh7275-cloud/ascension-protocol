import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Download, RefreshCw, Shield, Users, Cpu, Sliders,
  Bug, Send, History, Eye, Ban, Sparkles, CheckCircle2, AlertTriangle, Loader2
} from "lucide-react";

function getAdminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-admin-password": sessionStorage.getItem("adminPassword") || "",
  };
}

async function adminFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...getAdminHeaders(), ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function shiftYmd(ymd: string, delta: number): string {
  const dt = new Date(`${ymd}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/**
 * 1. Day-by-Day Command Pulse (Entire-Day Snapshot + Day Switcher + Retention Cohorts)
 */
export function MasterPulseView() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [userSearch, setUserSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/master/analytics/retention", selectedDate],
    queryFn: () => adminFetch(`/api/admin/master/analytics/retention?date=${selectedDate}`),
  });

  const loggedIn = (data?.loggedInUsers || []).filter((u: any) =>
    !userSearch.trim() ||
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const summary = data?.daySummary || {};

  return (
    <div className="space-y-6">
      {/* Day Switcher Bar */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(shiftYmd(selectedDate, -1))}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev Day
            </Button>
            <Input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="w-44 bg-black border-zinc-700 text-white"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDate >= today}
              onClick={() => setSelectedDate(shiftYmd(selectedDate, 1))}
            >
              Next Day <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            {selectedDate !== today && (
              <Button variant="secondary" size="sm" onClick={() => setSelectedDate(today)}>
                Jump to Today
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Day
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-purple-400" /></div>
      ) : (
        <>
          {/* Full-Day KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Logged In (Full Day)" value={summary.dau ?? 0} sub={`New: ${summary.newSignups ?? 0} • Returning: ${summary.returningUsers ?? 0}`} />
            <StatCard label="WAU / MAU" value={`${summary.wau ?? 0} / ${summary.mau ?? 0}`} sub={`Stickiness: ${summary.stickinessPct ?? 0}%`} />
            <StatCard label="Activity That Day" value={`${summary.questsCompleted ?? 0} Quests`} sub={`${summary.focusMinutes ?? 0}m Focus • ${summary.workoutsLogged ?? 0} Workouts`} />
            <StatCard label="AI & Health That Day" value={`${summary.aiCalls ?? 0} AI Calls`} sub={`Errors: ${summary.aiErrors ?? 0} • Penalty: ${data?.retentionSignals?.penaltyZoneUsers ?? 0}`} />
          </div>

          {/* Onboarding Funnel */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Onboarding & Retention Signals</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-zinc-400">Total Users:</span> <strong className="text-white">{data?.onboardingFunnel?.totalSignups ?? 0}</strong></div>
              <div><span className="text-zinc-400">Onboarded:</span> <strong className="text-green-400">{data?.onboardingFunnel?.completedOnboarding ?? 0} ({data?.onboardingFunnel?.onboardingPct ?? 0}%)</strong></div>
              <div><span className="text-zinc-400">Habit-Active:</span> <strong className="text-cyan-400">{data?.onboardingFunnel?.activeHabitUsers ?? 0}</strong></div>
              <div><span className="text-zinc-400">Comeback Gate Active:</span> <strong className="text-amber-400">{data?.retentionSignals?.comebackGateActive ?? 0}</strong></div>
            </CardContent>
          </Card>

          {/* Users Logged In On Selected Date */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Hunters Active on {selectedDate} ({loggedIn.length})</CardTitle>
                <CardDescription>Complete list of everyone logged in or active during this entire day</CardDescription>
              </div>
              <Input
                placeholder="Search name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-60 bg-black border-zinc-700"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hunter</TableHead>
                    <TableHead>Rank / Lv</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loggedIn.slice(0, 50).map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-zinc-400">{u.email}</div>
                      </TableCell>
                      <TableCell>{u.tier} • Lv.{u.level}</TableCell>
                      <TableCell className="capitalize">{u.hunterClass}</TableCell>
                      <TableCell>{u.streak}d</TableCell>
                      <TableCell>
                        <Badge variant={u.isNewUser ? "default" : "secondary"}>
                          {u.isNewUser ? "NEW" : "RETURNING"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.inPenaltyZone ? (
                          <Badge variant="destructive">PENALTY</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-400 border-green-700">ACTIVE</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {loggedIn.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 py-6">No logged-in users recorded on {selectedDate}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Retention Cohort Matrix */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Signup Cohort Retention (D1 / D3 / D7 / D14 / D30)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Cohort Size</TableHead>
                    <TableHead>D1</TableHead>
                    <TableHead>D3</TableHead>
                    <TableHead>D7</TableHead>
                    <TableHead>D14</TableHead>
                    <TableHead>D30</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.cohorts || []).map((c: any) => (
                    <TableRow key={c.cohortDate}>
                      <TableCell className="font-mono text-xs">{c.cohortDate}</TableCell>
                      <TableCell>{c.size}</TableCell>
                      {[c.d1, c.d3, c.d7, c.d14, c.d30].map((v, idx) => (
                        <TableCell key={idx}>
                          {v === null ? <span className="text-zinc-600">—</span> : <span className="text-cyan-300 font-semibold">{v}%</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * 2. Progress, Feature Adoption & Per-User Matrix + 360° Dossier / Override Modal
 */
export function MasterProgressMatrixView() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [overrideCoins, setOverrideCoins] = useState("");
  const [overrideLevel, setOverrideLevel] = useState("");

  const { data: progress } = useQuery({
    queryKey: ["/api/admin/master/analytics/progress"],
    queryFn: () => adminFetch("/api/admin/master/analytics/progress"),
  });

  const { data: usage } = useQuery({
    queryKey: ["/api/admin/master/analytics/usage"],
    queryFn: () => adminFetch("/api/admin/master/analytics/usage"),
  });

  const { data: matrixData, isLoading: loadingMatrix } = useQuery({
    queryKey: ["/api/admin/master/analytics/user-feature-matrix", search, page],
    queryFn: () => adminFetch(`/api/admin/master/analytics/user-feature-matrix?search=${encodeURIComponent(search)}&page=${page}&limit=20`),
  });

  const { data: dossier } = useQuery({
    queryKey: ["/api/admin/master/users/dossier", inspectUserId],
    enabled: !!inspectUserId,
    queryFn: () => adminFetch(`/api/admin/master/users/${inspectUserId}/dossier`),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: any }) =>
      adminFetch(`/api/admin/master/users/${userId}/override`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/master/users/dossier", inspectUserId] });
      qc.invalidateQueries({ queryKey: ["/api/admin/master/analytics/user-feature-matrix"] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Global Progress & Economy */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Avg Level / XP" value={`Lv.${progress?.avgLevel ?? 0}`} sub={`${progress?.avgXp ?? 0} avg XP • ${progress?.avgStreak ?? 0}d streak`} />
        <StatCard label="Evolved Classes" value={progress?.evolvedCount ?? 0} sub={`Out of ${progress?.totalUsers ?? 0} Hunters`} />
        <StatCard label="Coins in Circulation" value={usage?.economy?.totalCoinsInCirculation ?? 0} sub={`Avg ${usage?.economy?.avgCoinsPerUser ?? 0}/user`} />
        <StatCard label="Focus Breach Rate" value={`${usage?.focusHealth?.breachRatePct ?? 0}%`} sub={`${usage?.focusHealth?.totalMinutes ?? 0} total verified mins`} />
      </div>

      {/* Rank Distribution */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader><CardTitle className="text-base">Rank Tier Distribution (D → S)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(progress?.tierCounts || {}).map(([tier, count]) => (
            <div key={tier} className="px-4 py-2 rounded-lg bg-black/60 border border-zinc-800 text-sm">
              <span className="text-cyan-400 font-bold">Rank {tier}:</span> <span className="text-white font-semibold">{String(count)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Global Feature Adoption */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader><CardTitle className="text-base">Every Feature Adoption & Total Usage</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Unique Users</TableHead>
                <TableHead>Adoption %</TableHead>
                <TableHead>Total Uses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usage?.featureStats || []).map((f: any) => (
                <TableRow key={f.feature}>
                  <TableCell className="font-medium text-white">{f.feature}</TableCell>
                  <TableCell>{f.uniqueUsers}</TableCell>
                  <TableCell><Badge variant="outline">{f.adoptionPct}%</Badge></TableCell>
                  <TableCell>{f.totalUses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-User x Per-Feature Usage Matrix */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Per-User × Feature Usage Matrix ({matrixData?.total ?? 0})</CardTitle>
            <CardDescription>Click Inspect to open 360° Hunter Dossier & Master Overrides</CardDescription>
          </div>
          <Input
            placeholder="Filter by name/email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-60 bg-black border-zinc-700"
          />
        </CardHeader>
        <CardContent>
          {loadingMatrix ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hunter</TableHead>
                    <TableHead>Lv/Rank</TableHead>
                    <TableHead>Quests</TableHead>
                    <TableHead>Focus</TableHead>
                    <TableHead>Workouts</TableHead>
                    <TableHead>Shadows</TableHead>
                    <TableHead>Endgame</TableHead>
                    <TableHead>Guild</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(matrixData?.matrix || []).map((row: any) => (
                    <TableRow key={row.userId}>
                      <TableCell>
                        <div className="font-medium text-white">{row.name}</div>
                        <div className="text-xs text-zinc-400">{row.email}</div>
                      </TableCell>
                      <TableCell>{row.tier} • Lv.{row.level}</TableCell>
                      <TableCell>{row.questsCompleted}</TableCell>
                      <TableCell>{row.focusSessions} ({row.focusMinutes}m)</TableCell>
                      <TableCell>{row.workouts}</TableCell>
                      <TableCell>{row.shadowsExtracted}</TableCell>
                      <TableCell className="text-xs">
                        {[
                          row.doubleDungeonUsed ? "DD" : null,
                          row.reawakeningUsed ? "RW" : null,
                          row.monarchDomainUsed ? "MD" : null,
                        ].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>{row.guildJoined ? "Yes" : "No"}</TableCell>
                      <TableCell>{row.feedbackSubmitted}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setInspectUserId(row.userId)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={(matrixData?.matrix?.length || 0) < 20} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>

      {/* 360 Dossier & Master Override Modal */}
      <Dialog open={!!inspectUserId} onOpenChange={(o) => !o && setInspectUserId(null)}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>360° Hunter Dossier & Master Override</DialogTitle>
          </DialogHeader>
          {dossier?.user ? (
            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-bold text-base">{dossier.user.name} ({dossier.user.tier}-Rank • Lv.{dossier.user.level})</div>
                  <div className="text-zinc-400 text-xs">{dossier.user.email} • Coins: {dossier.user.coins} • Streak: {dossier.user.streak}d</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => overrideMutation.mutate({ userId: dossier.user.id, payload: { action: "clear_penalty" } })}>
                    Clear Penalty
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => overrideMutation.mutate({ userId: dossier.user.id, payload: { action: "reset_cooldowns" } })}>
                    Reset Cooldowns
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => overrideMutation.mutate({ userId: dossier.user.id, payload: { action: dossier.user.role === "banned" ? "unban_user" : "ban_user" } })}>
                    <Ban className="w-3.5 h-3.5 mr-1" /> {dossier.user.role === "banned" ? "Unban" : "Ban"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <Input placeholder="Set Coins" value={overrideCoins} onChange={(e) => setOverrideCoins(e.target.value)} className="bg-black border-zinc-700" />
                  <Button size="sm" onClick={() => overrideCoins && overrideMutation.mutate({ userId: dossier.user.id, payload: { fields: { coins: Number(overrideCoins) } } })}>Apply</Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Set Level" value={overrideLevel} onChange={(e) => setOverrideLevel(e.target.value)} className="bg-black border-zinc-700" />
                  <Button size="sm" onClick={() => overrideLevel && overrideMutation.mutate({ userId: dossier.user.id, payload: { fields: { level: Number(overrideLevel) } } })}>Apply</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {["igris", "tank", "iron", "beru"].map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => overrideMutation.mutate({ userId: dossier.user.id, payload: { action: "grant_shadow", shadowId: s } })}>
                    <Sparkles className="w-3 h-3 mr-1" /> Grant {s.toUpperCase()}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs bg-zinc-900/60 p-3 rounded-lg">
                <div>Quests Done: <strong>{dossier.summary.questsCompleted}/{dossier.summary.questsTotal}</strong></div>
                <div>Focus: <strong>{dossier.summary.focusSessionsCount} ({dossier.summary.focusMinutesTotal}m)</strong></div>
                <div>Workouts: <strong>{dossier.summary.workoutsCount}</strong></div>
                <div>Debriefs: <strong>{dossier.summary.debriefsCount}</strong></div>
                <div>Feedback: <strong>{dossier.summary.feedbackCount}</strong></div>
                <div>Shadows: <strong>{(dossier.user.extractedShadows || []).join(", ") || "None"}</strong></div>
              </div>
            </div>
          ) : (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * 3. AI Usage, Remaining Quotas & Client Error Diagnostics
 */
export function MasterAiLimitsView() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/master/analytics/limits"],
    queryFn: () => adminFetch("/api/admin/master/analytics/limits"),
  });

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" /> Refresh Quotas</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="AI Calls Today" value={data?.aiSummary?.callsToday ?? 0} sub={`7d Total: ${data?.aiSummary?.calls7d ?? 0}`} />
        <StatCard label="AI Errors Today" value={data?.aiSummary?.errorsToday ?? 0} sub="Fallback/provider failures" />
        <StatCard label="Active Cooldowns" value={(data?.activeCooldowns?.doubleDungeonActive ?? 0) + (data?.activeCooldowns?.monarchDomainActive ?? 0)} sub={`Guild CDs: ${data?.activeCooldowns?.guildCooldownUsers ?? 0}`} />
        <StatCard label="Feedback Cap" value={`${data?.limits?.dailyFeedbackLimit ?? 5}/day`} sub={`User AI Cap: ${data?.limits?.aiDailyCapPerUser ?? 2}/DAU`} />
      </div>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader><CardTitle className="text-base">AI Provider Quotas & Remaining Headroom</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Calls Today</TableHead>
                <TableHead>Remaining Today</TableHead>
                <TableHead>7d Calls</TableHead>
                <TableHead>7d Errors</TableHead>
                <TableHead>Avg Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.aiSummary?.providerStats || []).map((p: any) => (
                <TableRow key={p.provider}>
                  <TableCell className="font-bold uppercase text-cyan-300">{p.provider}</TableCell>
                  <TableCell>{p.callsToday}</TableCell>
                  <TableCell className="text-green-400 font-semibold">{p.remainingToday} / {p.capPerDay}</TableCell>
                  <TableCell>{p.calls7d}</TableCell>
                  <TableCell>{p.errors7d}</TableCell>
                  <TableCell>{p.avgLatencyMs} ms</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader><CardTitle className="text-base">Recent Client Error Diagnostics (from Bug Reports)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(data?.recentClientErrors || []).length === 0 ? (
            <div className="text-sm text-zinc-500">No client error logs attached yet.</div>
          ) : (
            (data?.recentClientErrors || []).map((item: any) => (
              <div key={item.feedbackId} className="p-3 rounded-lg bg-black/50 border border-zinc-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-red-400">{item.title}</span>
                  <span className="text-zinc-400">{item.userName} • {item.os} • v{item.appVersion}</span>
                </div>
                {item.recentErrors.slice(0, 3).map((e: any, i: number) => (
                  <div key={i} className="font-mono text-zinc-300">[{e.statusCode || "ERR"}] {e.endpoint || ""} — {e.message}</div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 4. Master Controls, Live Feature Flags, Multipliers & 1-Click JSON/CSV Export
 */
export function MasterControlsExportView() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/admin/master/config"],
    queryFn: () => adminFetch("/api/admin/master/config"),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: any) =>
      adminFetch("/api/admin/master/config", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/master/config"] }),
  });

  const downloadExport = async (scope: string, format: "json" | "csv") => {
    const res = await fetch(`/api/admin/master/export?scope=${scope}&format=${format}`, {
      headers: getAdminHeaders(),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascension_${scope}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !config) return <div className="py-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Global Switches */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Global System Switches</CardTitle>
          <CardDescription>Instant live controls — no server redeploy required</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant={config.maintenanceMode ? "destructive" : "outline"}
            onClick={() => updateMutation.mutate({ maintenanceMode: !config.maintenanceMode })}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Maintenance Mode: {config.maintenanceMode ? "ON" : "OFF"}
          </Button>
          <Button
            variant={config.aiCoachingEnabled ? "default" : "outline"}
            onClick={() => updateMutation.mutate({ aiCoachingEnabled: !config.aiCoachingEnabled })}
          >
            <Cpu className="w-4 h-4 mr-2" />
            AI Coaching: {config.aiCoachingEnabled ? "ENABLED" : "PAUSED"}
          </Button>
          <Button
            variant={config.signupsEnabled ? "default" : "outline"}
            onClick={() => updateMutation.mutate({ signupsEnabled: !config.signupsEnabled })}
          >
            <Users className="w-4 h-4 mr-2" />
            Signups: {config.signupsEnabled ? "OPEN" : "CLOSED"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => updateMutation.mutate({ multipliers: { ...config.multipliers, xpMultiplier: config.multipliers.xpMultiplier === 2 ? 1 : 2 } })}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            XP Event Multiplier: {config.multipliers?.xpMultiplier ?? 1}x
          </Button>
        </CardContent>
      </Card>

      {/* Feature Flags Matrix */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader><CardTitle className="text-base">Feature Kill-Switches</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(config.featureFlags || {}).map(([flag, enabled]) => (
            <Button
              key={flag}
              size="sm"
              variant={enabled ? "default" : "outline"}
              className="justify-between"
              onClick={() => updateMutation.mutate({ featureFlags: { [flag]: !enabled } })}
            >
              <span className="truncate">{flag}</span>
              <span>{enabled ? "ON" : "OFF"}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* 1-Click Data Export for Product Development */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Full Product-Development Data Export (JSON / CSV)</CardTitle>
          <CardDescription>Export complete analytics, per-user feature matrices, feedback, AI quotas & audit logs</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { scope: "all", label: "Complete System Snapshot" },
            { scope: "user_feature_matrix", label: "Per-User × Feature Matrix" },
            { scope: "feedback", label: "All Feedback & Bug Diagnostics" },
            { scope: "ai_limits", label: "AI Provider Usage Logs" },
            { scope: "audit_logs", label: "Admin Audit Logs" },
          ].map((item) => (
            <div key={item.scope} className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-zinc-800">
              <span className="text-sm font-medium text-white">{item.label}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadExport(item.scope, "json")}>
                  <Download className="w-3.5 h-3.5 mr-1" /> JSON
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadExport(item.scope, "csv")}>
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 5. Feedback & Bug Triage View
 */
export function MasterFeedbackTriageView() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/feedback"],
    queryFn: () => adminFetch("/api/admin/feedback"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status?: string; adminNotes?: string }) =>
      adminFetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/feedback"] }),
  });

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-purple-400" /></div>;

  const items = data?.items || [];
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-base">User Feedback, Bugs & Feature Requests ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <div className="text-sm text-zinc-500">No feedback submissions yet.</div>}
        {items.map((item: any) => (
          <div key={item.id} className="p-4 rounded-lg bg-black/50 border border-zinc-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={item.type === "bug" ? "destructive" : "default"}>{item.type.toUpperCase()}</Badge>
                <Badge variant="outline">{item.category}</Badge>
                <span className="font-bold text-white">{item.title}</span>
              </div>
              <Select
                value={item.status}
                onValueChange={(status) => updateMutation.mutate({ id: item.id, status })}
              >
                <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open", "reviewed", "planned", "resolved", "declined"].map((s) => (
                    <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-zinc-300">{item.description}</p>
            <div className="text-xs text-zinc-500">Submitted by {item.userName} • Upvotes: {item.upvoteCount}</div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Write admin response visible to user..."
                value={notes[item.id] ?? item.adminNotes ?? ""}
                onChange={(e) => setNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                className="bg-zinc-900 border-zinc-700 text-xs"
              />
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ id: item.id, adminNotes: notes[item.id] ?? item.adminNotes ?? "" })}
              >
                Save Note
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * 6. All-User & Segmented Push Broadcast + Admin Audit Log
 */
export function MasterPushAuditView() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("all");
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const { data: auditData } = useQuery({
    queryKey: ["/api/admin/master/audit-logs"],
    queryFn: () => adminFetch("/api/admin/master/audit-logs"),
  });

  const broadcastMutation = useMutation({
    mutationFn: () =>
      adminFetch("/api/admin/master/push-broadcast", {
        method: "POST",
        body: JSON.stringify({ title, body, segment }),
      }),
    onSuccess: (res) => {
      setResultMsg(`Sent to ${res.targetedUsers} users (In-App: ${res.inAppCreated}, Push: ${res.pushSent}, Failed: ${res.pushFailed})`);
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["/api/admin/master/audit-logs"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base">Send Push & In-App Notification to All Users / Segments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Notification Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black border-zinc-700" />
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger className="bg-black border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active_today">Active Today</SelectItem>
                <SelectItem value="inactive_3d">Inactive 3+ Days</SelectItem>
                <SelectItem value="penalty_zone">In Penalty Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Message Body" value={body} onChange={(e) => setBody(e.target.value)} className="bg-black border-zinc-700" />
          <div className="flex items-center gap-3">
            <Button disabled={!title || !body || broadcastMutation.isPending} onClick={() => broadcastMutation.mutate()}>
              <Send className="w-4 h-4 mr-2" /> Dispatch Broadcast
            </Button>
            {resultMsg && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {resultMsg}</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader><CardTitle className="text-base">Immutable Admin Audit Log</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(auditData?.logs || []).slice(0, 50).map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono text-zinc-400">{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{log.targetUserId || "GLOBAL"}</TableCell>
                  <TableCell className="text-xs text-zinc-300">{log.note || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardContent className="p-4">
        <div className="text-xs text-zinc-400 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-white mt-1">{value}</div>
        <div className="text-xs text-zinc-400 mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}
