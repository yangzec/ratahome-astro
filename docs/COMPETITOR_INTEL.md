# 竞品采集模型与映射方案

把行业竞品收成**可映射到现有建站文件**的结构化快照，而不是全站镜像。本文是方案正文；机器可读模型在 `/workspace/schemas/competitor/` 。

当前状态：**模型与映射已落地。仓库不写爬虫。** 家具站自映射仍是校验夹具。首个外站 `balkrushnatextiles.com` 两轮已用环境内 Cloudflare Token 点抓（`POST /browser-rendering/markdown`，8/8），`theme-tokens.json` 已按第 6.7 节用公开 CSS + CF `/content` `getComputedStyle` 核对。快照在 `.tmp/competitor-intel/textile/balkrushnatextiles.com/` 。Token 必须带 **Browser Rendering - Edit**。可执行清单：`/workspace/schemas/competitor/crawl-brief.json` 。

---

## 1. 结论

1. 采集分两层：可读层（`pages/*.md` + 图片）和结构层（`ia.json`、`sections/*.json`、`forms/*.json`、`theme-tokens.json`）。缺结构层就无法喂 `site-cli`。
2. 映射目标只对准现有 8 类站点文件，不先发明第二套 CMS。
3. 按该站 IA 和行业特征采集，不设页数预算。竞品原文默认 `reference-only`，改写后才能进 `sites/`。
4. 真实抓取结果写入 `.tmp/competitor-intel/{industry}/{domain}/` ，不进 Git。
5. Agent 不实现爬虫。你按第 6 节抓公开页 Markdown 和图片 URL；结构层（sections / forms / theme）在落盘后再填。

---

## 2. 目标与非目标

| 做 | 不做 |
|----|------|
| 为阶段 2 起的新行业站提供 IA、区块、转化、视觉样本 | 全站博客、全量 SKU、整站 CSS/JS |
| 输出能填 `content/`、`blueprints/`、`theme.json`、`slugs.ts` 的字段 | 自动上线竞品原文或原图 |
| 用 `unmapped` 记下尚无 Section 的区块 | 为单个竞品 fork 组件 |
| 按 schema 消化你抓回来的 Markdown / 图链 | 在本仓库实现爬虫、登录抓取、生产写入 |

---

## 3. 目录约定

### 3.1 仓库内（提交）

```
/workspace/schemas/competitor/
  *.schema.json              # 字段合同
  mapping.json               # 采集字段 → 站点文件
  validate.mjs
  examples/ratahome-self/    # 自映射样例
/workspace/docs/COMPETITOR_INTEL.md
```

### 3.2 工作快照（不提交）

```
.tmp/competitor-intel/{industry}/{domain}/
  collection.json
  meta.json
  ia.json
  theme-tokens.json
  products.json              # 可选
  pages/{pageType}/{slug}.md
  sections/{slug}.json
  forms/contact.json
  images/manifest.json
  images/{role}/
  downloads/
```

`industry` 用站点行业 slug（如 `furniture`、`textile-fabric`）。`domain` 用主机名小写。同一域名多语言可在 `pages` / `ia` 里用 `locale` 区分，不必复制整棵目录。

---

## 4. 数据模型

每个快照一个 `collection.json` 做索引；其余文件各自校验。

| 文件 | Schema | 职责 |
|------|--------|------|
| `collection.json` | `collection.schema.json` | 范围、语言、文件清单 |
| `meta.json` | `meta.schema.json` | 品牌、语言、联系方式、建议模板 |
| `ia.json` | `ia.schema.json` | 导航树、URL 模式、页面类型 |
| `pages/*.md` | `page.schema.json`（frontmatter） | 可读正文 + SEO |
| `sections/*.json` | `sections.schema.json` | 区块顺序与字段 |
| `forms/contact.json` | `form.schema.json` | 表单意图、字段、CTA |
| `theme-tokens.json` | `theme-tokens.schema.json` | 色 / 字 / 圆角 / 图片风格 |
| `images/manifest.json` | `images-manifest.schema.json` | 图片角色、来源、授权 |
| `products.json` | `products.schema.json` | 分类树 + 少量样品 |

