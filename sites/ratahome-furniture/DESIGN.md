# DESIGN -- ratahome-furniture

> 本站锁稿。母版与用法见 `docs/DESIGN.md` 。

## 模板：`b2b-manufacturing`

## 卖给谁：海外业主、室内设计师、开发商、酒店项目（主市场：英语国家住宅与项目，文案提到 Sydney 到 LA）

## 语言：`en` + `zh`（默认英文 `/` ，中文 `/zh/` ）

## 一句话承诺：One Partner for the Whole Home, Wherever You Build.

## 访客要记住：整屋按一个项目交付，而不是一堆供应商

## 访客该干什么：Start Your Project（锚到首页 `#upload` ；备用 WhatsApp）

## 锁死事实（没有就留空，禁止编造）
- 品类：整屋家具、定制柜体、灯具与材料，佛山制造协同
- 首页主卡片：4 个受众 + 4 项能力 + 8 个房间入口（不是 3–6 个 SKU）
- MOQ / 起订：
- 交期：典型整包约 7 weeks；案例有 Delivered in 9 weeks
- 证书 / 质保：3-Year Structural Warranty；100% Pre-Shipment Inspection；Insured Export Packing；48-Hour After-Sales Response
- 发货地 → 主市场：Foshan, China → 海外住宅与项目
- 货币：
- 主联系渠道 + 备用：WhatsApp +86 151 9256 9580 ；hello@ratahome.com

## 视觉意图（落地到 theme.json）
- 气质：暖奶油底 + 陶土强调色 + 衬线标题，偏整屋项目站，不是电商目录
- 背景：`#FCF7F3` → `colors.cream`（`252 247 243`）
- 主色 / 按钮：`#C05C15` → `colors.accent`（`192 92 21`）
- 标题色：`#2B2C27` → `colors.ink`（`43 44 39`）
- 深底：`#1A1A1A` → `colors.charcoal` ；页脚 / 深色块 `#1B1C17` → `colors.chrome`
- 标题字体：Cinzel → `fonts.display`
- 正文字体：Inter → `fonts.sans`
- 标签字体：Poppins → `fonts.label`
- 圆角：hero `25px`，image `20px`，pill `100px`

## 图片
- 首屏：全幅家居场景（现用 `/images/hero-living-v2.webp` ）
- 受众 / 能力 / 房间卡：横图场景，同一区块内比例统一
- 流程 / 交付：场景或货柜图，需要工厂图时再用 4:3
- 无自动播放视频

## 首页板块意图（实现以 blueprints/home.json 为准）
现序：Hero → 信任条 → 数据条 → 受众 → 能力 → 流程 → 评价 → 质保 → 房间 → 案例 → 产业带 → 询盘。
本站是项目询盘，不是 3–6 SKU 目录；主品用房间和整屋能力表达。

## 验收
- 首屏 3 秒看出：整屋家具项目、海外客户、Start Your Project
- 主 CTA 在导航和首页询盘区可点；WhatsApp 在顶栏和页脚可点
- 375 宽无横滚，正文 ≥16px
- 配色与 `theme.json` 一致
- 页面无公开价，询盘出口必须在
- 未锁的 MOQ、证书名、币种不上页
