# 首页文案标准（Copy Section Standard）

适用站点：`textile-apparel` · `textile-fabric` · `textile-home` · `ratahome-furniture`  
家具站用家具版角色表，不与纺织三站混用。

`pnpm site-cli validate <slug>` 按本文件做两层护栏。判定细则见下文「护栏」；写作细则见各区块定位。

---

## 0. 总原则（所有区块）

1. **区块定位优先**：先服务该区块的工作，不借机讲整站故事。
2. **行业词落地**：用该行业买家听得懂的词（规格、工艺、交期、验货），禁止空泛平台腔。
3. **对目标用户说话**：默认 B2B 采购 / 产品 / 开发，不写 C 端生活方式散文。家具站可对业主说话，但仍是项目交付，不是生活方式杂志。
4. **禁止生搬硬套**：
   - 禁止家具站句式直接换品类（「complete home」「floor plan」「Foshan manufacturing ecosystem」原样挪到纺织）。
   - 禁止三站共用同一套「Programs for every buyer in the chain」类万能标题而不改行业含义。
   - 禁止 blueprint 家具区块名残留在对外语义里（如纺织站仍用「Explore by room」讲客房，却实际是面料分类 -- 必须改角色或改文案）。
5. **禁止过度解释**：
   - 一句说清即可；不堆「instead of… you work with… turning X into Y」长因果。
   - 不解释买家显然知道的常识（什么是 OEM、什么是 GSM）除非该区块职责就是教育。
   - description 不重复 title；列表项不写散文。
6. **内外分离**：无内部备注、无模板 / 复刻 / Agent 用语、英文页无汉字草稿。

判定时：违反 4/5/6 → 倾向 `block`；仅略啰嗦但角色正确 → `review`；角色对、行业对、短而准 → `pass`。

行业词如 OEKO-TEX、GOTS、BSCI、MOQ、PP、lab dip、GSM、AQL **不得**因「内部腔 / 不像人话」自动失败。

---

## 1. 行业画像（写文案前必读）

| site_id | 卖什么 | 主用户 | 产地 / 语境（可写实，勿神话） | 核心买家问题 |
|--------|--------|--------|------------------------------|--------------|
| textile-apparel | 针织 / 梭织成衣 OEM·ODM | Brands / Retailers / Agents / Product developers | 绍兴、广州等裁剪缝制 | 打版、放码、产前样、大货、装箱出口 |
| textile-fabric | 梭织 / 针织面料 | Brands / Manufacturers / Traders / Product developers | 绍兴、广州等织厂 | 成分克重、色卡、起订、交期、出货 |
| textile-home | 酒店床品、浴巾毛巾、窗帘等 | Hotels / Retailers / Developers / Product developers | 南通、广州等家纺车间 | 房型等级、GSM、尺码、绣花、套装包装 |
| ratahome-furniture | 整案家具 / 柜体 / 灯光软装 | Homeowners / Designers / Builders / Hospitality | 佛山制造与出口包装 | 整屋范围、户型图、交期、质保、验货 |

纺织三站共用 `b2b-textile` 模板，**文案不得串台**（面料站不讲裁缝大货细节当主承诺；成衣站不把「色卡 / 克重」写成唯一能力）。家具站不套用纺织认证当主叙事。

---

## 2. 区块定位表（blueprint section → `home.json` 键）

`SECTION_MAP`（Layer A 硬拦未知 id 与缺失键）：

| Blueprint id | content key |
|--------------|-------------|
| `hero-fullbleed` | `hero` |
| `assurance-bar` | `assurances` |
| `metrics-bar` | `metrics` |
| `audience-cards` | `audiences` |
| `capabilities-grid` | `capabilities` |
| `process-timeline` | `process` |
| `rooms-grid` | `rooms` |
| `testimonials` | `testimonials` |
| `warranty-cases` | `warranty` |
| `contact-cta` | `cta` |
| `projects-showcase` | `projects` |
| `ecosystem` | `ecosystem` |

纺织三站当前 blueprint 顺序：  
`hero` → `assurance` → `metrics` → `audience` → `capabilities` → `process` → `rooms` → `testimonials` → `warranty` → `contact-cta`  

content 里若仍有 `projects` / `ecosystem` 但未进 blueprint，**不对外展示则不审展示文案；若误挂上线按错位 block**。

### hero-fullbleed → `hero`

- **定位**：3 秒内说清「谁、做什么、给谁」。
- **应有**：品类 + 服务形态（OEM/ODM / 面料供应 / 家纺项目 / 整案家具）+ 一处具体锚点（产地或交付方式）。
- **不应有**：万能「one partner for everything」；生活方式长描述；解释整条供应链哲学。
- **长度**：title 一行；description ≤ 2 短句。

### assurance-bar → `assurances`

- **定位**：可核对的承诺条（质检、交期响应、包装、售后），每条一个事实。
- **应有**：行业可验证项（成衣：产前样 / 针数；面料：色牢 / 批差；家纺：GSM / 缩水；家具：结构质保）。
- **不应有**：空泛「trusted / premium / world-class」无对象；把营销口号当 assurance。

### metrics-bar → `metrics`

- **定位**：可扫读的数字社会证明。
- **应有**：交期、产能、出口市场、验货率等**买家决策相关**数字。
- **不应有**：与品类无关的指标挪用（如纺织站写「1200+ homes」）。