### 4.1 页面类型（`pageType`）

`home` `about` `category` `product` `contact` `faq` `case` `download` `sample` `spec` `cert` `legal` `other`

第一期必采：`home`、`about`、`category`、`product`（按簇抽样）、`contact`，以及 `case` 或 `faq` 二选一。行业特征页（纺织的 `cert` / `sample` / `spec`）有就收。

### 4.2 区块角色（`sectionRole`）→ Blueprint

| role | 现有 `blueprintId` | 未登记时 |
|------|-------------------|----------|
| `hero` | `hero-fullbleed` | -- |
| `assurance` | `assurance-bar` | -- |
| `metrics` | `metrics-bar` | -- |
| `audience` | `audience-cards` | -- |
| `capabilities` | `capabilities-grid` | -- |
| `process` | `process-timeline` | -- |
| `testimonials` | `testimonials` | -- |
| `warranty` | `warranty-cases` | -- |
| `category-grid` | `rooms-grid` | 纺织等行业仍先复用此 ID |
| `projects` | `projects-showcase` | -- |
| `ecosystem` | `ecosystem` | -- |
| `cta` | `contact-cta` | -- |
| `faq` / `product-grid` / `spec-table` / `cert-badges` / `logo-cloud` | `null` | 记入 `unmapped`，建议名见 `mapping.json` |
| `nav` / `footer` | 无独立 Section | 写入 navigation / common |

`rooms-grid` 在家具站表示房间。其他行业语义变了，第一期仍复用该 Section，只换 `rooms.items` 的 label / slug。两个以上站点证明不够用时，再加 `CategoryCards`。

### 4.3 表单意图（`formIntent`）

`floor-plan` `quote` `sample` `prototype` `oem` `general`

家具站默认 `floor-plan`。纺织试点若大量出现 `sample` / `prototype`，再考虑 `SampleRequestCTA`，不在采集期加组件。

### 4.4 图片角色与授权

`logo` `logo-dark` `favicon` `og` `hero` `product` `lifestyle` `factory` `cert` `client-logo` `icon` `other`

`license`：`own` / `licensed` / `reference-only` / `unknown`。竞品图默认 `reference-only` 且 `doNotPublish: true`，不得复制进 `sites/*/public/`。

---

## 5. 映射关系

完整字段表见 `/workspace/schemas/competitor/mapping.json` 。下表是建站时要打到的文件。

```text
竞品快照                              站点实例
meta.json                        →    site.config.ts
                                      content/{locale}/common.json#/site
ia.json#/nav                     →    content/{locale}/navigation.json
ia.json#/urlPatterns             →    src/data/slugs.ts
ia.json#/pages                   →    content/{locale}/pages.json#/slugs
sections/home.json               →    blueprints/home.json
                                      content/{locale}/home.json
forms/contact.json               →    common.json#/form + #/buttons
theme-tokens.json                →    theme.json
pages/about.md                   →    pages.json#/about
pages/contact.md                 →    pages.json#/contact
images[license=own|licensed]     →    public/images/
images[reference-only]           →    不进站点
```

### 5.1 转换规则

| transform | 含义 |
|-----------|------|
| `copy` | 结构安全的值，如 locale、模板 ID |
| `copy-if-own` | 联系方式只回到自己的站；竞品联系方式留在 `meta.json` |
| `rewrite` | 必须改写后才能进 `content/` |
| `token` | 抽成 `theme.json` 的 RGB 空格串和字体栈 |
| `filter-registered` | Blueprint 只保留 `sectionRegistry` 已有 ID |
| `slug` | 路径段转 kebab-case，写入 `slugs.ts` |
| `reference-only` | 只作样本，不复制文件 |

竞品数字指标（交期、产能、认证）默认视为待核实，改写进站点前要单独确认。

### 5.2 与 `site-cli create` 的衔接

