# Trade Site Platform

Monorepo for multilingual B2B trade independent sites. First site: **Ratahome Furniture** (Astro 7 + Cloudflare D1/R2).

## Repository

- **GitHub:** https://github.com/yangzec/ratahome-astro
- **Canonical remote:** `origin` → `yangzec/ratahome-astro`

```bash
git clone https://github.com/yangzec/ratahome-astro.git
cd ratahome-astro
pnpm install
pnpm dev
```

推送需 GitHub 凭据（Classic PAT 勾选 `repo`，或 `gh auth login`）。

## Structure

```
packages/core/              Shared lib: db, r2, i18n
packages/sections/          Shared Section components + registry
packages/site-cli/          create / validate / deploy CLI
sites/ratahome-furniture/   First site instance (furniture)
sites/atelierbag-oem/       Handbag OEM instance (Guangzhou / Shiling)
  site.config.ts            site_id, template, locales
  theme.json                Design tokens (colors, fonts)
  blueprints/home.json      Homepage section order
  content/{en,zh}/          Copy JSON
  src/                      Astro pages, templates, components
migrations/                 Shared D1 schema (site_id isolation)
```

## Commands (from repo root)

```bash
pnpm install
pnpm dev          # http://localhost:43123
pnpm build
pnpm db:migrate # local shared D1
pnpm cf:deploy  # deploy ratahome-furniture
pnpm site-cli create <slug> --from b2b-manufacturing --name "Site Name"
pnpm site-cli validate <slug>
pnpm site-cli deploy <slug>
# AtelierBag OEM local: pnpm --filter atelierbag-oem dev  → http://localhost:43126
```

## Features

| Feature | Implementation |
|---------|----------------|
| Monorepo | pnpm workspace + `@trade/core` |
| 页面组件化 | `@trade/sections` + Blueprint Section Registry |
| Blueprint 首页 | `blueprints/home.json` drives section order |
| 文案配置化 | `content/{en,zh}/*.json` |
| 主题外置 | `theme.json` → CSS variables in BaseLayout |
| 多语言 | en at `/`, zh at `/zh/` |
| 共享 D1 | `trade-platform` database + `site_id` column |
| R2 隔离 | Object keys prefixed `{site_id}/` |

## Docs

- **使用文档（开发 / 内容编辑）**：[`docs/USAGE.md`](docs/USAGE.md)
- **Cloudflare 部署**：[`docs/DEPLOY.md`](docs/DEPLOY.md)
- Agent 协作规范：`AGENTS.md`
- 进度与计划：`ROADMAP.md`
