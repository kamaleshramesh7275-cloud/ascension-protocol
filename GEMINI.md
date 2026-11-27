# Ascension Protocol — Feature Roadmap v2

> Project: **Ascension Protocol** (real-life Solo Leveling gamified productivity app: Node/Express + TS + PostgreSQL + Flutter Android).
> Always active project memory — use verbatim as context for all future work on this project.

## Already built (never re-suggest)
Hunter classes + briefing; AI 4-week roadmap with AHEAD/ON_TRACK/DRIFT status; 5 cached AI features (focus deliverable review + next micro-step, continuity daily quests, custom workout split builder, Stuck? 5M step, Sunday weekly audit); Focus Sanctum with breach tracking; workout logger + auto-overload; evening debrief + anti-burnout; knowledge library; Android widget; XP/levels/ranks D-S, 7-stat radar, rank trials; Shadow Army (Igris, Tank, Iron, Beru; 3 max); Gates + Penalty Zone; Armory shop; rival divisions, contracts, buddy covenants, witness wall, License Card, Weekly Dossier. Guilds, Guild Wars, Gangs, Citadel, Partner Chat exist in the backend only (no Flutter UI).
Constraint: <=1-2 extra cached AI calls per DAU; prefer deterministic rules + client UX.

## Top 5 weakest spots
1. Day-7 cliff: self-reported, linear XP, no stakes or weekly suspense.
2. No signature Solo Leveling moments (no Daily Quest ultimatum, ARISE, job change); reads as a themed checklist.
3. Shadow Army is passive, with no capture fight.
4. Social is half-built (guild UI missing; rivals are only a leaderboard; viral loop is static PNGs).
5. No sensory layer (System voice, haptics, crit/loot); comeback after a missed day feels like a chore.

## Feature proposals (ranked by Impact x Feasibility)
1. **Daily Quest Ultimatum (Daily Quest/Penalty Zone)**: fixed 4-part morning quest (workout, focus minutes, debrief, anchor habit) with a countdown to 11:59 PM. A miss auto-triggers Penalty Zone next day; Mana Shield absorbs one miss. Red countdown, alarm SFX, haptics at T-1h, shareable "DAILY QUEST 4/4" card. 0 AI.
2. **System Window + Voice Layer**: global animated overlay (blue glass panel, scanlines, typewriter text) for quest complete, level-up, PR, rank-up, breach; pre-baked SFX stings + 3 haptic patterns; "share clip" button. 0 AI.
3. **ARISE Shadow Extraction**: boss-tier milestones (weekly deliverable, PR, 7-day streak) open an extraction: 10s no-exit focus hold; success odds weighted by verified minutes + WIL; first extraction guaranteed; failure partially refunds. Yields a shadow with a unique buff. Dark screen, purple smoke, rumble haptic, shareable reveal card. 0 AI, server-seeded RNG.
4. **Multi-Day Boss Raid HP Bar (Dungeon Keys)**: weekly roadmap phase = boss. Verified focus (INT) and workouts (STR) deal damage; missed days regenerate HP; defeat by Sunday for loot + Dossier. Home screen + widget HP bar. 0 AI.
5. **Job Change Questline (Necromancer awakening)**: at Lv ~15 + stat threshold, a hidden 5-7 day quest chain (e.g. 3x45m+ sessions at a set time, a no-breach sprint, a reflection) upgrades the class (Assassin to Shadow Assassin) with a new passive and avatar frame. Cinematic title card to share. 0 AI.
6. **Double Dungeon Commandments (Cartenon Temple)**: weekly 72h high-stakes dungeon; pick commandments (e.g. no breaches for 3 sessions, 6/7 workout days), stake coins; breaking a rule means loss + Penalty Zone. Extends Escrow/Contracts. Stone-tablet UI, "COMMANDMENT BROKEN" shake, Witness Wall post. 0 AI.
7. **Reawakening Rank Test**: proctored test day replaces the rank trial (max pushups, 25m zero-breach focus, shipped deliverable), scored vs baseline; rank revealed at the end. Gate-scanner animation, License Card update. 0 AI (optional 1x cached verdict).
8. **Guild Raids UI (backend exists)**: weekly shared boss HP bar fed by members' verified minutes; absentees weaken the guild bonus. Invite deep link, Discord embed card. 0 AI.
9. **Monarch's Domain**: weekly locked 4-hour block (3 sprints + a workout), special UI, ambient audio, 2x XP, ends on breach. Purple-black theme, time-lapse recap clip. 0 AI.
10. **Comeback Gate (Red Gate redemption)**: after 3+ inactive days, a Red Gate appears; a 10m sprint + one workout set restores 50% of the streak, with a System line ("Hunter. You are still alive."). 0 AI (optional 1x cached line).

## Quick wins (<3 days)
1. System Window overlay + SFX + haptics (#2)
2. Daily Quest countdown ultimatum (#1)
3. Comeback Gate (#10)

## Flagship bets (full sprint)
1. ARISE Shadow Extraction + Boss Raid HP bar (#3 + #4): core identity loop (weekly boss, extraction reward, equipped shadow)
2. Guild Raids UI (#8): social retention + viral invites

## Build order
#2 > #1 > #10 > #4 > #3 > #5 > #8 (then #6, #7, #9)

Goal alignment: real goal completion (#6, #7, #9), D7/D30/D90 retention (#1, #4, #5, #10), sensory juice (#2, #3), virality (#3, #8, #9), fan authenticity (#1, #3, #5, #6).
