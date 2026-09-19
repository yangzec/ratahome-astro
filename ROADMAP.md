# ROADMAP -- 外贸独立站平台（100 行业）

进度快照。架构决策与阶段计划以此为准；实现状态以仓库实际代码为准。

---

## 已确认决策

| 项 | 决策 | 说明 |
|----|------|------|
| 部署顺序 | **先单站单部署，后多站单部署** | 先证明「站可复制」，再证明「部署可合并」 |
| 代码组织 | Monorepo + `sites/{industry}/` | 共享 `packages/core`，每站独立配置 |
| 行业语义 | **内容文案为主，组件为辅** | 80% 差异在 JSON / 路由 / 素材；仅 ~20% 需新 Section |
| 对外文案 | **干净骨架 + 三层简报 + 按区块职责写** | 对象管路由；痛点 / 说法进对应区块（非每块重复）；`write-copy.md` 定义 hero→cta 各块买家问题与行业信息 |
| 页面多样化 | Section Registry + Page Blueprint | 首页等由 JSON 配置区块顺序，非写死模板 |
| 多语言 | en 默认 + zh（`/zh/`） | 后续按需扩展 locale |
| 技术栈 | Astro 7 + Tailwind 4 + Cloudflare D1/R2 | 不引入第二套 UI 框架 |
| 阶段 2 试点行业 | **面料、服装、家纺** | 单站单部署，共用 `b2b-textile` 模板 |
| 阶段 3 试点行业 | **包装、印刷** | 多站单 Worker，验证 Host 路由与租户隔离 |
| 阶段 4 扩展行业 | **运动、户外** | 规模化复制，扩 Section 库与 CI |
| D1 策略 | **共享 D1 + `site_id`** | 从阶段 1 起所有站绑定同一 D1 实例，查询 / 写入强制带 `site_id` |
| 阶段 4 部署模式 | **阶段 3 跑通后再定** | 运动 / 户外单站或多站并入 Worker，待多站试点验证后决策 |

对照句混入环节：写 `content/` 时生成通道输入不全。否定约束 → 对照句；只拼对象 →「共用一套」；只禁复述 → 过度提炼。应先落干净骨架和三层 `industry.json`，再用 `write-copy.md` 写。

---

## 当前状态（阶段 2 进行中）

### 阶段 1 — 已完成

- [x] Ratahome 家具站 Astro 复刻（组件化、JSON 文案、en/zh）
- [x] Cloudflare D1 + R2 集成（联系表单、上传、资源 API）
- [x] Monorepo 拆分（`packages/core` + `sites/ratahome-furniture`）
- [x] 共享 D1 + `site_id` migration（`0002_add_site_id.sql`）
- [x] `site.config.ts` + `theme.json` + Blueprint 首页
- [x] Section Registry + `blueprints/home.json` 动态组装
- [x] 动态路由逻辑统一到 `lib/slug-page.ts`
- [x] 本地 build 验证通过（152 页 prerender）
- [x] 导航栏主题 CSS 修复（BaseLayout `set:html` 注入）
- [x] API 路由适配 Astro 7 `cloudflare:workers` env
- [x] 部署文档 `docs/DEPLOY.md`
- [x] Monorepo 完整提交；canonical 远程为 GitHub `yangzec/ratahome-astro`
- [x] Cloudflare 生产部署（D1 `trade-platform` + R2 `trade-platform-assets`；`ratahome-furniture.yangzec.workers.dev`）
- [x] 统一 `[locale]` 路由（`site-paths.ts` + `[...slug].astro`，仅保留 `zh/index.astro`）
- [x] `packages/sections` 独立包（12 Section + ui/forms + registry）
- [x] `site-cli` 建站脚手架（create / validate / deploy）
- [x] 阶段 1 关账：四站 `site-cli validate` + `build` 通过；根目录遗留说明见 `docs/LEGACY.md`

### 阶段 2 — 纺织类试点

