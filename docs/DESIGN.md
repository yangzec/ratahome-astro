# 站点视觉设计母版

每个站点的视觉与转化锁稿。实现文件仍以配置为准，本文只锁意图和验收。

| 文件 | 职责 |
|------|------|
| `docs/DESIGN.md` | 平台母版：新站先复制结构，再按站填写 |
| `sites/{slug}/DESIGN.md` | 该站已填锁稿 |
| `theme.json` | 可执行 token（颜色、字体、圆角） |
| `blueprints/home.json` | 可执行首页区块顺序 |
| `content/{locale}/*.json` | 可执行文案 |

改视觉或承诺时：先改该站 `DESIGN.md`，再改 `theme.json` / Blueprint / content。不要在本文另写一套色值和区块 ID。

---

## 怎么用

1. 新站：`pnpm site-cli create` 会写入空白 `DESIGN.md`（不复制源站已填内容）。
2. 先填「模板、卖给谁、承诺、主 CTA」，再填视觉和板块意图。
3. 把视觉落到 `theme.json`，把板块意图落到 `blueprints/home.json`，把承诺落到 `content/`。
4. 填不出来就留空，禁止编造；空槽事实不上页。
5. 模板没锁，不准往下填视觉细节。

---

## 空白母版

把下面整段写入 `sites/{slug}/DESIGN.md`，按站替换。

```markdown
# DESIGN -- {site_id}

## 模板：____（与 site.config.ts 的 template 对齐，如 b2b-manufacturing）

## 卖给谁：____（买家角色 + 主市场）

## 语言：____（与 site.config.ts 的 locales 对齐；本平台默认 en + zh）

## 一句话承诺：____（品类 + 结果，放首屏）

## 访客要记住：____（一个差异标签，不是品牌名）

## 访客该干什么：____（只锁一个主 CTA，与模板一致）
- 项目询盘：Start Your Project / Request a Quote / WhatsApp
- 样品 / MOQ 询盘：Request Sample / Get Quote
- 不要写 Add to Cart，除非该站明确是零售模板

## 锁死事实（没有就留空，禁止编造）
- 品类：
- 首页主卡片：__（3–6；可以是系列、房间或能力，不要求是 SKU）
- MOQ / 起订：
- 交期：
- 证书 / 质保：
- 发货地 → 主市场：
- 货币：（无公开价则留空）
- 主联系渠道 + 备用：

## 视觉意图（落地到 theme.json）
- 气质：____
- 背景：#____ → `colors.cream`
- 主色 / 按钮：#____ → `colors.accent`
- 标题色：#____ → `colors.ink`
- 标题字体：____ → `fonts.display`
- 正文字体：____ → `fonts.sans`
- 圆角：跟现站 `radius` 键，不另起一套

颜色在 `theme.json` 写 **RGB 空格分隔**（如 `192 92 21`）。此处可用 hex 表达意图，落地时换算。

## 图片
- 首屏：全幅场景，偏 16:9
- 产品 / 房间 / 系列卡：同一页比例统一（1:1 或 4:3）
- 工厂 / 流程：4:3（需要时）
- 禁止自动播放视频

## 首页板块意图（实现以 blueprints/home.json 为准）
默认询盘站：首屏 → 信任条 → 主品或能力 → 为什么找我们 → 询盘。
只写意图和取舍；不要在这里发明新的 Section ID。

## 验收
- 首屏 3 秒看出卖什么、卖给谁、怎么行动
- 主 CTA 在首屏（或主导航）和页尾各一次，可点
- 375 宽无横滚，正文 ≥16px
- 配色与 `theme.json` 一致
- 有价必有币种；无价必有询盘出口
- 空槽事实不出现在页面上
```