当前 `create` 只复制模板站并替换 `siteId` / 名称。采集结果**不自动写入**新站。

建议人工顺序：

1. `pnpm site-cli create <slug> --from <template>`
2. 按 `mapping.json` 把快照改写成该站 `content/`、`theme.json`、`blueprints/home.json`、`slugs.ts`
3. `pnpm site-cli validate <slug>`

以后若做生成器，也只生成草稿 JSON，不直接发布。

---

## 6. 你要爬什么（Jina / Cloudflare）

机器可读清单：`/workspace/schemas/competitor/crawl-brief.json` 。接口依据：

- Jina Reader：https://r.jina.ai/docs 
- Cloudflare `/crawl`：https://developers.cloudflare.com/browser-run/quick-actions/crawl-endpoint/ 
- Cloudflare `/markdown`：https://developers.cloudflare.com/browser-run/quick-actions/markdown-endpoint/ 

不要全站镜像，也不要假设 `/about`、`/products`。每个站的 IA 不同，分两轮：

1. **只抓** 首页、`/sitemap.xml`、`/robots.txt`
2. 把 dump 交给 `classify-seeds.mjs`，按导航文案 + URL 形态标出第二轮 URL
3. 再按 `raw/seeds.json` 点抓

**不设页数预算。** 分类器先从首页文案判断行业（家具 / 纺织 / 包装 / 印刷 / 运动户外），再按这个站真实有的页面来收：

- 行业核心页和特征页（如纺织的样品 / 规格 / 认证）**有就收**
- 同一 URL 簇（如 `/shop/{slug}`）只抽样：2--7 条抽 2，8 条以上抽 3，不爬全量 SKU
- 博客、法律正文、登录后内容仍然不抓

`/about` 只是分类词。行业画像：`/workspace/schemas/competitor/industry-profiles.json` 。样例：`/workspace/schemas/competitor/examples/classify-seeds/` 。

```bash
node schemas/competitor/classify-seeds.mjs \
  --origin https://acme.example \
  --home raw/home.md \
  --sitemap raw/sitemap.xml \
  --out raw/seeds.json
```

### 6.1 第二轮采集什么（路径和数量都由这个站决定）

| # | pageType | 分类依据（文案或路径片段） | 必须拿到 |
|---|----------|---------------------------|----------|
| 1 | `home` | `/` | Markdown、主导航链接、Hero、区块标题顺序、首屏图 URL |
| 2 | `about` | Our Story / 关于 / company | Markdown、H1 |
| 3 | `category` | Shop / Collections / 产品 | 分类名、href、分类图 URL |
| 4 | `product` | 每个分类 URL 簇下的详情 | 按簇抽样，不设全局上限；品名、可见规格、主图 URL |
| 5 | `contact` | Enquire / Quote / 询盘 | **表单字段**、CTA、公开联系方式 |
| 6 | `case` 或 `faq` | Works / Projects / FAQ | 案例卡或问答 |

站点上还有样品、认证、规格、质保、流程、目录，就一并收。行业核心类型缺失只记 `unresolved`，不凑页数，不猜 `/about`。

### 6.2 不要抓

博客 / 新闻、购物车、登录后、全量 SKU、法律页正文、CSS/JS、第三方像素。法律页只在 `meta.json` 记链接。

### 6.3 Jina：按 URL 点抓（推荐）

第一轮只打首页（务必开 `X-With-links-Summary`）。第二轮只打 `seeds.json` 里的 URL：

```text
GET https://r.jina.ai/{absoluteUrl}
Authorization: Bearer {JINA_TOKEN}
Accept: application/json
X-Respond-With: frontmatter
X-Retain-Images: all
X-Retain-Links: all
X-With-Images-Summary: true
X-With-links-Summary: true
X-Robots-Txt: true
X-Engine: browser
X-Timeout: 60
X-Locale: en
```

