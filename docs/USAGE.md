# 使用文档 -- Trade Site Platform

面向开发者与内容编辑。当前首个站点为 **Ratahome 家具站**（`sites/ratahome-furniture`）。

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
├── sites/ratahome-furniture/      # 站点实例
│   ├── site.config.ts             # site_id、模板、语言
│   ├── theme.json                 # 主题色、字体、圆角
│   ├── blueprints/home.json       # 首页区块顺序
│   ├── content/en|zh/           # 文案 JSON
│   ├── public/                    # 图片、图标
│   ├── src/                       # Astro 页面与组件
│   └── wrangler.jsonc             # Cloudflare 部署配置
└── migrations/                    # 共享 D1 迁移（全站共用）
```

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

对外文案走 `AGENTS.md`「对外文案分通道」和 `packages/site-cli/prompts/write-copy.md`。`industry.json` 要有对象、痛点、说法三层；竞品只作笔记。不要用「不要写成某行业」当指令。`validate` 拦空文案、源站全等和对照式否定结构。

---

## 6. 修改首页区块顺序（Blueprint）

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

**策略**：所有站点共用一个 D1 实例 `trade-platform`，用 `site_id` 列隔离数据。

| 表 | 用途 |
|----|------|
| `contact_submissions` | 联系表单提交 |
| `assets` | R2 文件元数据 |
| `page_content` | 可选运行时文案覆盖（预留） |

当前站点 `site_id`：`ratahome-furniture`（见 `site.config.ts` 与 `wrangler.jsonc` 的 `SITE_ID`）。

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

1. 在 Cloudflare 创建 D1 数据库 `trade-platform`，更新 `sites/ratahome-furniture/wrangler.jsonc` 中的 `database_id`
2. 创建 R2 bucket `trade-platform-assets`
3. 执行远程迁移：`pnpm db:migrate:remote`
4. 部署：`pnpm cf:deploy`

---

## 13. 新增站点（site-cli）

```bash
# 查看可用行业模板
pnpm site-cli templates

# 从家具模板创建（b2b-manufacturing）
pnpm site-cli create my-furniture --from b2b-manufacturing --name "My Furniture"

# 从干净骨架创建（packages/site-cli/skeletons/b2b-textile），不是从已上线站拷
pnpm site-cli create textile-apparel --from b2b-textile --name "Textile Apparel"
# 或写入该站简报（对象 + 痛点 + 说法）：
# pnpm site-cli create textile-apparel --from b2b-textile --name "Textile Apparel" --brief ./apparel.brief.json

# 校验：必填文案、源站字段全等、对照式否定结构、导航/品类死链均为 error
pnpm site-cli validate textile-fabric

# 本地开发
pnpm --filter textile-fabric dev

# 部署（需 wrangler login + D1/R2 配置）
pnpm site-cli deploy textile-fabric
pnpm site-cli deploy textile-fabric --dry-run   # 仅打印命令
```

创建后先填 `sites/<slug>/industry.json` 三层：对象（访客、交付物、`catalogPrefix`、品类、页面）、痛点（`pains`）、说法（`phrases`、`references`）。再按 `packages/site-cli/prompts/write-copy.md` 写 `content/{en,zh}/`。对象齐而痛点 / 说法空时，`create` 会警告，先补简报再写。不要加「不要写成某行业」。然后 `validate`。可用模板见 `pnpm site-cli templates`。`deploy` 会先跑 `validate`，未过不能发布。

`--brief` 写入 `industry.json`；对象层套到 `slugs.ts` 与品类路由前缀。痛点和说法不进路由，只给写文案用。

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

- 架构与进度：`ROADMAP.md`
- Agent 协作规范：`AGENTS.md`
- 项目概览：`README.md`
