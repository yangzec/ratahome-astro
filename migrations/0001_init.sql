-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locale TEXT NOT NULL DEFAULT 'en',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_type TEXT,
  message TEXT,
  file_key TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);

-- Uploaded assets metadata (R2 object keys)
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL DEFAULT 'ratahome-assets',
  content_type TEXT,
  size_bytes INTEGER,
  original_name TEXT,
  purpose TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assets_key ON assets(key);

-- Optional: CMS page overrides (for future admin)
CREATE TABLE IF NOT EXISTS page_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locale TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT,
  description TEXT,
  body TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(locale, slug)
);
