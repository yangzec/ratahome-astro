# 蓝图规则（强制）

## 分层

| 层 | 是什么 | 不是什么 |
| --- | --- | --- |
| **copy-final 蓝图**（`industry-*-blueprint.md`） | 买家可见定稿文案：导航标签、页脚、页面与各 section 的句子 | 指令、布局、CSS、栅格、断点、行话（如 fit the brief） |
| **站点 composition**（`sites/*/blueprints/*.json`） | 模板侧：首页 section **列表与顺序** | 文案蓝图；勿称 blueprint |
| **Section + design token** | 高度、栅格、比例、圆角、断点；按 `items.length` 自适应渲染 | 文案来源；不为凑版改 JSON 条数 |
| **brief / cross-compare / closure-status** | 给人看的建议、证据、缺口 | **不上站**，不写入 `sites/*/content/` |

蓝图条数不固定。模板只渲染且必须响应式：有几条画几格，禁止写死 N 列 / N 步，禁止为凑版生造或截断文案。0 条隐藏整段。栅格细则见 `docs/design.md`。

## copy-final 蓝图 = 定稿文案

`industry-*-blueprint.md` 是**可直接上站的买家文案**：

- 导航、页脚、页面清单、各 section 的最终句子（买家口吻）
- EN（及需要的 ZH）正文可上线，不写「草稿」
- 不写「左栏 / 四列 / Hero 85vh」等排版说明

## 蓝图里禁止出现

- 指令腔：Share / 请发 / Please provide / as drawn / 报价路径（作内部词）…
- 执行备注：学 jd、可选、待补、勿照抄、← 注释、给 Agent 的说明
- 元评论：not a slogan wall、内部备忘口吻
- 设计圈行话：fit the brief、对得上简报，以及布局 / CSS / 列数
- 未核实的竞品自称数字（产能、客户名等）

## 建议 / 证据放哪

| 文件 | 角色 | 上站 |
| --- | --- | --- |
| brief | 给人看的一页建议 | 否 |
| cross-compare | 证据横比 | 否 |
| closure-status | 过程缺口 | 否 |
| **copy-final 蓝图** | **前台唯一文案源** | 是（写入 content JSON） |
| `sites/*/blueprints/*.json` | composition（区块顺序） | 是（模板配置，不是文案） |

套站时：只把 copy-final 蓝图写入 content JSON；不要把 brief/compare 里的「学谁」或布局说明写进前台。