- [x] `b2b-textile` 注册于 `packages/site-cli/templates.json`（source: `textile-fabric`）
- [x] 三站骨架：`sites/textile-fabric`、`textile-apparel`、`textile-home`（独立 wrangler）
- [x] 成衣 / 家纺用干净骨架 + `--brief` 重建；简报补齐痛点 / 说法；写文案走 `write-copy.md`
- [x] 共享 Section 复用（无新增 Section；`rooms.basePath` + 样品 CTA 配置化）
- [x] 三站 Cloudflare 生产部署（`textile-fabric/apparel/home.yangzec.workers.dev`；成衣 / 家纺已按简报重建重新部署）
- [ ] 三站自定义域名绑定
- [x] 纺织专属素材：三站独立 Hero / 受众 / 能力 / 流程图 + SVG 字标；成衣 / 家纺已去掉家具占位图
- [ ] 阶段 2 复用率文档化

### 后续阶段

- [ ] 阶段 3 多站试点（包装 / 印刷）
- [ ] 阶段 4 扩展站（运动 / 户外）

---

## 总体路线图

```text
阶段 1  单站单部署 × 1     Ratahome 家具 → sites/ratahome-furniture，平台化改造
阶段 2  单站单部署 × 3     面料 / 服装 / 家纺（b2b-textile 模板）
阶段 3  多站单部署 × 2     包装 / 印刷 共 1 个 Worker（Host 路由）
阶段 4  规模化 × 2+        运动 / 户外 + Section 库 30+ + CI 矩阵
```

---

## 阶段 1：单站单部署 -- 平台化改造

**目标**：把当前仓库变成可复制的平台底座；Ratahome 作为 `sites/ratahome-furniture` 第一个实例，仍可独立 `wrangler deploy`。

### 1.1 Monorepo 结构

```text
trade-site-platform/
├── packages/
│   ├── core/           # Astro 适配、BaseLayout、API、i18n、lib
│   ├── sections/       # 所有 Section 组件 + registry
│   ├── themes/         # 设计 token 预设
│   └── site-cli/       # create / validate / deploy
├── sites/
│   └── ratahome-furniture/
│       ├── site.config.ts
│       ├── theme.json
│       ├── routes.json
│       ├── blueprints/
│       ├── content/en|zh/
│       ├── public/
│       └── wrangler.jsonc
└── pnpm-workspace.yaml + turbo.json
```

### 1.2 检查点

| # | 任务 | 验收标准 |
|---|------|----------|
| 1.1 | 初始化 pnpm workspace + Turborepo | `pnpm install` 成功，packages 可互相引用 |
| 1.2 | 抽取 `packages/core` | 现有 `src/lib`、`layouts`、`pages/api` 迁入 |
| 1.3 | 抽取 `packages/sections` | ✅ 12 Section + ui/forms + `registry.ts` |
| 1.4 | 创建 `sites/ratahome-furniture` | 当前站完整迁入，行为与迁移前一致 |
| 1.5 | `getContent(siteId, locale)` | 按站点加载 content，不再硬编码 en/zh import |
| 1.6 | 主题外置 `theme.json` | CSS 变量从配置注入，替换硬编码 `izza-*` |
| 1.7 | Blueprint 首页 | `blueprints/home.json` 配置 section 列表，动态组装 |
| 1.8 | 共享 D1 + `site_id` 全链路 | 单库多租户 migration；API 写入/查询强制带 `site_id`；`site.config.ts` 注入 `SITE_ID` |
| 1.9 | 统一 `[locale]` 路由 | `site-paths.ts` 生成 en/zh 路径；`pages/zh/` 仅保留首页 |
| 1.10 | 单站部署验证 | `sites/ratahome-furniture` 独立 build + deploy 通过 |

### 1.3 交付物

- Monorepo 可构建
- Ratahome 在 `sites/ratahome-furniture` 运行
- `README.md` 更新为平台说明 + 单站运行方式

---

## 阶段 2：单站单部署 -- 纺织类试点（面料 / 服装 / 家纺）

