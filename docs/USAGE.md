# 使用文档 -- Trade Site Platform

面向开发者与内容编辑。本仓 `yangzec/ratahome-astro` 的 **main 是纯模板仓**。当前过渡期仍留在本仓的首个已填实例为 **Ratahome 家具站**（`sites/ratahome-furniture`）。新站默认一站一仓，见 §13 与 `docs/site-repo-and-i18n.md` 。

---

## 1. 环境要求

| 项 | 要求 |
|----|------|
| Node.js | >= 22.12.0 |
| 包管理器 | pnpm 10+（仓库已锁定 `packageManager`） |
| 可选 | Cloudflare 账号（部署、远程 D1/R2） |

---

## 2. 快速开始

在仓库根目录执行：

```bash
# 安装依赖（含 packages/core 与站点）
pnpm install

# 初始化本地共享 D1（首次或 schema 变更后）
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

默认访问：

| 语言 | URL |
|------|-----|
| 英文 | http://localhost:43123/ |
| 中文 | http://localhost:43123/zh/ |

若 43123 被占用，Astro 会自动尝试下一端口（如 43124），以终端输出为准。

---

## 3. 仓库结构

```
trade-site-platform/
├── packages/core/                 # 共享包 @trade/core
│   └── src/
│       ├── db.ts                  # D1 读写（带 site_id）
│       ├── r2.ts                  # R2 上传/读取
│       └── i18n/                  # 多语言配置与路径工具
├── sites/b2b-shell/               # 空壳模板（create 源，不是客户站）
├── sites/ratahome-furniture/      # 家具站实例（已灌文案）
│   ├── site.config.ts             # site_id、模板、语言
│   ├── theme.json                 # 主题色、字体、圆角
│   ├── blueprints/home.json       # 首页 composition（区块顺序，不是文案蓝图）
│   ├── content/en|zh/           # 文案 JSON
│   ├── public/                    # 图片、图标
│   ├── src/                       # Astro 页面与组件
│   └── wrangler.jsonc             # Cloudflare 部署配置
└── migrations/                    # 共享 D1 迁移（全站共用一个 trade-platform；只管运行时）
```

本仓 `sites/` 下除空壳 `b2b-shell` 外，已填实例（家具、色纱、袜子、手袋等）是**过渡期老站**，不是新品牌站默认落点。新站源码进独立 Git 仓。构建产物 `dist` 不进 Git；大图优先对象存储；竞品抓取包与 Suggest 词表作资料归档，不进部署树。

---

## 4. 常用命令

在**仓库根目录**：

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Ratahome 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm preview` | 预览构建结果 |
| `pnpm db:migrate` | 本地 D1 迁移 |
| `pnpm db:migrate:remote` | 远程 D1 迁移（需 Cloudflare 配置） |
| `pnpm cf:deploy` | 构建并部署到 Cloudflare Workers |

在**站点目录** `sites/ratahome-furniture/` 也可直接运行同名脚本。

---

## 5. 修改文案（不改代码）

所有可见文案在 JSON 中，按语言分目录：

```
sites/ratahome-furniture/content/
├── en/
│   ├── common.json      # 站点名、按钮、表单、页脚
│   ├── home.json        # 首页各区块
│   ├── navigation.json  # 导航与 mega menu
│   └── pages.json       # 内页、分类页文案
└── zh/                  # 中文镜像
```

| 想改什么 | 编辑文件 |
|----------|----------|
| 站点名、WhatsApp、邮箱 | `content/{locale}/common.json` → `site` |
| 按钮文字 | `common.json` → `buttons` |
| 首页 Hero、案例、流程 | `home.json` |
| 顶部菜单 | `navigation.json` |
| About / Contact / 各 slug 页 | `pages.json` |

改完后保存，开发服务器会自动热更新；生产需重新 `pnpm build`。

---

## 6. 修改首页区块顺序（composition）

编辑 `sites/ratahome-furniture/blueprints/home.json`：

```json
{
  "sections": [
    "hero-fullbleed",
    "assurance-bar",
    "metrics-bar",
    "audience-cards",
    "capabilities-grid",
    "process-timeline",
    "testimonials",
    "warranty-cases",
    "rooms-grid",
    "projects-showcase",
    "ecosystem",
    "contact-cta"
  ]
}
```

