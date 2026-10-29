// ServiceNow dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.NOW = {
  firstQuarter: "2019-Q1",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    all.forEach((r, i) => {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.sub_yoy = growth(r.sub_rev, py.sub_rev);
      r.crpo_yoy = growth(r.crpo, py.crpo);
      r.op_m = pct(r.opinc, r.rev);
      r.ng_op_m = pct(r.ng_oi, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.fcf, r.rev);
      r.sbc_pct = pct(r.sbc, r.rev);
      const w = all.slice(Math.max(0, i - 3), i + 1);
      r.fcf_ttm_m = w.length === 4 && w.every(x => x.fcf != null && x.rev) ? w.reduce((s, x) => s + x.fcf, 0) / w.reduce((s, x) => s + x.rev, 0) * 100 : null;
      r.r40_fcf = r.sub_yoy != null && r.fcf_ttm_m != null ? r.sub_yoy + r.fcf_ttm_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
    });
  },
  build({ rows, last, ly, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const kpis = `
      ${kpi("Subscription revenue", fmt.money(last.sub_rev), chg(last.sub_rev, ly.sub_rev, "YoY"))}
      ${kpi("cRPO", fmt.money(last.crpo), chg(last.crpo, ly.crpo, "YoY") + " · Q4 guide +18.5%")}
      ${kpi("Non-GAAP op. margin", last.ng_op_m.toFixed(1) + "%", `GAAP ${last.op_m.toFixed(1)}% · year ago ${ly.ng_op_m.toFixed(1)}%`)}
      ${kpi("Non-GAAP EPS", ps(last.ng_eps), `GAAP ${ps(last.eps)} · year ago ${ps(ly.ng_eps)}`)}
      ${kpi("Free cash flow", fmt.money(last.fcf), `${last.fcf_m.toFixed(0)}% margin · TTM ${last.fcf_ttm_m.toFixed(0)}%`)}
      ${kpi("Rule of 40", last.r40_fcf.toFixed(0), `sub. growth ${last.sub_yoy.toFixed(0)}% + TTM FCF margin ${last.fcf_ttm_m.toFixed(0)}%`)}
`;
    const tlStats = r => `Sub rev ${fmt.money(r.sub_rev)}${r.sub_yoy != null ? ` (${fmt.pct(r.sub_yoy)} YoY)` : ""} · non-GAAP op margin ${r.ng_op_m != null ? r.ng_op_m.toFixed(0) + "%" : "—"} · GAAP NI ${fmt.money(r.ni)} · non-GAAP EPS ${ps(r.ng_eps)}`;
    const cols = [
      ["Subscription revenue ($M)", r => r.sub_rev / 1e3, 0], ["Subscription growth %", r => r.sub_yoy, 1], ["Total revenue ($M)", r => r.rev / 1e3, 0],
      ["cRPO ($M)", r => r.crpo / 1e3, 0], ["cRPO growth %", r => r.crpo_yoy, 1],
      ["Rule of 40 — FCF (TTM)", r => r.r40_fcf, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["Subscription gross margin % (GAAP)", r => r.sub_gm, 1], ["Subscription gross margin % (non-GAAP)", r => r.ng_sub_gm, 1],
      ["GAAP operating income ($M)", r => r.opinc / 1e3, 0], ["GAAP operating margin %", r => r.op_m, 1],
      ["Non-GAAP operating income ($M)", r => r.ng_oi / 1e3, 0], ["Non-GAAP operating margin %", r => r.ng_op_m, 1],
      ["GAAP net income ($M)", r => r.ni / 1e3, 0], ["GAAP EPS ($, split-adj.)", r => r.eps, 2], ["Non-GAAP EPS ($, split-adj.)", r => r.ng_eps, 2],
      ["Sales & marketing ($M)", r => r.sm / 1e3, 0], ["R&D ($M)", r => r.rd / 1e3, 0], ["G&A ($M)", r => r.ga / 1e3, 0],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 0], ["Free cash flow ($M)", r => r.fcf / 1e3, 0], ["FCF margin TTM %", r => r.fcf_ttm_m, 1],
      ["Stock-based comp ($M)", r => r.sbc / 1e3, 0], ["Buybacks ($M)", r => r.buyback / 1e3, 0], ["Diluted shares (M, split-adj.)", r => r.shares, 0],
    ];
    const $M = v => v == null ? null : v / 1e3, $B = v => v == null ? null : v / 1e6;
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", nonneg: false,
        cap: () => `${fmt.q(last.q)}: ${last.r40_fcf.toFixed(0)} on subscription growth + trailing FCF margin, ${last.r40_gaap.toFixed(0)} strict GAAP.`,
        series: [{ label: "Sub. growth + TTM FCF margin", c: "--s1", f: r => r.r40_fcf }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Subscription revenue", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.sub_rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.sub_yoy)} YoY. Q4'26 guide: $4.25B.`,
        series: [{ label: "Subscription revenue", c: "--s1", f: r => $B(r.sub_rev) }] },
      { key: "growth", title: "Subscription revenue growth, year over year", unit: "%", type: "line", nonneg: true,
        cap: () => `${fmt.pct(last.sub_yoy)} in ${fmt.q(last.q)}. Steady 19–36% for 8 years.`,
        series: [{ label: "Subscription growth", c: "--s1", f: r => r.sub_yoy }, { label: "cRPO growth", c: "--s2", f: r => r.crpo_yoy }] },
      { key: "crpo", title: "cRPO (next-12-month contracted revenue)", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.crpo)} at ${fmt.q(last.q)}, ${fmt.pct(last.crpo_yoy)} YoY. Reported since 2021.`,
        series: [{ label: "cRPO", c: "--s2", f: r => $B(r.crpo) }] },
      { key: "margins", title: "Margins", unit: "%", type: "line", nonneg: false,
        cap: () => `Non-GAAP sub. gross ${last.ng_sub_gm}% · non-GAAP operating ${last.ng_op_m.toFixed(1)}% · GAAP operating ${last.op_m.toFixed(1)}%.`,
        series: [{ label: "Non-GAAP sub. gross margin", c: "--s1", f: r => r.ng_sub_gm }, { label: "Non-GAAP operating margin", c: "--s2", f: r => r.ng_op_m }, { label: "GAAP operating margin", c: "--s3", f: r => r.op_m }] },
      { key: "profit", title: "GAAP net income", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.ni)} in ${fmt.q(last.q)}. Spikes in Q4'19 and Q2'23 are one-time tax benefits.`,
        series: [{ label: "GAAP net income", c: "--s1", f: r => $M(r.ni) }] },
      { key: "eps", title: "EPS: non-GAAP vs GAAP (split-adjusted)", unit: "$", type: "line", zero: true, maxY: 1.2, nonneg: false,
        cap: () => `Non-GAAP ${ps(last.ng_eps)}, GAAP ${ps(last.eps)} in ${fmt.q(last.q)}. Axis capped at $1.20 (Q2'23 GAAP: $1.02 incl. tax benefit).`,
        series: [{ label: "Non-GAAP EPS", c: "--s1", f: r => r.ng_eps }, { label: "GAAP EPS", c: "--s2", f: r => r.eps }] },
      { key: "cash", title: "Operating cash flow and free cash flow", unit: "$B", type: "bar",
        cap: () => `FCF ${fmt.money(last.fcf)} in ${fmt.q(last.q)}; trailing-12-month FCF margin ${last.fcf_ttm_m.toFixed(0)}%. Q1 and Q4 are always the big cash quarters.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $B(r.ocf) }, { label: "Free cash flow", c: "--s3", f: r => $B(r.fcf) }] },
      { key: "opex", title: "Operating expenses (GAAP)", unit: "$B", type: "bar", stacked: true,
        cap: () => `${fmt.money((last.sm || 0) + (last.rd || 0) + (last.ga || 0))} in ${fmt.q(last.q)}.`,
        series: [{ label: "Sales & marketing", c: "--s1", f: r => $B(r.sm) }, { label: "R&D", c: "--s2", f: r => $B(r.rd) }, { label: "G&A", c: "--s3", f: r => $B(r.ga) }] },
      { key: "sbc", title: "Stock-based compensation", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.sbc)} in ${fmt.q(last.q)}, ${last.sbc_pct.toFixed(0)}% of revenue.`,
        series: [{ label: "SBC", c: "--s2", f: r => $M(r.sbc) }] },
      { key: "buyback", title: "Share buybacks", unit: "$M", type: "bar",
        cap: () => `$2.2B in Q1'26; none in Q2–Q3'26.`,
        series: [{ label: "Buybacks", c: "--s1", f: r => $M(r.buyback) }] },
      { key: "shares", title: "Diluted share count (split-adjusted)", unit: "M", type: "line", nonneg: true,
        cap: () => `${Math.round(last.shares).toLocaleString()}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY.`,
        series: [{ label: "Diluted shares", c: "--s1", f: r => r.shares }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
