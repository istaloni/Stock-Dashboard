// NVIDIA dashboard profile (fiscal quarters; FY ends late January): derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.NVDA = {
  firstQuarter: "2020-Q1",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    all.forEach((r, i) => {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.dc_yoy = growth(r.dc, py.dc);
      r.op_m = pct(r.opinc, r.rev);
      r.ng_op_m = pct(r.ng_oi, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.fcf, r.rev);
      r.dc_share = pct(r.dc, r.rev);
      r.returned = (r.buyback || 0) + (r.div || 0);
      const w = all.slice(Math.max(0, i - 3), i + 1);
      r.fcf_ttm_m = w.length === 4 && w.every(x => x.fcf != null && x.rev) ? w.reduce((s, x) => s + x.fcf, 0) / w.reduce((s, x) => s + x.rev, 0) * 100 : null;
      r.r40_fcf = r.rev_yoy != null && r.fcf_ttm_m != null ? r.rev_yoy + r.fcf_ttm_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
    });
  },
  build({ rows, last, ly, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const kpis = `
      ${kpi("Revenue", fmt.money(last.rev), chg(last.rev, ly.rev, "YoY"))}
      ${kpi("Data Center revenue", fmt.money(last.dc), chg(last.dc, ly.dc, "YoY") + ` · ${last.dc_share.toFixed(0)}% of total`)}
      ${kpi("Gross margin", last.gm.toFixed(1) + "%", `non-GAAP ${last.ng_gm.toFixed(1)}% · year ago ${ly.gm.toFixed(1)}%`)}
      ${kpi("Operating margin", last.op_m.toFixed(0) + "%", `vs ${ly.op_m.toFixed(0)}% a year ago`)}
      ${kpi("Diluted EPS", ps(last.eps), `non-GAAP ${ps(last.ng_eps)} · year ago ${ps(ly.ng_eps)}`)}
      ${kpi("Cash returned", fmt.money(last.returned), `buybacks ${fmt.money(last.buyback)} + dividends ${fmt.money(last.div)}`)}
`;
    const tlStats = r => `Rev ${fmt.money(r.rev)}${r.rev_yoy != null ? ` (${fmt.pct(r.rev_yoy)} YoY)` : ""} · DC ${fmt.money(r.dc)} · GM ${r.gm?.toFixed(1)}% · GAAP NI ${fmt.money(r.ni)} · EPS ${ps(r.eps)}`;
    const cols = [
      ["Revenue ($M)", r => r.rev / 1e3, 0], ["Revenue YoY %", r => r.rev_yoy, 1],
      ["Data Center ($M)", r => r.dc / 1e3, 0], ["Data Center YoY %", r => r.dc_yoy, 1], ["Data Center % of revenue", r => r.dc_share, 1],
      ["Gaming ($M)", r => r.gaming / 1e3, 0], ["Professional Visualization ($M)", r => r.proviz / 1e3, 0], ["Automotive ($M)", r => r.auto / 1e3, 0], ["Edge Computing ($M)", r => r.edge / 1e3, 0],
      ["Rule of 40 — FCF (TTM)", r => r.r40_fcf, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["Gross margin % (GAAP)", r => r.gm, 1], ["Gross margin % (non-GAAP)", r => r.ng_gm, 1],
      ["Operating income ($M)", r => r.opinc / 1e3, 0], ["Operating margin %", r => r.op_m, 1], ["Non-GAAP operating income ($M)", r => r.ng_oi / 1e3, 0],
      ["Net income ($M)", r => r.ni / 1e3, 0], ["Non-GAAP net income ($M)", r => r.ng_ni / 1e3, 0],
      ["GAAP EPS ($, split-adj.)", r => r.eps, 3], ["Non-GAAP EPS ($, split-adj.)", r => r.ng_eps, 3],
      ["R&D ($M)", r => r.rd / 1e3, 0], ["SG&A ($M)", r => r.sga / 1e3, 0], ["Stock-based comp ($M)", r => r.sbc / 1e3, 0],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 0], ["Free cash flow ($M)", r => r.fcf / 1e3, 0],
      ["Buybacks ($M)", r => r.buyback / 1e3, 0], ["Dividends ($M)", r => r.div / 1e3, 0], ["Diluted shares (M, split-adj.)", r => r.shares, 0],
    ];
    const $B = v => v == null ? null : v / 1e6;
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", nonneg: false,
        cap: () => `${fmt.q(last.q)}: ${last.r40_fcf.toFixed(0)} on growth + trailing FCF margin, ${last.r40_gaap.toFixed(0)} strict GAAP.`,
        series: [{ label: "Growth + TTM FCF margin", c: "--s1", f: r => r.r40_fcf }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Revenue", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} YoY. Q3 FY27 guide: $108B.`,
        series: [{ label: "Revenue", c: "--s1", f: r => $B(r.rev) }] },
      { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line", zero: true, nonneg: false,
        cap: () => `${fmt.pct(last.rev_yoy)} in ${fmt.q(last.q)}; peaked at +265% in Q4 FY24.`,
        series: [{ label: "Total revenue", c: "--s1", f: r => r.rev_yoy }, { label: "Data Center", c: "--s2", f: r => r.dc_yoy }] },
      { key: "mix", title: "Revenue mix: Data Center vs everything else", unit: "$B", type: "bar", stacked: true,
        cap: () => `Data Center ${last.dc_share.toFixed(0)}% of ${fmt.q(last.q)} revenue. Split reported from Q1 FY21.`,
        series: [{ label: "Data Center", c: "--s1", f: r => $B(r.dc) }, { label: "Gaming, ProViz, Auto, OEM (Edge from FY27)", c: "--s2", f: r => $B(r.other) }] },
      { key: "margins", title: "Margins", unit: "%", type: "line", nonneg: false,
        cap: () => `Gross ${last.gm.toFixed(1)}% · operating ${last.op_m.toFixed(1)}% in ${fmt.q(last.q)}.`,
        series: [{ label: "Gross margin (GAAP)", c: "--s1", f: r => r.gm }, { label: "Operating margin (GAAP)", c: "--s2", f: r => r.op_m }] },
      { key: "profit", title: "Net income: GAAP vs non-GAAP", unit: "$B", type: "bar",
        cap: () => `GAAP ${fmt.money(last.ni)}, non-GAAP ${fmt.money(last.ng_ni)} in ${fmt.q(last.q)}.`,
        series: [{ label: "GAAP net income", c: "--s1", f: r => $B(r.ni) }, { label: "Non-GAAP net income", c: "--s3", f: r => $B(r.ng_ni) }] },
      { key: "eps", title: "Diluted EPS (split-adjusted)", unit: "$", type: "line", zero: true,
        cap: () => `GAAP ${ps(last.eps)}, non-GAAP ${ps(last.ng_eps)} in ${fmt.q(last.q)}.`,
        series: [{ label: "GAAP EPS", c: "--s1", f: r => r.eps }, { label: "Non-GAAP EPS", c: "--s2", f: r => r.ng_eps }] },
      { key: "cash", title: "Operating cash flow and free cash flow", unit: "$B", type: "bar",
        cap: () => `FCF ${fmt.money(last.fcf)} in ${fmt.q(last.q)}; trailing-12-month FCF ${last.fcf_ttm_m.toFixed(0)}% of revenue.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $B(r.ocf) }, { label: "Free cash flow", c: "--s3", f: r => $B(r.fcf) }] },
      { key: "returns", title: "Cash returned to shareholders", unit: "$B", type: "bar", stacked: true,
        cap: () => `${fmt.money(last.returned)} in ${fmt.q(last.q)}; dividend raised to $0.25/share.`,
        series: [{ label: "Buybacks", c: "--s1", f: r => $B(r.buyback) }, { label: "Dividends", c: "--s4", f: r => $B(r.div) }] },
      { key: "opex", title: "Operating expenses", unit: "$B", type: "bar", stacked: true,
        cap: () => `${fmt.money(last.opex)} in ${fmt.q(last.q)}: ${(last.opex / last.rev * 100).toFixed(0)}% of revenue.`,
        series: [{ label: "R&D", c: "--s1", f: r => $B(r.rd) }, { label: "SG&A", c: "--s2", f: r => $B(r.sga) }] },
      { key: "shares", title: "Diluted share count (split-adjusted)", unit: "M", type: "line", nonneg: true,
        cap: () => `${Math.round(last.shares).toLocaleString()}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY.`,
        series: [{ label: "Diluted shares", c: "--s1", f: r => r.shares }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