可用区块 ID 见 `packages/sections/src/registry.ts`（站点通过 `src/lib/sections.ts` 重导出）。增删或调序后刷新首页即可看到效果。

---

## 7. 修改主题（颜色 / 字体）

编辑 `sites/ratahome-furniture/theme.json`：

```json
{
  "colors": {
    "accent": "192 92 21",
    "ink": "43 44 39",
    ...
  },
  "fonts": {
    "sans": "'Inter', ...",
    "display": "'Cinzel', ..."
  }
}
```

颜色值为 **RGB 空格分隔**（无 `rgb()` 包裹），由 `BaseLayout.astro` 注入为 CSS 变量。

---

## 8. 新增页面路由

1. 在 `src/data/slugs.ts` 的 `pageSlugs`（或 `collectionSlugs` 等）中加入 slug
2. 在 `content/en/pages.json` → `slugs` 下添加对应条目（title、description、content）
3. 在 `content/zh/pages.json` 添加中文镜像
4. 重新构建后访问 `/your-slug` 与 `/zh/your-slug`

路由生成：`src/lib/site-paths.ts` 为 en/zh 生成静态路径；页面解析在 `src/lib/slug-page.ts`。首页保留 `pages/index.astro` 与 `pages/zh/index.astro`，其余页面由 `pages/[...slug].astro` 统一处理。

---

## 9. 数据库（共享 D1 + site_id）

**策略**：全平台共用 **一个** Cloudflare D1 实例 `trade-platform`，用 `site_id` / `SITE_ID` 做逻辑隔离，**只管运行时询盘等**，不用数据库管部署文件 / 文案源。**不要**为每个站点创建独立 D1。各站 `wrangler.jsonc` 绑定同一 `database_name` 与同一 `database_id`，只改 `vars.SITE_ID`。

隔离范围（读写必须带当前站的 `site_id`）：

| 表 | 用途 |
|----|------|
| `contact_submissions` | 联系表单提交 |
| `assets` | R2 文件元数据 |
| `page_content` | 可选运行时文案覆盖（预留） |

产品目录**不是** D1 数据。产品与页面文案在各站 `content/{locale}/*.json`（静态文件）。共享 D1 不会自动隔离这些文件；建站后必须用该行业蓝图整份替换 content，否则会把上一行业文案带上线。袜子产品出现在色纱站上，是静态 JSON 未换干净，不是 D1 串站。

当前已填实例的 `site_id` 例：`ratahome-furniture`、`loftknit-oem`、`atelierbag-oem`、`aureline-yarns`（见各站 `site.config.ts` 与 `wrangler.jsonc` 的 `SITE_ID`）。空壳模板是 `b2b-shell`，不要当客户站部署。

本地迁移：

```bash
pnpm db:migrate
```

迁移文件位于仓库根 `migrations/`。

---

## 10. 文件存储（R2）

- 绑定名：`R2`，bucket：`trade-platform-assets`
- 对象键格式：`{site_id}/{purpose}/{timestamp}-{random}-{filename}`
- 联系表单上传走 `POST /api/contact`（multipart）
- 直接上传走 `POST /api/upload`
- 读取走 `GET /api/assets/{site_id}/...`

---

## 11. API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/contact` | 提交联系表单 → D1 + 可选 R2 |
| `POST` | `/api/upload` | 直接上传文件 → R2 |
| `GET` | `/api/assets/[...key]` | 代理读取 R2（需 key 以当前 site_id 开头） |

表单字段：`locale`、`name`、`email`、`projectType`、`message`、`file`（可选）。

---

## 12. Cloudflare 部署

1. 在 Cloudflare 创建 **一个** D1 数据库 `trade-platform`，把返回的 `database_id` 写入各站 `wrangler.jsonc`（同一 id）。不要每站新建 D1
2. 创建 R2 bucket `trade-platform-assets`
3. 执行远程迁移：`pnpm db:migrate:remote`
4. 部署：`pnpm cf:deploy`

---

## 13. 新增站点

