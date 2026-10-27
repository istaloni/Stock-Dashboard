// Palantir dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.PLTR = {
  firstQuarter: "2020-Q3",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    for (const r of all) {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.gm = pct(r.gp, r.rev);
      r.op_m = pct(r.opinc, r.rev);
      r.adj_m = pct(r.adjoi, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.adj_fcf, r.rev);
      r.sbc_pct = pct(r.sbc, r.rev);
      r.uscom_yoy = growth(r.uscom, py.uscom);
      r.r40_adj = r.rev_yoy != null && r.adj_m != null ? r.rev_yoy + r.adj_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
    }
  },
  build({ rows, last, ly, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const kpis = `
      ${kpi("Revenue", fmt.money(last.rev), chg(last.rev, ly.rev, "YoY"))}
      ${kpi("US commercial revenue", fmt.money(last.uscom), chg(last.uscom, ly.uscom, "YoY"))}
      ${kpi("Adj. operating margin", last.adj_m.toFixed(0) + "%", `GAAP ${last.op_m.toFixed(0)}% · year ago ${ly.adj_m.toFixed(0)}%`)}
      ${kpi("Rule of 40", last.r40_adj.toFixed(0), `growth ${last.rev_yoy.toFixed(0)}% + adj. margin ${last.adj_m.toFixed(0)}%`)}
      ${kpi("GAAP EPS", ps(last.eps), `adjusted ${ps(last.adj_eps)} · year ago ${ps(ly.eps)}`)}
      ${kpi("Adj. free cash flow", fmt.money(last.adj_fcf), `${last.fcf_m.toFixed(0)}% margin`)}
`;
    const tlStats = r => `Rev ${fmt.money(r.rev)}${r.rev_yoy != null ? ` (${fmt.pct(r.rev_yoy)} YoY)` : ""} · Adj. op margin ${r.adj_m != null ? r.adj_m.toFixed(0) + "%" : "—"} · GAAP NI ${fmt.money(r.ni)} · EPS ${ps(r.eps)}`;
    const cols = [
      ["Revenue ($M)", r => r.rev / 1e3, 1], ["Revenue YoY %", r => r.rev_yoy, 1],
      ["US commercial revenue ($M)", r => r.uscom / 1e3, 0], ["US government revenue ($M)", r => r.usgov / 1e3, 0],
      ["Rule of 40 — adjusted", r => r.r40_adj, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["Gross margin %", r => r.gm, 1], ["GAAP operating income ($M)", r => r.opinc / 1e3, 1], ["GAAP operating margin %", r => r.op_m, 1],
      ["Adjusted operating income ($M)", r => r.adjoi / 1e3, 1], ["Adjusted operating margin %", r => r.adj_m, 1],
      ["GAAP net income ($M)", r => r.ni / 1e3, 1], ["GAAP EPS ($)", r => r.eps, 2], ["Adjusted EPS ($)", r => r.adj_eps, 2],
      ["Sales & marketing ($M)", r => r.sm / 1e3, 1], ["R&D ($M)", r => r.rd / 1e3, 1], ["G&A ($M)", r => r.ga / 1e3, 1],
      ["Cash from operations ($M)", r => r.ocf / 1e3, 1], ["Adjusted free cash flow ($M)", r => r.adj_fcf / 1e3, 1],
      ["Stock-based comp ($M)", r => r.sbc / 1e3, 1], ["SBC % of revenue", r => r.sbc_pct, 1], ["Diluted shares (M)", r => r.shares, 0],
    ];
    const $M = v => v == null ? null : v / 1e3;
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", minY: -100, nonneg: false,
        cap: () => `${fmt.q(last.q)}: ${last.r40_adj.toFixed(0)} on Palantir's adjusted basis, ${last.r40_gaap.toFixed(0)} strict GAAP. Axis cut at −100 (Q3'20 listing charge runs below).`,
        series: [{ label: "Growth + adj. operating margin (Palantir's)", c: "--s1", f: r => r.r40_adj }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Revenue", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} YoY. Q3'26 guide: $2.16B.`,
        series: [{ label: "Revenue", c: "--s1", f: r => $M(r.rev) }] },
      { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line", zero: true,
        cap: () => `${fmt.pct(last.rev_yoy)} in ${fmt.q(last.q)}, up from +13% in Q2'23: twelve straight quarters of acceleration.`,
        series: [{ label: "YoY growth", c: "--s1", f: r => r.rev_yoy }] },
      { key: "us", title: "US commercial vs US government revenue", unit: "$M", type: "bar",
        cap: () => `US commercial ${fmt.money(last.uscom)} (${fmt.pct(last.uscom_yoy)} YoY) vs US government ${fmt.money(last.usgov)}. From Q4'22.`,
        series: [{ label: "US commercial", c: "--s1", f: r => $M(r.uscom) }, { label: "US government", c: "--s2", f: r => $M(r.usgov) }] },
      { key: "margins", title: "Margins", unit: "%", type: "line", minY: -100, nonneg: false,
        cap: () => `Gross ${last.gm.toFixed(0)}% · adjusted operating ${last.adj_m.toFixed(0)}% · GAAP operating ${last.op_m.toFixed(0)}%. Axis cut at −100% (Q3'20: −293%).`,
        series: [{ label: "Gross margin", c: "--s1", f: r => r.gm }, { label: "Adj. operating margin", c: "--s2", f: r => r.adj_m }, { label: "GAAP operating margin", c: "--s3", f: r => r.op_m }] },
      { key: "profit", title: "GAAP net income", unit: "$M", type: "bar", minY: -500,
        cap: () => `${fmt.money(last.ni)} in ${fmt.q(last.q)}. Profitable every quarter since Q4'22. Axis cut at −$500M (Q3'20: −$853M).`,
        series: [{ label: "GAAP net income", c: "--s1", f: r => $M(r.ni) }] },
      { key: "eps", title: "EPS: GAAP vs adjusted", unit: "$", type: "line", zero: true, minY: -0.2, nonneg: false,
        cap: () => `GAAP ${ps(last.eps)}, adjusted ${ps(last.adj_eps)} in ${fmt.q(last.q)}. Axis floor −$0.20 (Q3'20: −$0.94).`,
        series: [{ label: "Adjusted EPS", c: "--s1", f: r => r.adj_eps }, { label: "GAAP EPS", c: "--s2", f: r => r.eps }] },
      { key: "cash", title: "Cash from operations and adjusted free cash flow", unit: "$M", type: "bar",
        cap: () => `Adj. FCF ${fmt.money(last.adj_fcf)} (${last.fcf_m.toFixed(0)}% margin) in ${fmt.q(last.q)}. FY26 guide $4.5–4.7B.`,
        series: [{ label: "Cash from operations", c: "--s1", f: r => $M(r.ocf) }, { label: "Adjusted free cash flow", c: "--s3", f: r => $M(r.adj_fcf) }] },
      { key: "opex", title: "Operating expenses", unit: "$M", type: "bar", stacked: true,
        cap: () => `${fmt.money(last.opex)} in ${fmt.q(last.q)}: ${(last.opex / last.rev * 100).toFixed(0)}% of revenue.`,
        series: [{ label: "Sales & marketing", c: "--s1", f: r => $M(r.sm) }, { label: "R&D", c: "--s2", f: r => $M(r.rd) }, { label: "G&A", c: "--s3", f: r => $M(r.ga) }] },
      { key: "sbc", title: "Stock-based comp as % of revenue", unit: "%", type: "bar", maxY: 100,
        cap: () => `${last.sbc_pct.toFixed(0)}% in ${fmt.q(last.q)} (${fmt.money(last.sbc)}). Axis capped at 100% (Q3'20: 293%).`,
        series: [{ label: "SBC % of revenue", c: "--s2", f: r => r.sbc_pct }] },
      { key: "shares", title: "Diluted share count", unit: "M", type: "line", nonneg: true,
        cap: () => `${Math.round(last.shares).toLocaleString()}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY.`,
        series: [{ label: "Diluted shares", c: "--s1", f: r => r.shares }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
