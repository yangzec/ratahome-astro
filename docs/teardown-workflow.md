# 拆站流程

先拆单站，再收成行业定稿。前台只吃 copy-final 蓝图文案，不吃 brief / compare。`sites/*/blueprints/*.json` 是 composition（区块顺序），不是文案蓝图。

## 1. 单站

1. 选定一家目标站，记下导航、页脚、页面清单和首页区块。
2. 证据写入 `cross-compare`；建议写入 `brief`；缺口写入 `closure-status`。
3. 这些文件给人看，不进 `sites/*/content/`。

## 2. 行业

1. 把单站结论收成 `industry-*-blueprint.md`：导航、页脚、页面、各 section **最终买家文案**。
2. 蓝图就是定稿。禁止指令腔、执行备注、元评论、未核实数字。见 `/workspace/docs/blueprint-rules.md` 。
3. 同一行业再套站时，复用这份蓝图，不为每家客户另写一套前台口吻。

## 3. 套站

1. 只把 blueprint 写入 `sites/<slug>/content/{en,zh}/*.json`。
2. 导航 href 接到该站已有路由；缺页时只在该站加 slug，不动其他站。
3. `pnpm site-cli validate <slug>` → build → 该站 `cf:deploy`。
