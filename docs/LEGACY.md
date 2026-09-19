# Legacy Root App (Deprecated)

The repository root once held a standalone Astro app. **Active development uses the monorepo layout only.**

| Path | Status |
|------|--------|
| `sites/ratahome-furniture/` | Canonical first site instance |
| `sites/textile-*/` | Phase 2 textile pilot sites |
| `packages/core/`, `packages/sections/` | Shared platform code |
| `/src/` (repo root) | **Deprecated** — duplicate of pre-monorepo layout; not wired to `pnpm dev` / `pnpm build` |
| `/astro.config.mjs`, `/wrangler.jsonc` (root) | **Deprecated** — use per-site configs under `sites/*/` |

Commands always run against a site package, e.g.:

```bash
pnpm --filter ratahome-furniture dev
pnpm --filter textile-fabric build
```

Do not delete root `/src/` without explicit confirmation; it remains for diff reference until archived in a dedicated cleanup task.
