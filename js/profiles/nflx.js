// Netflix dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.NFLX = {
  firstQuarter: "2019-Q1",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    for (const r of all) {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.op_m = pct(r.opinc, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.fcf, r.rev);
      r.content_ratio = r.content_cash && r.content_amort ? r.content_cash / r.content_amort : null;
      r.r40_fcf = r.rev_yoy != null && r.fcf_m != null ? r.rev_yoy + r.fcf_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
    }
  },
  build({ rows, last, ly, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const fy = y => rows.filter(r => r.q.startsWith(y));
    const ytd = (y, k) => fy(y).reduce((s, r) => s + (r[k] || 0), 0);
    const kpis = `
      ${kpi("Revenue", fmt.money(last.rev), chg(last.rev, ly.rev, "YoY"))}
      ${kpi("Operating margin", last.op_m.toFixed(1) + "%", `vs ${ly.op_m.toFixed(1)}% a year ago`)}
      ${kpi("Diluted EPS", ps(last.eps), chg(last.eps, ly.eps, "YoY"))}
      ${kpi("Free cash flow", fmt.money(last.fcf), `${fmt.money(ytd(last.q.slice(0, 4), "fcf"))} year to date`)}
      ${kpi("Buybacks", fmt.money(last.buyback), `${fmt.money(ytd(last.q.slice(0, 4), "buyback"))} year to date`)}
      ${kpi("Diluted shares", Math.round(last.shares).toLocaleString() + "M", chg(last.shares, ly.shares, "YoY"))}
`;
    const tlStats = r => `Rev ${fmt.money(r.rev)} (${fmt.pct(r.rev_yoy)} YoY) · Op margin ${r.op_m.toFixed(1)}% · EPS ${ps(r.eps)} · FCF ${fmt.money(r.fcf)}${r.paid ? ` · ${r.paid.toFixed(1)}M members` : ""}`;
    const cols = [
      ["Revenue ($M)", r => r.rev / 1e3, 0], ["Revenue YoY %", r => r.rev_yoy, 1],
      ["UCAN revenue ($M)", r => r.ucan_rev / 1e3, 0], ["EMEA revenue ($M)", r => r.emea_rev / 1e3, 0], ["LATAM revenue ($M)", r => r.latam_rev / 1e3, 0], ["APAC revenue ($M)", r => r.apac_rev / 1e3, 0],
      ["Rule of 40 — FCF", r => r.r40_fcf, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["Operating income ($M)", r => r.opinc / 1e3, 0], ["Operating margin %", r => r.op_m, 1],
      ["Net income ($M)", r => r.ni / 1e3, 0], ["Diluted EPS ($, split-adj.)", r => r.eps, 2],
      ["Paid memberships (M)", r => r.paid, 2], ["Paid net adds (M)", r => r.adds, 2], ["UCAN ARM ($)", r => r.ucan_arm, 2],
      ["Content cash spend ($M)", r => r.content_cash / 1e3, 0], ["Content amortization ($M)", r => r.content_amort / 1e3, 0], ["Cash/amortization ratio", r => r.content_ratio, 2],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 0], ["Capex ($M)", r => r.capex / 1e3, 0], ["Free cash flow ($M)", r => r.fcf / 1e3, 0],
      ["Buybacks ($M)", r => r.buyback / 1e3, 0], ["Stock-based comp ($M)", r => r.sbc / 1e3, 0],
      ["Diluted shares (M, split-adj.)", r => r.shares, 0],
    ];
    const $B = v => v == null ? null : v / 1e6;
    const lastMem = rows.filter(r => r.paid != null).slice(-1)[0];
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", nonneg: false,
        cap: () => `${fmt.q(last.q)}: ${last.r40_fcf.toFixed(0)} on free cash flow, ${last.r40_gaap.toFixed(0)} on strict GAAP. Q1'26 spike = one-time $2.8B fee.`,
        series: [{ label: "Growth + FCF margin", c: "--s1", f: r => r.r40_fcf }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Revenue", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} YoY.`,
        series: [{ label: "Revenue", c: "--s1", f: r => $B(r.rev) }] },
      { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line", zero: true,
        cap: () => `${fmt.pct(last.rev_yoy)} in ${fmt.q(last.q)}; bottomed at +1.9% in Q4'22.`,
        series: [{ label: "YoY growth", c: "--s1", f: r => r.rev_yoy }] },
      { key: "regions", title: "Revenue by region", unit: "$B", type: "bar", stacked: true,
        cap: () => `UCAN ${fmt.money(last.ucan_rev)} · EMEA ${fmt.money(last.emea_rev)} · LATAM ${fmt.money(last.latam_rev)} · APAC ${fmt.money(last.apac_rev)}.`,
        series: [{ label: "UCAN", c: "--s1", f: r => $B(r.ucan_rev) }, { label: "EMEA", c: "--s2", f: r => $B(r.emea_rev) }, { label: "LATAM", c: "--s3", f: r => $B(r.latam_rev) }, { label: "APAC", c: "--s4", f: r => $B(r.apac_rev) }] },
      { key: "opm", title: "Operating margin", unit: "%", type: "line", zero: true,
        cap: () => `${last.op_m.toFixed(1)}% in ${fmt.q(last.q)}. Q4 is always the low point; Q4'26 guided to 26%.`,
        series: [{ label: "Operating margin", c: "--s1", f: r => r.op_m }] },
      { key: "profit", title: "Net income", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.ni)} in ${fmt.q(last.q)}, ${fmt.pct(growth(last.ni, ly.ni))} YoY.`,
        series: [{ label: "Net income", c: "--s1", f: r => $B(r.ni) }] },
      { key: "eps", title: "Diluted EPS (split-adjusted)", unit: "$", type: "line", zero: true,
        cap: () => `${ps(last.eps)} in ${fmt.q(last.q)} vs ${ps(ly.eps)} a year ago (pre-Nov-2025 values ÷ 10).`,
        series: [{ label: "Diluted EPS", c: "--s1", f: r => r.eps }] },
      { key: "members", title: "Paid memberships (to Q4'24)", unit: "M", type: "bar",
        cap: () => `${lastMem.paid.toFixed(0)}M at ${fmt.q(lastMem.q)}, the last reported count. Netflix said it passed 325M in Q4'25.`,
        series: [{ label: "Paid memberships", c: "--s1", f: r => r.paid }] },
      { key: "adds", title: "Paid net additions (to Q4'24)", unit: "M", type: "bar",
        cap: () => `Record 18.9M in Q4'24; two negative quarters in 2022.`,
        series: [{ label: "Paid net adds", c: "--s2", f: r => r.adds }] },
      { key: "arm", title: "Monthly revenue per member (ARM) by region", unit: "$", type: "line", nonneg: true,
        cap: () => `UCAN $${lastMem.ucan_arm.toFixed(2)} vs APAC $${lastMem.apac_arm.toFixed(2)} at ${fmt.q(lastMem.q)}. Reported through 2024.`,
        series: [{ label: "UCAN", c: "--s1", f: r => r.ucan_arm }, { label: "EMEA", c: "--s2", f: r => r.emea_arm }, { label: "LATAM", c: "--s3", f: r => r.latam_arm }, { label: "APAC", c: "--s4", f: r => r.apac_arm }] },
      { key: "content", title: "Content: cash spend vs amortization", unit: "$B", type: "bar",
        cap: () => `Ratio ${last.content_ratio.toFixed(2)}x in ${fmt.q(last.q)} (FY26 target ~1.1x) vs 1.4–1.6x in 2019.`,
        series: [{ label: "Cash spend on content", c: "--s1", f: r => $B(r.content_cash) }, { label: "Content amortization", c: "--s2", f: r => $B(r.content_amort) }] },
      { key: "cash", title: "Operating cash flow and free cash flow", unit: "$B", type: "bar",
        cap: () => `FCF ${fmt.money(last.fcf)} in ${fmt.q(last.q)}; ~$12B guided for 2026.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $B(r.ocf) }, { label: "Free cash flow", c: "--s3", f: r => $B(r.fcf) }] },
      { key: "buyback", title: "Share buybacks", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.buyback)} in ${fmt.q(last.q)}, a record. No dividend.`,
        series: [{ label: "Buybacks", c: "--s1", f: r => $B(r.buyback) }] },
      { key: "shares", title: "Diluted share count (split-adjusted)", unit: "M", type: "line", nonneg: true,
        cap: () => `${Math.round(last.shares).toLocaleString()}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY.`,
        series: [{ label: "Diluted shares", c: "--s1", f: r => r.shares }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
