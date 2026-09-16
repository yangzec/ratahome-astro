# Ratahome — Astro + Cloudflare

Whole-home furniture sourcing site rebuilt with **Astro 7**, **Cloudflare D1**, and **R2**.

## Architecture

```
src/
├── components/
│   ├── ui/              # Button, SectionHeader, PageHero
│   ├── sections/        # Homepage section components
│   ├── layout/          # Header, Footer, LanguageSwitcher
│   └── forms/           # ContactForm (D1 + R2)
├── content/
│   ├── en/              # English copy (JSON config)
│   └── zh/              # Chinese copy (JSON config)
├── templates/           # Page templates (locale-aware)
├── pages/
│   ├── index.astro      # English routes (/)
│   ├── zh/              # Chinese routes (/zh/)
│   └── api/             # D1 + R2 API endpoints
├── lib/
│   ├── content.ts       # Content loader
│   ├── db.ts            # D1 helpers
│   └── r2.ts            # R2 helpers
└── i18n/                # Locale config & path utils
```

## Features

| Feature | Implementation |
|---------|----------------|
| 页面组件化 | `components/sections/*` + `templates/*` |
| 文案配置化 | `src/content/{en,zh}/*.json` |
| 多语言 | Astro i18n (`en` default, `zh` at `/zh/`) |
| 数据库 | Cloudflare D1 (`contact_submissions`, `assets`, `page_content`) |
| 文件存储 | Cloudflare R2 (floor plans, uploads) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/contact` | Submit contact form → D1 + optional R2 upload |
| `POST` | `/api/upload` | Direct file upload → R2 |
| `GET` | `/api/assets/[key]` | Serve R2 object |

## Getting Started

```bash
npm install

# Apply D1 migrations (local)
npm run db:migrate

# Dev server
npm run dev
```

Open [http://localhost:43123](http://localhost:43123) (English) or [http://localhost:43123/zh](http://localhost:43123/zh) (Chinese).

## Cloudflare Deployment

1. Create D1 database:
   ```bash
   npm run db:create
   ```
   Update `database_id` in `wrangler.jsonc`.

2. Create R2 bucket `ratahome-assets` in Cloudflare dashboard.

3. Apply remote migrations:
   ```bash
   npm run db:migrate:remote
   ```

4. Deploy:
   ```bash
   npm run cf:deploy
   ```

## Content Editing

All copy lives in JSON files — no code changes needed:

- `src/content/en/common.json` — site meta, buttons, form labels
- `src/content/en/home.json` — homepage sections
- `src/content/en/navigation.json` — menu structure
- `src/content/en/pages.json` — sub-page content
- Mirror files in `src/content/zh/` for Chinese

## Database Schema

See `migrations/0001_init.sql`:
- `contact_submissions` — form submissions with optional R2 file reference
- `assets` — R2 object metadata
- `page_content` — optional CMS overrides per locale/slug
