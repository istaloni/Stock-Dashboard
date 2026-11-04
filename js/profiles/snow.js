// Snowflake dashboard profile (fiscal quarters; FY ends Jan 31): derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.SNOW = {
  firstQuarter: "2021-Q3",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    all.forEach((r, i) => {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.prod_yoy = growth(r.prod_rev, py.prod_rev);
      r.rpo_yoy = growth(r.rpo, py.rpo);
      r.op_m = pct(r.opinc, r.rev);
      r.ng_op_m = pct(r.ng_oi, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.adj_fcf, r.rev);
      r.sbc_pct = pct(r.sbc, r.rev);
      const w = all.slice(Math.max(0, i - 3), i + 1);
      r.fcf_ttm_m = w.length === 4 && w.every(x => x.adj_fcf != null && x.rev) ? w.reduce((s, x) => s + x.adj_fcf, 0) / w.reduce((s, x) => s + x.rev, 0) * 100 : null;
      r.r40_fcf = r.prod_yoy != null && r.fcf_ttm_m != null ? r.prod_yoy + r.fcf_ttm_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
    });
  },
  build({ rows, last, ly, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const kpis = `
      ${kpi("Product revenue", fmt.money(last.prod_rev), chg(last.prod_rev, ly.prod_rev, "YoY"))}
      ${kpi("Net revenue retention", last.nrr + "%", `year ago ${ly.nrr}%`)}
      ${kpi("$1M+ customers", last.cust1m.toLocaleString(), chg(last.cust1m, ly.cust1m, "YoY"))}
      ${kpi("RPO", fmt.money(last.rpo), chg(last.rpo, ly.rpo, "YoY"))}
      ${kpi("Non-GAAP op. margin", last.ng_op_m.toFixed(1) + "%", `GAAP ${last.op_m.toFixed(1)}% · year ago ${ly.ng_op_m.toFixed(1)}%`)}
      ${kpi("Rule of 40", last.r40_fcf.toFixed(0), `growth ${last.prod_yoy.toFixed(0)}% + TTM adj. FCF margin ${last.fcf_ttm_m.toFixed(0)}%`)}
`;
    const tlStats = r => `Product rev ${fmt.money(r.prod_rev)}${r.prod_yoy != null ? ` (${fmt.pct(r.prod_yoy)} YoY)` : ""} · NRR ${r.nrr ?? "—"}% · non-GAAP op margin ${r.ng_op_m != null ? r.ng_op_m.toFixed(0) + "%" : "—"} · GAAP NI ${fmt.money(r.ni)}`;
    const cols = [
      ["Product revenue ($M)", r => r.prod_rev / 1e3, 1], ["Product revenue growth %", r => r.prod_yoy, 1], ["Total revenue ($M)", r => r.rev / 1e3, 1],
      ["Net revenue retention %", r => r.nrr, 0], ["$1M+ customers", r => r.cust1m, 0], ["RPO ($M)", r => r.rpo / 1e3, 0], ["RPO growth %", r => r.rpo_yoy, 1],
      ["Rule of 40 — FCF (TTM)", r => r.r40_fcf, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["Product gross margin % (GAAP)", r => r.pgm, 1], ["Product gross margin % (non-GAAP)", r => r.ng_pgm, 1],
      ["GAAP operating income ($M)", r => r.opinc / 1e3, 1], ["GAAP operating margin %", r => r.op_m, 1],
      ["Non-GAAP operating income ($M)", r => r.ng_oi / 1e3, 1], ["Non-GAAP operating margin %", r => r.ng_op_m, 1],
      ["GAAP net income ($M)", r => r.ni / 1e3, 1], ["GAAP EPS ($)", r => r.eps, 2], ["Non-GAAP EPS ($)", r => r.ng_eps, 2],
      ["Sales & marketing ($M)", r => r.sm / 1e3, 1], ["R&D ($M)", r => r.rd / 1e3, 1], ["G&A ($M)", r => r.ga / 1e3, 1],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 1], ["Free cash flow ($M)", r => r.fcf / 1e3, 1], ["Adjusted FCF ($M)", r => r.adj_fcf / 1e3, 1],
      ["Stock-based comp ($M)", r => r.sbc / 1e3, 1], ["SBC % of revenue", r => r.sbc_pct, 1], ["Buybacks ($M)", r => r.buyback / 1e3, 1], ["Weighted shares (M)", r => r.shares, 1],
    ];
    const $M = v => v == null ? null : v / 1e3, $B = v => v == null ? null : v / 1e6;
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", nonneg: false,
        cap: () => `${fmt.q(last.q)}: ${last.r40_fcf.toFixed(0)} on product growth + trailing adj. FCF margin, ${last.r40_gaap.toFixed(0)} strict GAAP.`,
        series: [{ label: "Product growth + TTM adj. FCF margin", c: "--s1", f: r => r.r40_fcf }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Product revenue", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.prod_rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.prod_yoy)} YoY. Q3 FY27 guide: $1.59B.`,
        series: [{ label: "Product revenue", c: "--s1", f: r => $B(r.prod_rev) }] },
      { key: "growth", title: "Product revenue growth, year over year", unit: "%", type: "line", nonneg: true,
        cap: () => `${fmt.pct(last.prod_yoy)} in ${fmt.q(last.q)}, up from a low of +26% in Q1 FY26.`,
        series: [{ label: "Product revenue growth", c: "--s1", f: r => r.prod_yoy }] },
      { key: "nrr", title: "Net revenue retention", unit: "%", type: "line", ref: 100, refLabel: "100 = no expansion", nonneg: false,
        cap: () => `${last.nrr}% in ${fmt.q(last.q)}; peaked at 178% in Q4 FY22.`,
        series: [{ label: "NRR", c: "--s2", f: r => r.nrr }] },
      { key: "cust", title: "Customers spending $1M+ a year", unit: "#", type: "bar",
        cap: () => `${last.cust1m} in ${fmt.q(last.q)}, ${fmt.pct(growth(last.cust1m, ly.cust1m))} YoY.`,
        series: [{ label: "$1M+ customers", c: "--s1", f: r => r.cust1m }] },
      { key: "rpo", title: "Remaining performance obligations", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.rpo)} at ${fmt.q(last.q)}, ${fmt.pct(last.rpo_yoy)} YoY. Jumps every Q4 on renewals.`,
        series: [{ label: "RPO", c: "--s2", f: r => $B(r.rpo) }] },
      { key: "margins", title: "Margins", unit: "%", type: "line", nonneg: false, minY: -150,
        cap: () => `Non-GAAP product gross ${last.ng_pgm}% · non-GAAP operating ${last.ng_op_m.toFixed(1)}% · GAAP operating ${last.op_m.toFixed(1)}%.`,
        series: [{ label: "Non-GAAP product gross margin", c: "--s1", f: r => r.ng_pgm }, { label: "Non-GAAP operating margin", c: "--s2", f: r => r.ng_op_m }, { label: "GAAP operating margin", c: "--s3", f: r => r.op_m }] },
      { key: "profit", title: "GAAP net income (loss)", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.ni)} in ${fmt.q(last.q)}, the smallest loss in over three years.`,
        series: [{ label: "GAAP net income (loss)", c: "--s2", f: r => $M(r.ni) }] },
      { key: "eps", title: "EPS: non-GAAP vs GAAP", unit: "$", type: "line", zero: true, nonneg: false,
        cap: () => `Non-GAAP ${ps(last.ng_eps)}, GAAP ${ps(last.eps)} in ${fmt.q(last.q)}.`,
        series: [{ label: "Non-GAAP EPS", c: "--s1", f: r => r.ng_eps }, { label: "GAAP EPS", c: "--s2", f: r => r.eps }] },
      { key: "cash", title: "Operating cash flow and adjusted free cash flow", unit: "$M", type: "bar",
        cap: () => `Adj. FCF ${fmt.money(last.adj_fcf)} in ${fmt.q(last.q)}; trailing-12-month margin ${last.fcf_ttm_m.toFixed(0)}%. Q4 is the big cash quarter.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $M(r.ocf) }, { label: "Adjusted free cash flow", c: "--s3", f: r => $M(r.adj_fcf) }] },
      { key: "sbc", title: "Stock-based comp as % of revenue", unit: "%", type: "bar",
        cap: () => `${last.sbc_pct.toFixed(0)}% in ${fmt.q(last.q)} (${fmt.money(last.sbc)}).`,
        series: [{ label: "SBC % of revenue", c: "--s2", f: r => r.sbc_pct }] },
      { key: "buyback", title: "Share buybacks", unit: "$M", type: "bar",
        cap: () => `$300M in Q1 FY27, none in Q2 FY27.`,
        series: [{ label: "Buybacks", c: "--s1", f: r => $M(r.buyback) }] },
      { key: "shares", title: "Weighted share count", unit: "M", type: "line", nonneg: true,
        cap: () => `${last.shares}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY.`,
        series: [{ label: "Weighted shares", c: "--s1", f: r => r.shares }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