`frontmatter` 会带 `title` / `description` / `url`。图片摘要和链接摘要分别喂 `images/manifest.json` 与 `ia.json`。第一期不要用 `X-Preset: spider`。SPA 站可把 `X-Engine` 换成 `cf-browser-rendering`。设了 `X-Respond-With` 时，官方说明 `X-With-Generated-Alt` 无效，不必加。

### 6.4 Cloudflare：按 seeds 单页抓，不要用固定路径宽爬

第一轮用 `/markdown` 抓首页，sitemap / robots 用普通 HTTP。第二轮对 `seeds.json` 里每个 URL 再打 `/markdown`。不要把 `/about**`、`/products**` 写进 `includePatterns`。宽爬容易漏掉非标准路径，不作为默认。

```text
POST /accounts/{account_id}/browser-rendering/markdown
Authorization: Bearer {token}    # 权限：Browser Rendering - Edit
{ "url": "{absoluteUrl}", "gotoOptions": { "waitUntil": "networkidle0" } }
```

只有 sitemap 很乱、要靠链接发现时，才用 `/crawl`，并且必须限制：

- `limit`: 12，`depth`: 2
- `formats`: `["markdown"]`，`render`: true（分类网格若是 JS 渲染）
- `crawlPurposes`: `["ai-input"]`，`contentUse`: `"reference"`（研究改写，不原样转载）
- `includeExternalLinks` / `includeSubdomains`: false
- 若仍用 `/crawl`，`includePatterns` 必须从 `seeds.json` 生成，不能用固定路径表

目标站 `robots.txt` 的 Content-Signal 若拒绝 `ai-input` 或 `reference`，官方会 400。记下该域名并跳过，不要绕过。

联系页的表单字段 Markdown 经常丢。Jina 不够时，对联系页再抓一次 HTML，或自己从页面抄字段进 `forms/contact.json`。不要对整站开 CF `formats: ["json"]`。

### 6.5 图片怎么收

先收 URL，不先下原图。从 Markdown `![](url)` 和 Jina images summary 建 `images/manifest.json`。第一期只下载这些角色（仍标 `reference-only`）：

- logo / favicon / og
- 首页 hero 1 张
- 分类图最多 8 张
- 详情主图 1--2 张
- 有工厂 / 认证图再各留 1--2 张

### 6.6 落到哪里

```text
.tmp/competitor-intel/{industry}/{domain}/
  raw/home.md
  raw/home.jina.json
  raw/sitemap.xml
  raw/robots.txt
  raw/seeds.json
  raw/pages/{pageType}-{slug}.md
```

你交来 raw 之后，再规范化成 `pages/*.md`、`ia.json`、`images/manifest.json`。`sections/home.json`、`forms/contact.json` 后补。`theme-tokens.json` 不从 Markdown 抽，按第 6.7 节填。

### 6.7 `theme-tokens.json` 怎么补

CF `/markdown`、Jina 和 `/json`（Workers AI）都没有可靠的计算样式。按这个顺序填，写入快照根目录，不进 `sites/`：

1. **优先公开 CSS**：首页 HTML 里的主题 `style.css`、Google Fonts、`body` / 按钮 / 卡片圆角。Balkrushna 已用 `/wp-content/themes/balkrushna/assets/css/style.css` 。
2. **用 CF 当远程 DevTools**：`POST /accounts/{account_id}/browser-rendering/content`，`addScriptTag` 注入脚本对关键节点跑 `getComputedStyle`，把 JSON 写进页面后再从返回 HTML 里取出。助手：`node schemas/competitor/probe-theme.mjs --url {page} --out raw/theme-computed.json` 。官方字段：https://developers.cloudflare.com/api/resources/browser_rendering/subresources/content/methods/create/ 。本地也可在 Elements 看 computed `color`、`background-color`、`font-family`、`border-radius`。
3. **CSS 与 computed 冲突时以 computed 为准**，差异写进 `notes`。Balkrushna：`body{background:#fff}` 被 WP `custom-background` 盖成 `#F7F7F7`；按钮 CSS 先写 `4px` 再写 `10px`，computed 是 `10px`。
4. **截图只作校对**，不凭观感猜 hex。不要用 `/json` + Workers AI 猜色。