**目标**：证明「换配置、不换 core」即可上线新行业站；三个站共用 `b2b-textile` 模板，验证同一模板下的行业细分差异。

### 2.1 试点站点规划

| site_id | 行业 | 目录（规划） | 模板 | 首页 Blueprint 侧重 |
|---------|------|--------------|------|----------------------|
| `textile-fabric` | 面料 | `sites/textile-fabric/` | `b2b-textile` | 面料成分 / 克重 / 色卡 / MOQ |
| `textile-apparel` | 服装 | `sites/textile-apparel/` | `b2b-textile` | 款式系列 / 尺码表 / 打样流程 |
| `textile-home` | 家纺 | `sites/textile-home/` | `b2b-textile` | 床品套件 / 材质认证 / 定制绣花 |

**与阶段 1 家具站的差异验证点**：

- 产品 taxonomy 从「房间 / 家具品类」换成「面料 / 成衣 / 家纺品类」
- 转化路径强调 **样品申请、MOQ、打样周期**，而非户型图上传
- 信任区块侧重 **OEKO-TEX、GOTS、BSCI** 等纺织认证（文案层配置）

### 2.2 检查点

| # | 任务 | 验收标准 |
|---|------|----------|
| 2.1 | 定义 `b2b-textile` JSON Schema | content / routes / blueprint / theme 有 schema；`templates.json` 注册模板 |
| 2.2 | `site-cli create` 生成 3 个骨架站 | CLI 已就绪；create 写干净骨架 + `industry.json`；可用 `--brief` 拼接 |
| 2.3 | `site-cli validate` | ✅ 必填文件、JSON、Blueprint、SITE_ID；空文案 / 源站全等 / 对照式否定结构 / 死链均为 error；另含 Copy Section Standard Layer A（硬拦）与可选 Layer B（`TYPESAFE_API_KEY`） |
| 2.4 | 完成 3 站 content + 素材 | 首页、导航、关于、联系可浏览（en + zh） |
| 2.5 | 各站独立 wrangler 部署 | 3 个独立域名；**共享同一 D1**（`site_id` 隔离数据）；R2 用 `{site_id}/` 前缀 |
| 2.6 | 记录复用率 | 列出复用 Section vs 新增 Section（目标新增 < 3 个） |
| 2.7 | 纺织专属 Section（按需） | 如 FabricSpecTable、SampleRequestCTA，仅 1--2 个 |

### 2.3 行业模板库（按阶段落地顺序）

| 模板 ID | 阶段 | 试点行业 | 首页 Blueprint 特点 |
|---------|------|----------|---------------------|
| `b2b-manufacturing` | 1 | 家具（Ratahome） | Hero + 能力网格 + 流程 + 案例 |
| `b2b-textile` | **2** | **面料、服装、家纺** | Hero + 产品系列 + MOQ + 样品 / 打样 |
| `b2b-packaging` | **3** | **包装** | Hero + 材质规格 + 定制能力 + 起订量 |
| `b2b-printing` | **3** | **印刷** | Hero + 工艺能力 + 印前服务 + 案例 |
| `b2b-sports-outdoor` | **4** | **运动、户外** | Hero + 场景分类 + 耐用认证 + 渠道合作 |
| `b2b-medical` | 后续 | -- | Hero + 认证 + 规格表 + FAQ |
| `b2b-chemical` | 后续 | -- | Hero + 安全认证 + 技术参数 |
| `b2b-food` | 后续 | -- | Hero + 产地 + 认证 + 出口 |
| `b2b-construction` | 后续 | -- | Hero + 项目案例 + 规格 |
| `b2b-services` | 后续 | -- | Hero + 服务流程 + Logo 墙 |
| `b2c-catalog` | 后续 | -- | Hero + 分类网格 + 热销 |

100 个行业映射到上述模板，**不是 100 套代码**。

---

## 阶段 3：多站单部署 -- 包装 / 印刷试点

**前提**：阶段 1 家具站 + 阶段 2 至少 1 个纺织站稳定运行。

