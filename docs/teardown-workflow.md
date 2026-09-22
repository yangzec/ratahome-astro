# 拆站流程

先拆单站，再收成行业定稿。前台只吃 copy-final 蓝图文案，不吃 brief / compare。`sites/*/blueprints/*.json` 是 composition（区块顺序），不是文案蓝图。

新站默认一站一仓；本仓已填实例过渡期可留。仓库模型见 `docs/site-repo-and-i18n.md` 。蓝图硬规则见 `docs/blueprint-rules.md` 。

## 0. 蓝图前门禁（关键词包 + 多语言表达验收）

写 copy-final **之前**必须过门。未过门不得灌 `content/<locale>/`。

同站内：一套槽位 / 路由结构，按 locale 分文案（`content/en/`、`content/zh/`），**不是**每语种一个仓库，也不是互不相干的行业蓝图。

顺序：

1. **Google Suggest** 收各语种真实说法，整理成关键词包（资料归档，不进部署树）。
2. **人工确认**本地化表达；有 Suggest 词 ≠ 已验收。
3. **EN 先出** copy-final 母版。
4. **其他语种**按同一套槽位写本地化 copy-final（禁止机翻当定稿）。
5. 再灌 `content/<locale>/`。

补充：

- 有 locale 文件 ≠ 做过关键词 / 本地化验收。
- Ads 关键词规划师可选、用于后期排量级 / 竞争；早期不必上 Ads。
- 行业横比蓝图按产品线一份结构参考；落到品牌站再拆各语种 copy-final。

## 1. 单站

1. 选定一家目标站，记下导航、页脚、页面清单和首页区块。
2. 证据写入 `cross-compare`；建议写入 `brief`；缺口写入 `closure-status`。
3. 这些文件给人看，不进部署树，也不进 `content/`。

## 2. 行业

1. 把单站结论收成行业横比蓝图：按产品线一份结构参考（导航、页脚、页面、各 section 槽位）。
2. 落到品牌站前，必须先过 §0，再拆各语种 copy-final。蓝图就是定稿。禁止指令腔、执行备注、元评论、未核实数字。见 `docs/blueprint-rules.md` 。
3. 同一行业再套站时，复用这份结构参考，不为每家客户另写一套互不相干的行业蓝图；各站仍须各自过 §0 并写各语种 copy-final。

## 3. 套站

1. 只把已验收的各语种 copy-final 写入该站 `content/{en,zh}/*.json`。新站写入其独立仓；本仓老站过渡期仍写 `sites/<slug>/content/`。
2. 导航 href 接到该站已有路由；缺页时只在该站加 slug，不动其他站。
3. 校验 → build → 从该站仓 deploy（本仓过渡站仍可用 `pnpm site-cli validate <slug>` 与该站 `cf:deploy`）。`dist` 不进 Git。
