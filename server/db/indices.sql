-- Optimizing user lookups by Firebase UID (Auth)
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);

-- Optimizing Leaderboard (Top XP)
CREATE INDEX IF NOT EXISTS idx_users_xp_desc ON users (xp DESC);

-- Optimizing Quest fetching (My Quests, by Type, by Date)
CREATE INDEX IF NOT EXISTS idx_quests_user_type_created ON quests (user_id, type, created_at DESC);

-- Optimizing Unread Notifications check
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);

-- Optimizing Message history (fetching last N messages)
CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc ON messages (created_at DESC);
