PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. ENGINE META (identifies this as Gitto Engine)
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_admin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. REPOSITORIES (core git platform)
CREATE TABLE IF NOT EXISTS repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  owner_name TEXT NOT NULL, -- denormalized for speed: username
  description TEXT DEFAULT '',
  is_private INTEGER DEFAULT 0,
  is_fork INTEGER DEFAULT 0,
  forked_from_id INTEGER,
  default_branch TEXT DEFAULT 'main',
  stars_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  size_kb INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (forked_from_id) REFERENCES repos(id) ON DELETE SET NULL,
  UNIQUE(owner_name, name)
);

-- 4. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
  UNIQUE(repo_id, name)
);

-- 5. COMMITS (metadata, actual git objects stay on disk)
CREATE TABLE IF NOT EXISTS commits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  sha TEXT NOT NULL,
  branch TEXT DEFAULT 'main',
  author_id INTEGER,
  author_name TEXT,
  author_email TEXT,
  message TEXT,
  parent_sha TEXT,
  committed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
  UNIQUE(repo_id, sha)
);

-- 6. COLLABORATORS
CREATE TABLE IF NOT EXISTS collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  permission TEXT DEFAULT 'read', -- read, write, admin
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(repo_id, user_id)
);

-- 7. STARS / FAVORITES
CREATE TABLE IF NOT EXISTS stars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(repo_id, user_id)
);

-- 8. ISSUES (optional for v1)
CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  author_id INTEGER,
  status TEXT DEFAULT 'open', -- open, closed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
);

-- 9. SSH KEYS
CREATE TABLE IF NOT EXISTS ssh_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  public_key TEXT NOT NULL,
  fingerprint TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR SPEED
-- ============================================
CREATE INDEX IF NOT EXISTS idx_repos_owner ON repos(owner_name);
CREATE INDEX IF NOT EXISTS idx_commits_repo ON commits(repo_id);
CREATE INDEX IF NOT EXISTS idx_commits_sha ON commits(sha);
CREATE INDEX IF NOT EXISTS idx_branches_repo ON branches(repo_id);
CREATE INDEX IF NOT EXISTS idx_stars_repo ON stars(repo_id);
CREATE INDEX IF NOT EXISTS idx_collab_repo ON collaborators(repo_id);

-- ============================================
-- ENGINE SEED DATA
-- ============================================
INSERT OR IGNORE INTO meta (key, value) VALUES ('engine', 'gitto.db');
INSERT OR IGNORE INTO meta (key, value) VALUES ('engine_name', 'Gitto Engine');
INSERT OR IGNORE INTO meta (key, value) VALUES ('version', '1.0.0');
INSERT OR IGNORE INTO meta (key, value) VALUES ('powered_by', 'Gitto');
INSERT OR IGNORE INTO meta (key, value) VALUES ('powered_by_url', 'https://gitto.cu.ma');
INSERT OR IGNORE INTO meta (key, value) VALUES ('license', 'MIT - Powered by Gitto');
INSERT OR IGNORE INTO meta (key, value) VALUES ('created_by', 'Blue-Cannon/Gitto');

-- Default admin user (password: gitto123 - change it!)
-- hash for 'gitto123' = you should replace
INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, is_admin) 
VALUES (1, 'gitto', 'newssungoldentoday@gmail.com', '$2y$10$examplehashchangeme', 'Gitto Admin', 1);