必填并对齐 `theme.json`：

| token | 取哪 | 写入 |
|-------|------|------|
| `colors.*.rgb` | 主色 / 正文 / 页底 / 次要字 / 边线 / 按钮 | 空格三元组，如 `228 40 45` |
| `colors.*.hex` | 同上，便于核对 | `#E4282D` |
| `fonts.sans` / `display` / `label` | `body` 与标题 / 按钮 | 完整 font-stack |
| `radius.hero` / `image` / `button` | 首屏块、图、CTA | 带单位，如 `10px` |
| `imageStyle` | 图库与产品图观感 | `white-bg-product` `lifestyle` `factory` `render` `mixed` |

`rgb` 是映射到 `theme.json` 的字段。按钮若是描边、hover 才填色，`button` 仍记品牌色，在 `notes` 写清默认态。

---

## 7. 落地阶段

| 阶段 | 内容 | 谁做 | 状态 |
|------|------|------|------|
| 0 | Schema、映射、自映射样例、抓取清单 | Agent | **完成** |
| 1 | 先交首页 + sitemap；按行业特征生成 `seeds.json` 后再抓 | **你（Jina / CF）** | 待你操作 |
| 2 | raw → 规范化快照（pages / ia / manifest） | Agent，等你交 raw | 未开始 |
| 3 | 补 sections / forms / theme-tokens | 人工 + Agent | Balkrushna 三件已补，theme 已 computed 核对；下站仍按 6.7 |
| 4 | 改写成站点 content 草稿（不发布） | Agent | 未开始 |

缺字段先改 schema，再扩抓取范围。

---

## 8. 版权与安全

- 快照默认用途是**行业研究与改写参考**，不是素材库。
- 进 `sites/` 的文案必须改写；进 `public/` 的图必须 `own` 或 `licensed`。
- 不采登录后内容、询盘邮箱、客户名单、第三方像素脚本。
- 遵守目标站 `robots.txt` 与 `noindex`；法律页正文第一期不存。
- 密钥、cookie、token 不得写入快照。

---

## 9. 验证

```bash
node schemas/competitor/validate.mjs
```

脚本检查：

- 自映射样例符合各 schema
- `collection.json` 列出的文件都在磁盘上
- 页面 Markdown 含 frontmatter
- `packages/sections` 的 12 个 registry ID 都能在 `mapping.json` 找到 `blueprintId`
- `content/en/home.json` 的每个顶层键都有映射
- 映射指向的现有站点文件存在
- 第一期必采 `pageType` 出现在样例里
- `classify-seeds` 能把 `/our-story`、`/shop`、`/enquire-now` 标成正确类型

已用 `balkrushnatextiles.com` 跑通两轮：第一轮首页 + sitemap + WP JSON → `classify-seeds`；第二轮环境内 CF `/markdown` 8/8；`theme-tokens.json` 已用公开 CSS + CF `/content` `getComputedStyle` 核对（页底 `#F7F7F7`、主色 `#E4282D`、按钮圆角 `10px`、Poppins）。未验证：自动改写质量、灌进 `sites/`。

---

## 10. 待确认

| 项 | 当前假设 | 为何未锁 |
|----|----------|----------|
| 持久存储 | 先 `.tmp/competitor-intel/` ，以后再定 R2 | 抓取在站外执行，提前建 bucket 无必要 |
| 多语言目录 | 同一 domain 下用字段区分 locale | 若中英文 IA 差异大，再拆 `{locale}/` |
| `rooms-grid` 跨行业复用 | 先换文案不换 Section | 阶段 2 纺织站做完再看是否要 `CategoryCards` |
| 生成器是否进 `site-cli` | 不进第一期 | 先证明手工映射能建出一版站 |

以上三项不影响本轮模型使用。要改假设时先改本文和 `mapping.json`，再改采集方式。
