# 一站一仓与多语言蓝图前门禁

本文件是仓库模型与多语言灌站前门禁的规范正文。`AGENTS.md`、`docs/USAGE.md`、`docs/blueprint-rules.md`、`docs/teardown-workflow.md` 用链接指向此处，不在多处复制细则。

既有蓝图硬规则仍然有效：不为迁就模板改蓝图；copy-final 只写买家可见文案；composition ≠ 文案蓝图。本节是补充，不是推翻。规则全文见 `docs/blueprint-rules.md` 。

---

## 仓库模型

- 本仓 `yangzec/ratahome-astro` 的 **main = 纯模板仓**（空壳 `sites/b2b-shell`、共享 packages、create / 校验、文档）。
- **新站一站一仓**：品牌站部署源码进独立 Git 仓，钉住某一版模板后再 deploy；不要再默认在本仓 `sites/<slug>/` 堆新品牌成品。
- 已在本仓的老站（如 `ratahome-furniture`、`aureline-yarns`、`loftknit-oem`、`atelierbag-oem` 等）过渡期可留着，有空再迁。文档区分「过渡」与「新站默认」。
- D1 共用 `trade-platform`，按 `site_id` / `SITE_ID` 隔离，**只管运行时询盘等**，不用数据库管部署文件 / 文案源。
- 构建产物 `dist` 不进 Git；大图优先对象存储；竞品抓取包与 Suggest 词表作资料归档，不进部署树。

### 新站默认（一句话）

钉住某一版模板 → 新建独立品牌站仓 → 按已验收的 copy-final 写入 `content/en/`、`content/zh/` → 从该站仓 deploy。

### 本仓 `site-cli create`（过渡 / 不推荐新站再用）

`pnpm site-cli create <slug> --from b2b-manufacturing` 仍会把空壳复制进本仓 `sites/<slug>/`。这是过渡路径：只用于已在本仓的老站维护，或尚未迁出的实验。新品牌站不要再用这条路径当默认建站方式。操作步骤见 `docs/USAGE.md` §13。

---

## 多语言（蓝图阶段，灌站前）

- 同站内：一套槽位 / 路由结构，按 locale 分文案（`content/en/`、`content/zh/`），**不是**每语种一个仓库，也不是互不相干的行业蓝图。
- 顺序：Google Suggest 收各语种真实说法 → 人工确认本地化表达 → EN 先出 copy-final 母版 → 其他语种同槽位本地化 copy-final（禁止机翻当定稿）→ 再灌 `content/<locale>/`。
- 有 locale 文件 ≠ 做过关键词 / 本地化验收。
- Ads 关键词规划师可选、用于后期排量级 / 竞争；早期不必上 Ads。
- 行业横比蓝图按产品线一份结构参考；落到品牌站再拆各语种 copy-final。

灌站前四步门禁与拆站插入点见 `docs/teardown-workflow.md` 。
