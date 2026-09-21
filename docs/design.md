# 设计与列表栅格

Section 与 `theme.json` 负责高度、栅格、比例、断点。文案条数由 copy-final 蓝图决定，模板按 `items.length` 渲染。

## 列表类 section

- 用 `auto-fit` + `minmax(min(100%, 240px), 1fr)`（步骤类可用 `280px`），或按 length 映射 1 / 2 / 3 / 4 列上限。
- **禁止**把 `lg:grid-cols-4` / `lg:grid-cols-5` / `md:grid-cols-4` 当作唯一布局。写死 N 列会在 2 条时留下右半空栏，在 6 条时把末条挤进 1/5 宽轨道。
- `auto-fit`（不是 `auto-fill`）会收起空轨道，剩余卡片均分行宽。
- `items.length === 0`：隐藏整段，不渲染空标题墙。
- 不为凑满 4 列去 content JSON 里加假条目，也不截断蓝图句子。

示范（共享包已改）：`CapabilitiesSection`、`AudiencesSection`、`ProcessSection` 步骤区走 `ListGrid`。AssuranceBar / MetricsBar / EcosystemSection / RoomsSection 仍有写死列数，后续按同一规则收。

## 站点例外

某站可用本地 section 覆盖 composition（例如 2 条 About 走左文右图）。覆盖仍须响应式，且不得把布局写进 content JSON。
