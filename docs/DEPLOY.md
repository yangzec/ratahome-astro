# Cloudflare 部署指南（Ratahome）

## 前置条件

1. Cloudflare 账号，并已安装 [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
2. 本地登录：`cd sites/ratahome-furniture && pnpm exec wrangler login`

## 一次性资源创建

在 Cloudflare Dashboard 或通过 CLI 创建：

| 资源 | 名称 | 说明 |
|------|------|------|
| D1 数据库 | `trade-platform` | 全平台共享，按 `site_id` 隔离 |
| R2 Bucket | `trade-platform-assets` | 对象 key 前缀 `{site_id}/` |

创建 D1 后，将返回的 `database_id` 写入 `sites/ratahome-furniture/wrangler.jsonc`：

```jsonc
"d1_databases": [{
  "binding": "DB",
  "database_name": "trade-platform",
  "database_id": "<你的 database_id>",
  "migrations_dir": "../../migrations"
}]
```

## 部署步骤

```bash
# 仓库根目录
pnpm install
pnpm build

# 远程 D1 迁移（首次或 schema 变更后）
pnpm db:migrate:remote

# 部署 Worker + 静态资源
pnpm cf:deploy
```

部署成功后 Wrangler 会输出 `*.workers.dev` 预览 URL，也可在 Dashboard 绑定自定义域名（如 `ratahome.com`）。

## 环境变量

`wrangler.jsonc` 中已配置：

| 变量 | 值 | 说明 |
|------|-----|------|
| `SITE_ID` | `ratahome-furniture` | D1 / R2 租户隔离 |
| `R2_PUBLIC_URL` | `https://assets.ratahome.com` | 上传返回的公开 URL 前缀（可按实际 CDN 修改） |

## 部署后验证

```bash
# 联系表单
curl -X POST https://<your-domain>/api/contact \
  -H "Origin: https://<your-domain>" \
  -F "locale=zh" \
  -F "name=测试" \
  -F "email=test@example.com" \
  -F "message=部署验证"

# 文件上传
curl -X POST https://<your-domain>/api/upload \
  -H "Origin: https://<your-domain>" \
  -F "file=@./plan.pdf" \
  -F "purpose=floor-plans"
```

在 Cloudflare Dashboard → D1 → `trade-platform` 中确认 `contact_submissions.site_id = ratahome-furniture`。

## 常见问题

| 问题 | 处理 |
|------|------|
| `wrangler login` 未执行 | 先登录再 deploy |
| D1 表不存在 | 运行 `pnpm db:migrate:remote` |
| 表单 500 | 检查 Worker 是否绑定 D1/R2；Astro 7 需使用 `cloudflare:workers` 的 `env`（见 `src/lib/runtime.ts`） |
| R2 上传成功但 URL 404 | 配置 `R2_PUBLIC_URL` 或 R2 自定义域名 |
