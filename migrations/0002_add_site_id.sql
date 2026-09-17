-- Shared D1: logical isolation by site_id

ALTER TABLE contact_submissions ADD COLUMN site_id TEXT NOT NULL DEFAULT 'ratahome-furniture';
CREATE INDEX IF NOT EXISTS idx_contact_submissions_site_created ON contact_submissions(site_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_site_status ON contact_submissions(site_id, status);

ALTER TABLE assets ADD COLUMN site_id TEXT NOT NULL DEFAULT 'ratahome-furniture';
CREATE INDEX IF NOT EXISTS idx_assets_site_key ON assets(site_id, key);

ALTER TABLE page_content ADD COLUMN site_id TEXT NOT NULL DEFAULT 'ratahome-furniture';
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_content_site_locale_slug ON page_content(site_id, locale, slug);