**目标**：**包装** 与 **印刷** 两个站共用一个 Cloudflare Worker，按 Host 分发配置，验证多租户部署模型。

### 3.0 试点站点规划

| site_id | 行业 | 目录（规划） | 模板 | 多站 Worker |
|---------|------|--------------|------|-------------|
| `packaging` | 包装 | `sites/packaging/` | `b2b-packaging` | 合并部署 |
| `printing` | 印刷 | `sites/printing/` | `b2b-printing` | 合并部署 |

**与阶段 2 的差异验证点**：

- 从「每站独立 Worker」切换到「多 Host 共 Worker」
- 产品语义从纺织（样品 / MOQ）转向包装印刷（材质、工艺、印前、起订量）
- 重点验证 **租户隔离**（表单、上传、主题、静态资源不串站）

### 3.1 架构要点

```text
请求 → Worker middleware
         ├─ 解析 Host → site_id
         ├─ 加载 sites/{site_id}/ 配置（构建时打包或 KV）
         ├─ getContent(site_id, locale)
         └─ D1 / R2 查询强制带 site_id
```

### 3.2 检查点

| # | 任务 | 验收标准 |
|---|------|----------|
| 3.1 | Host → site_id 映射表 | `site.config.ts` 或 `sites.manifest.json` |
| 3.2 | 租户中间件 | 错误 Host 返回 404，不串站 |
| 3.3 | D1 全链路 site_id | 表单提交、查询按站隔离 |
| 3.4 | R2 路径 `{site_id}/` 前缀 | 上传与读取不跨站 |
| 3.5 | 静态资源 / 缓存按站隔离 | 各站 logo、图片、主题正确 |
| 3.6 | 包装 + 印刷同 Worker 部署 | `packaging.*` / `printing.*` 两个域名分别打开正确站点 |
| 3.8 | 新增 `b2b-packaging` / `b2b-printing` 模板 | 骨架站可生成，Blueprint 与纺织类有差异 |
| 3.7 | 单站回滚策略 | 文档化：某站出问题如何只回滚该站配置 |

### 3.3 与单站模式关系

- `sites/*` 目录结构**不变**
- 单站模式：每站一个 `wrangler deploy`
- 多站模式：一个 Worker 打包多个 `site_id` 配置
- 阶段 2 的单站部署能力**保留**，不作为废弃路径

---

## 阶段 4：规模化 -- 运动 / 户外扩展

**前提**：阶段 3 多站试点稳定；单站与多站两种部署模式均有运行实例。

**目标**：以 **运动、户外** 为扩展行业，验证规模化建站流程；同步扩充 Section 库与 CI 矩阵。

### 4.0 扩展站点规划

| site_id | 行业 | 目录（规划） | 模板 | 部署模式 |
|---------|------|--------------|------|----------|
| `sports` | 运动 | `sites/sports/` | `b2b-sports-outdoor` | **待阶段 3 跑通后决策** |
| `outdoor` | 户外 | `sites/outdoor/` | `b2b-sports-outdoor` | **待阶段 3 跑通后决策** |

**扩展验证点**：

- 场景化分类（跑步 / 健身 / 露营 / 徒步）替代纺织品类结构
- 耐用性、防水等级、渠道合作（OEM/ODM）等 B2B 文案模式
- 建站流程目标：**2--4 小时 / 站**（含 content 填充与 deploy）

### 4.1 Section Registry 扩展

目标 **30--40 个区块**，按 B2B 外贸优先级：

| 类别 | 区块 |
|------|------|
| 信任 | CertBadges、LogoCloud、StatsBar |
| 转化 | ContactCTA、LeadMagnet、QuoteForm |
| 产品 | ProductGrid、CategoryCards、SpecTable |
| 对比 | ComparisonTable、PricingTiers |
| 内容 | FaqAccordion、BlogTeaser、CaseStudy |
| 流程 | ProcessTimeline、StepCards |
| 社交证明 | Testimonials、VideoEmbed |