规范正文：`docs/site-repo-and-i18n.md` 。多语言门禁：`docs/blueprint-rules.md` 、`docs/teardown-workflow.md` 。

### 新站默认：一站一仓

一句话流程：**钉住某一版模板 → 新建独立品牌站仓 → 按已验收 copy-final 写入 `content/en/`、`content/zh/` → 从该站仓 deploy。**

不要再默认在本仓 `sites/<slug>/` 堆新品牌成品。

1. **钉模板版本**：在本仓 `yangzec/ratahome-astro` 记下将使用的 tag 或 commit（空壳 `sites/b2b-shell`、共享 packages、文档以该版为准）。
2. **新建站仓**：品牌站部署源码进独立 Git 仓，从钉住的模板版复制空壳与所需 packages，写入该站 `site.config.ts` / `SITE_ID` / Worker 名。
3. **灌文案**：蓝图前门禁通过后，把各语种 copy-final 写入该站仓 `content/en/`、`content/zh/`（同站一套槽位 / 路由，不是每语种一仓）。有 locale 文件 ≠ 做过关键词 / 本地化验收。
4. **deploy**：从该站仓构建并部署。`dist` 不进 Git；大图优先对象存储；竞品抓取包与 Suggest 词表只作资料归档，不进部署树。
5. **运行时**：仍绑定共享 D1 `trade-platform`，按 `site_id` / `SITE_ID` 隔离。D1 **只管运行时询盘等**，不用数据库管部署文件 / 文案源。

`b2b-manufacturing` 的源是空壳 `sites/b2b-shell`，**不是** `ratahome-furniture` 或袜子 / 手袋站。禁止再从已填实例克隆行业文案。

### 本仓 `site-cli create`（过渡 / 不推荐新站再用）

下列命令仍会把空壳复制进**本仓** `sites/<slug>/`。只用于已在本仓的老站维护，或尚未迁出的实验。新品牌站不要再用这条路径当默认建站方式。

已在本仓的老站（`ratahome-furniture`、`aureline-yarns`、`loftknit-oem`、`atelierbag-oem` 等）过渡期可留着，有空再迁。

```bash
# 查看可用行业模板
pnpm site-cli templates

# 过渡：复制 sites/b2b-shell 进本仓 sites/<slug>/（只改 site_id / Worker 名；不含家具或袜子文案）
pnpm site-cli create textile-fabric --from b2b-manufacturing --name "Textile Fabric"

# 校验配置、JSON、Blueprint section、SITE_ID 一致性
# 非已填实例还会扫描家具 / 袜子脏词（sofa、Foshan、LoftKnit、sock 等）
pnpm site-cli validate textile-fabric

# 本地开发
pnpm --filter textile-fabric dev

# 部署（需 wrangler login + D1/R2 配置；不要 deploy b2b-shell）
pnpm site-cli deploy textile-fabric
pnpm site-cli deploy textile-fabric --dry-run   # 仅打印命令
```

若走这条过渡路径：行业文案仍须在 create 之后，按已验收的 copy-final 整份写入 `sites/<slug>/content/`，并先过蓝图前门禁。`b2b-textile` 等行业模板将在阶段 2 加入 `packages/site-cli/templates.json` 。

---

## 14. 故障排查

| 现象 | 处理 |
|------|------|
| 端口被占用 | 查看终端实际端口，或 `lsof -i :43123` 后结束占用进程 |
| D1 表不存在 | 运行 `pnpm db:migrate` |
| 首页某区块不显示 | 检查 `blueprints/home.json` 中的 ID 是否在 `sectionRegistry` 中 |
| 中文页 404 | 确认 `content/zh/` 有对应 JSON，且 URL 为 `/zh/...` |
| 表单提交失败 | 确认本地 wrangler platformProxy 已启用；生产环境检查 D1/R2 绑定 |

---

## 15. 相关文档

- 一站一仓 / 多语言门禁：`docs/site-repo-and-i18n.md`
- 蓝图规则：`docs/blueprint-rules.md`
- 拆站流程：`docs/teardown-workflow.md`
- 架构与进度：`ROADMAP.md`
- Agent 协作规范：`AGENTS.md`
- 项目概览：`README.md`
