# 竞品采集模型与映射方案

把行业竞品收成**可映射到现有建站文件**的结构化快照，而不是全站镜像。本文是方案正文；机器可读模型在 `/workspace/schemas/competitor/` 。

当前状态：**模型与映射已落地，爬虫未实现。** 样例是家具站自映射，不是外部竞品抓取。

---

## 1. 结论

1. 采集分两层：可读层（`pages/*.md` + 图片）和结构层（`ia.json`、`sections/*.json`、`forms/*.json`、`theme-tokens.json`）。缺结构层就无法喂 `site-cli`。
2. 映射目标只对准现有 8 类站点文件，不先发明第二套 CMS。
3. 第一期每个竞品只采 6 类页。竞品原文和图片默认 `reference-only`，改写后才能进 `sites/`。
4. 真实抓取结果写入 `.tmp/competitor-intel/{industry}/{domain}/` ，不进 Git。

---

## 2. 目标与非目标

| 做 | 不做 |
|----|------|
| 为阶段 2 起的新行业站提供 IA、区块、转化、视觉样本 | 全站博客、全量 SKU、整站 CSS/JS |
| 输出能填 `content/`、`blueprints/`、`theme.json`、`slugs.ts` 的字段 | 自动上线竞品原文或原图 |
| 用 `unmapped` 记下尚无 Section 的区块 | 为单个竞品 fork 组件 |
| 人工或后续脚本按 schema 填快照 | 本轮实现爬虫、登录抓取、生产写入 |

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

`home` `about` `category` `product` `contact` `faq` `case` `download` `legal` `other`

第一期必采：`home`、`about`、`category`、`product`（1--2 个）、`contact`，以及 `case` 或 `faq` 二选一。

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

## 6. 第一期采集范围

每个行业先采 **3 个竞品 × 6 类页**：

1. 首页
2. 关于
3. 产品 / 系列列表
4. 1--2 个详情
5. 联系 / 询盘（必须含表单字段）
6. 案例或 FAQ

同时必填：`meta.json`、`ia.json`、首页 `sections/home.json`、`forms/contact.json`、`theme-tokens.json`、`images/manifest.json`。

`products.json` 只收分类树和最多 8 个样品。博客最多留 0 篇（第一期禁止）。法律页只记 URL。

---

## 7. 落地阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| 0 | Schema、映射、自映射样例、校验脚本 | **本轮完成** |
| 1 | 按 schema **手工**填 1 个外部竞品，验证字段是否够用 | 未开始 |
| 2 | 爬虫：公开页 Markdown + 图片 + manifest | 未开始 |
| 3 | 抽取：sections / forms / theme-tokens | 未开始 |
| 4 | 映射草稿：生成改写后的 content JSON（不发布） | 未开始 |
| 5 | 可选接入 `site-cli` | 未开始 |

阶段 2 之前不要写爬虫。阶段 1 若发现缺字段，先改 schema，再扩采集。

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

未验证：真实外站抓取、浏览器渲染、自动改写质量。

---

## 10. 待确认

| 项 | 当前假设 | 为何未锁 |
|----|----------|----------|
| 持久存储 | 先 `.tmp/competitor-intel/` ，以后再定 R2 | 爬虫未做，提前建 bucket 无必要 |
| 多语言目录 | 同一 domain 下用字段区分 locale | 若中英文 IA 差异大，再拆 `{locale}/` |
| `rooms-grid` 跨行业复用 | 先换文案不换 Section | 阶段 2 纺织站做完再看是否要 `CategoryCards` |
| 生成器是否进 `site-cli` | 不进第一期 | 先证明手工映射能建出一版站 |

以上三项不影响本轮模型使用。要改假设时先改本文和 `mapping.json`，再改采集方式。
