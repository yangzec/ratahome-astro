# Competitor collection schemas

Machine-readable model for industry competitor snapshots.

- **方案正文**：[`docs/COMPETITOR_INTEL.md`](../../docs/COMPETITOR_INTEL.md)
- **抓取清单**：[`crawl-brief.json`](crawl-brief.json)（两轮：先首页 + sitemap，再动态选 URL）
- **路径分类**：`node schemas/competitor/classify-seeds.mjs --origin {url} --home raw/home.md --sitemap raw/sitemap.xml`
- **字段映射**：[`mapping.json`](mapping.json)
- **自映射样例**：[`examples/ratahome-self/`](examples/ratahome-self/)
- **校验**：`node schemas/competitor/validate.mjs`

本目录只存放 schema、映射和最小样例。真实抓取结果写入 `.tmp/competitor-intel/{industry}/{domain}/`，不进 Git。
