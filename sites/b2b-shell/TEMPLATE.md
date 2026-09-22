# b2b-shell — empty B2B manufacturing template

This directory is the **create source** for `b2b-manufacturing`. It is not a customer site.

- `site-cli create <slug> --from b2b-manufacturing` copies this tree, then rewrites `siteId` / Worker name.
- Industry copy comes from a copy-final blueprint **after** create. Do not fill this shell with furniture, socks, yarn, or any real brand facts.
- Content JSON uses explicit TBD tokens: `[Brand]`, `[City]`, `[Email]`, `[Phone]`.
- Do not deploy Worker `b2b-shell` as a live brand.

Shared D1 `trade-platform` is bound here only so copied sites keep the same wrangler shape. Isolation is `SITE_ID` / `site_id`, not a per-site database.