实现方式：Tailwind + Astro Section，借鉴 shadcn / Tailwind UI 结构，**不引入 React**。

### 4.2 建站标准流程（目标 2--4 小时 / 站）

```bash
pnpm site-cli create <slug> --from <industry-template>
# 填充 content、上传 public、调整 routes
pnpm site-cli validate <slug>
pnpm site-cli deploy <slug>          # 单站模式
# 或
pnpm site-cli deploy --multi-tenant  # 多站 Worker 模式
```

### 4.3 CI / 运维

- GitHub Actions：PR 跑 `copy-validate`（变更站或共享包则 `site-cli validate`；`TYPESAFE_API_KEY` 有则 Layer A+B）
- GitHub Actions matrix：仅变更的 `sites/*` 触发对应部署
- D1：**全平台共享一个实例**，按 `site_id` 隔离；各站 `wrangler.jsonc` 绑定同一 `database_id`
- R2：共享 bucket + `{site_id}/` 路径前缀（或按站独立 bucket，待实现时统一）
- Worker：单站阶段每站独立 Worker；多站阶段可合并（阶段 3 验证）
- 监控：按 `site_id` 分表单提交量、错误率

### 4.4 可选增强（非阻塞）

- D1 `page_content` 接入运行时文案覆盖（简易 CMS）
- 表单通知（邮件 / Slack / CRM）
- 多站数据看板

---

## D1 共享 + `site_id` 约定（阶段 1 起生效）

**决策**：所有站点（含单站单部署阶段）共用 **一个 Cloudflare D1 数据库**，通过 `site_id` 做逻辑隔离。

### Schema 要求（`migrations/`）

| 表 | 变更 |
|----|------|
| `contact_submissions` | 增加 `site_id TEXT NOT NULL` + 复合索引 `(site_id, created_at)` |
| `assets` | 增加 `site_id TEXT NOT NULL`；`key` 仍全局唯一（建议 key 含 site 前缀） |
| `page_content` | 增加 `site_id`；唯一约束改为 `(site_id, locale, slug)` |

### 运行时约定

- 每个站点 `site.config.ts` 声明 `siteId`（如 `ratahome-furniture`、`textile-fabric`）
- API 层从 `locals` / 环境变量读取 `SITE_ID`，**禁止**无 `site_id` 的写入与列表查询
- 本地开发：各站 `wrangler.jsonc` 指向同一 D1 binding 名（如 `DB`），`site_id` 区分数据

### 与部署模式关系

| 部署模式 | D1 | 说明 |
|----------|-----|------|
| 单站单 Worker（阶段 1--2） | 共享 + `site_id` | 每站独立 Worker，但绑定同一 D1 |
| 多站单 Worker（阶段 3+） | 共享 + `site_id` | 与单站阶段一致，无需迁移策略变更 |

---

## 三层语义模型（开发时遵守）

| 层级 | 位置 | 示例 |
|------|------|------|
| L1 平台 | `packages/core`、`packages/sections` | HeroSection、ContactForm、API |
| L2 行业 | `sites/{id}/content/`、`routes.json`、`blueprints/` | 导航、受众、产品分类、案例文案 |
| L3 站点 | `site.config.ts`、`theme.json`、`public/` | 品牌名、WhatsApp、主色、Logo、域名 |

---

## 待确认事项

| 项 | 选项 | 当前倾向 |
|----|------|----------|
| Monorepo 工具 | pnpm + Turborepo / Nx | pnpm + Turborepo |
| 目标语言范围 | en + zh / 更多 | en + zh 先行 |
| R2 策略 | 共享 bucket + 前缀 / 每站独立 bucket | 待实现时与 D1 策略一并落地 |
| 仓库远程 | `yangzec/ratahome-astro`（GitHub） | canonical；Origin 可选作 Cursor 镜像 |

---

## 进行中