### audience-cards → `audiences`

- **定位**：按**买家角色**分流，不是按产品线说明书。
- **应有**：每卡：角色名 + 他真正要的结果（一句）。
- **不应有**：纺织站套「Solutions for every project」家具腔；四张卡文案同质；对消费者讲「梦想之家」。

### capabilities-grid → `capabilities`

- **定位**：买家首轮会问的能力清单（可点名进询盘）。
- **应有**：该站行业动词 / 名词（放码、色卡、绣花、套装包装、柜体…）。
- **不应有**：把流程步骤塞进能力格；过度解释「why one team」。

### process-timeline → `process`

护栏按行业拆角色，不把家具项目路径按纺织「询盘 → 大货」来判。

- **定位（纺织）**：从询盘到出货的步骤，一步一个动作。
  - **应有**：询价 → 打样 / 打色 → 确认 → 大货 → 验货出运（按站微调）。
  - **不应有**：家具「Discover / Design / Curate」原样照搬且无纺织含义；每步写小作文。
- **定位（家具）**：整案项目路径，一步一个动作。
  - **应有**：了解 / 简报 → 设计 → 甄选 / 规格 → 制造 → 交付（Discover / Design / Curate / Manufacture / Deliver 合法）。
  - **不应有**：把纺织「询盘 → 打色 → 大货出运」写成家具主路径；每步写小作文。

### rooms-grid → `rooms`

- **定位（纺织）**：**产品 / 场景分类导航**，不是住宅「按房间逛」。
  - apparel：款类 / 品类入口，或程序类型。
  - fabric：组织 / 用途。
  - home：床品 / 卫浴 / 窗帘，或酒店场景 -- 若用场景，须像家纺采购，不像卖整屋家具。
- **定位（家具）**：按房间逛是合法角色。
- **不应有**：纺织站残留 Living Room / Dining Room 家具房间表；「Explore the home by room」。

### testimonials → `testimonials`

- **定位**：他人口吻的结果证明（短引用 + 身份）。
- **应有**：与该行业相关的具体结果（交期、品质、沟通）。
- **不应有**：表单 CTA 话术；内部项目绰号；万能好评。

### warranty-cases → `warranty`

- **定位**：出问题怎么办（受损、色差、短装、客诉）-- 问答式承诺。
- **应有**：该行业常见风险（纺织：色差批差、缩水、针洞、绣花错误、包装短缺；家具：运输破损、结构质保）。
- **不应有**：家具「结构保修 3 年」原样搬到纺织；过度法务散文。

### contact-cta → `cta`

- **定位**：下一步行动（发规格 / 色卡需求 / 房型表 / 户型图），不是再讲品牌故事。
- **应有**：要访客提交什么。
- **不应有**：纺织站「send your floor plan」家具挪用；保证成交话术。

### projects-showcase → `projects` / ecosystem → `ecosystem`

家具站可用。案例要有数字结果；产研背书不要写成第二份 capabilities。

---

## 3. Jev 判定题（Layer B）

**不要**把 `internal_voice` 当主问题。每首页区块问：

- **section_mismatch**：是否在做别的区块的工作。
- **generic_boilerplate**：是否像跨行业万能模板、或明显从家具站改词而来。
- **over_explaining**：是否过度解释、重复 title、或写买家已知常识。
- **industry_fit**：是否不符合该 `site_id` 的行业画像与主用户（高分 = 不拟合，按 hazard 路由）。
- **severity**（Score）：问题有多严重。

阈值：review ≥ 0.35，action ≥ 0.70；severity ≥ 2.0 可将 review 提升为 block。

路由：任一 hazard 达 action → `block`；介于 review 与 action 之间 → `review`；否则 `pass`。

---

## 4. 护栏如何跑

### Layer A（确定性，无 API）-- 硬拦

- `en` locale 内容字符串含 CJK
- 占位 / 内部词：TODO、FIXME、TBD、待确认、内部备注、复刻站、`site_id`、老杨、AGENTS.md、NOT SENT、lorem ipsum
- Blueprint section id 不在 `SECTION_MAP`
- Blueprint 对应的 `home.json` 键缺失

### Layer B（TypeSafe Jev System One）

- 环境变量 `TYPESAFE_API_KEY` 有值才跑；本地未设则只跑 Layer A，并打印警告
- CI 仓库 secret 同名；有 key 则 A+B，无 key 则 A + 警告
- 按首页 blueprint 逐区块评估英文 `home.json`

### 退出码

| 结果 | 行为 |
|------|------|
| `block` | `validate` 失败，非 0 退出 |
| 仅 `review` | 打印 warnings，退出 0，不拦合并 |
| `pass` | 通过 |

---

## 5. 修正触发规则

1. `block` → 必须改 `content/{locale}/*.json`（必要时改 blueprint 去掉错误区块），不改组件凑合。
2. 修正 brief 必须写明：站点、section、违反哪条标准、坏摘录、目标改写方向（一句话）。
3. 修完重跑本标准护栏；无 `block` 才可合入 / 部署。
4. 纺织站 `rooms-grid` 若仍是家具房间语义 → 优先改文案角色为品类导航，或从 blueprint 移除。