| 事项 | 状态 |
|------|------|
| 自定义域名绑定 | 待将 `ratahome.com` 指向 Worker |
| Layer B 三项 block 修复 | 面料 warranty 改问答承诺；家具 CTA 去套话；家具 process 角色与纺织拆分。待 `validate` 复核 |

---

## 最近完成

| 时间 | 事项 |
|------|------|
| 2026-09-19 14:39 | `site-cli validate` 接入 Copy Section Standard：Layer A 硬拦 + 可选 TypeSafe Jev Layer B；PR workflow `.github/workflows/copy-validate.yml`；标准入 `docs/COPY_SECTION_STANDARD.md` |
| 2026-09-19 04:05 | 成衣 / 家纺按区块职责二轮重写并部署：hero 定位、audiences 分流、客诉进 warranty、RFQ 留 cta |
| 2026-09-19 03:55 | 修正文案方向：`write-copy.md` 增加区块职责表、痛点分区、四行业各块信息；禁止 hero=RFQ、audiences=客诉 |
| 2026-09-19 03:28 | 文案打法改为三层简报 + `write-copy.md`；`create` 不再说 splice，缺痛点 / 说法会警告 |
| 2026-09-19 03:14 | 成衣 / 家纺首页按区块重写；简报改为对象清单，去掉「共用一套」句模 |
| 2026-09-19 02:52 | 成衣 / 家纺按干净骨架 + 行业简报删除重建并重新部署；路由来自 `catalogSlugs`；文案去掉对照句 |
| 2026-09-19 02:25 | `create` 改为只拷 `packages/site-cli/skeletons/{template}`，已上线站仅作泄漏对照 |
| 2026-09-19 01:09 | 约束不得点名另一行业；`validate` 改为拦否定结构，去掉行业词黑名单 |
| 2026-09-19 00:55 | 项目规范改为对外文案分通道（生成 / 约束 / 验收）；对照句正则降为探测器；写明成衣对照句混入在重写 `content/` |
| 2026-09-18 20:52 | 对外文案只写给访客；`validate` 拦截对照式行业否定句；去掉成衣站「而不是面料贸易商」 |
| 2026-09-18 20:01 | 成衣 / 家纺重建站重新部署到 `textile-apparel` / `textile-home.yangzec.workers.dev` |
| 2026-09-18 19:58 | 删除并重建 `textile-apparel` / `textile-home`：骨架 create + 成衣/家纺独立文案与路由，去掉家具占位图 |
| 2026-09-18 18:26 | `site-cli create` 只拷骨架不拷文案；`validate`/`deploy` 对空文案、源站复用、死链报 error |
| 2026-09-18 15:50 | 纺织三站专属素材：各站独立 Hero / 受众 / 能力 / 流程图与 SVG 字标，替换家具图引用 |
| 2026-09-18 15:43 | 阶段 2 三站生产部署：`textile-fabric` / `textile-apparel` / `textile-home` → `*.yangzec.workers.dev` |
| 2026-09-18 15:26 | 阶段 2 启动：`b2b-textile` 模板 + textile-fabric/apparel/home 三站骨架；`build:all` / `site:validate:all` 通过 |
| 2026-09-18 15:26 | 阶段 1 关账：平台底座验收完成，遗留根目录 `/src/` 说明写入 `docs/LEGACY.md` |
| 2026-09-18 07:44 | 移动端响应式优化：Header 去重 Logo、Hero 字号/CTA/高度阶梯、AssuranceBar 与 section 间距 |
| 2026-09-18 07:37 | 修复 public/images base64 文本裂图：13 张位图解码为二进制并重新 deploy |
| 2026-09-18 07:34 | Cloudflare 生产部署：`trade-platform` D1 + `trade-platform-assets` R2；`session: false` 规避 KV 权限；线上表单/上传验证通过 |

---

## 最近验证

| 时间 | 对象 | 方式 | 结果 |
|------|------|------|------|
| 2026-09-19 14:39 | Copy 护栏接入 validate | `pnpm site-cli:test` 29 通过；`pnpm site-cli validate textile-fabric` 与 `validate --all` 四站 Layer A 通过，无 key 时警告跳过 Layer B | 通过 |
| 2026-09-19 04:05 | 成衣 / 家纺区块职责二轮 | hero H1 为品类定位；audiences 为角色分流；warranty 含洗后软塌等交付痛；线上 200 | 通过 |
| 2026-09-19 03:28 | 三层简报 + 写作提示词 | `pnpm site-cli:test` 14 通过；两站 `validate` 通过；`create` 提示指向 `write-copy.md` | 通过 |
| 2026-09-19 02:52 | 成衣/家纺简报重建上线 | `create --brief` 先报空文案 error；拼接后 `validate` 通过；生产首页 200，`/styles/knit-tops` `/products/bedding-sets` 为 titleize 品类页，`/fabrics/cotton` 404，无对照句；hero JPEG `FFD8FF` | 通过 |
| 2026-09-19 02:25 | 拷贝源改为骨架目录 | `pnpm site-cli:test`；四站 `validate`；`create` 拷 `packages/site-cli/skeletons/*` | 通过 |
| 2026-09-19 01:09 | 去行业指向约束 | `pnpm site-cli:test` 9 通过；四站 `validate` 通过；规范与探测器均不列行业词 | 通过 |
| 2026-09-19 00:55 | 文案分通道入规范 | 项目级 `AGENTS.md` 写入生成/约束/验收分通道与陌生人可读；USAGE 改为指针 | 已写入 |
| 2026-09-18 20:52 | 对照句校验 | `pnpm site-cli:test` 9 通过；四站 `validate` 通过；成衣 audiences 不再含「而不是面料」 | 通过 |
| 2026-09-18 20:01 | 成衣/家纺生产 | 首页 en/zh HTTP 200；`/styles/*` `/products/*` 200；旧 `/fabrics/cotton` 404；hero JPEG `FFD8FF`；浏览器核对成衣/家纺文案 | 通过 |
| 2026-09-18 19:58 | 成衣/家纺重建 | `validate textile-apparel` / `textile-home` 通过；文案与 `/styles` `/products` 路由不再复用面料站 | 通过 |
| 2026-09-18 18:26 | site-cli | `pnpm site-cli:test`（8）；`validate ratahome-furniture` / `textile-fabric` 通过；`textile-apparel` / `textile-home` 死链与源站文案复用报 error | 符合预期 |
| 2026-09-18 15:58 | 纺织专属素材上线 | 三站首页 HTML 仅引用 `/images/hero.jpg` 等新路径；hero JPEG magic `FFD8FF`；浏览器核对 Logo 与 Hero 非家具图 | 通过 |
| 2026-09-18 15:43 | 纺织三站生产 | `pnpm site-cli deploy textile-fabric/apparel/home`；首页 HTTP 200；`POST /api/contact` → D1 `site_id=textile-fabric` | 通过 |
| 2026-09-18 15:26 | 四站 build | `pnpm build:all`（ratahome + textile-fabric/apparel/home） | 通过 |
| 2026-09-18 15:26 | 四站 validate | `pnpm site:validate:all` | 通过 |
| 2026-09-18 07:34 | 生产部署 | `wrangler deploy` → `ratahome-furniture.yangzec.workers.dev` | 通过 |
| 2026-09-18 07:34 | 生产联系表单 | `POST /api/contact` + D1 远程查询 `site_id=ratahome-furniture` | 通过 |
| 2026-09-18 07:34 | 生产文件上传 | `POST /api/upload` → R2 `ratahome-furniture/` 前缀 | 通过 |
| 2026-09-18 07:37 | 生产静态图片 | curl 检查 logo/hero/dining-room magic bytes | 通过（二进制 PNG/WebP/JPEG） |
| 2026-09-17 14:25 | 联系表单 API | `POST /api/contact` + D1 查询 `site_id` | 通过 |
| 2026-09-17 14:25 | 文件上传 API | `POST /api/upload` + R2 key 前缀 | 通过 |
