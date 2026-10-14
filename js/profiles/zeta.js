// Zeta Global dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.ZETA = {
  firstQuarter: "2021-Q2",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    for (const r of all) {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.ebitda_m = pct(r.ebitda, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.fcf, r.rev);
      r.sbc_pct = pct(r.sbc, r.rev);
      r.cor_pct = pct(r.cor, r.rev); r.sm_pct = pct(r.sm, r.rev); r.ga_pct = pct(r.ga, r.rev); r.rd_pct = pct(r.rd, r.rev);
      r.r40_adj = r.rev_yoy != null && r.ebitda_m != null ? r.rev_yoy + r.ebitda_m : null;
      r.r40_fcf = r.rev_yoy != null && r.fcf_m != null ? r.rev_yoy + r.fcf_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
      r.ss_yoy = growth(r.superscaled, py.superscaled);
    }
  },
  build({ rows, last, ly, lq, kpi, chg, meta }) {
    const kpis = `
      ${kpi("Revenue", fmt.money(last.rev), chg(last.rev, ly.rev, "YoY") + (last.organic_yoy ? ` · ${last.organic_yoy}% organic` : ""))}
      ${kpi("Adj. EBITDA", fmt.money(last.ebitda), `margin ${last.ebitda_m.toFixed(1)}% · ${chg(last.ebitda, ly.ebitda, "YoY")}`)}
      ${kpi("GAAP net income", fmt.money(last.ni), `EPS $${last.eps?.toFixed(2)} · margin ${last.ni_m.toFixed(1)}%`)}
      ${kpi("Free cash flow", fmt.money(last.fcf), `margin ${last.fcf_m.toFixed(1)}% · ${chg(last.fcf, ly.fcf, "YoY")}`)}
      ${kpi("Super-scaled customers", String(last.superscaled), chg(last.superscaled, ly.superscaled, "YoY"))}
      ${kpi("Stock comp / revenue", last.sbc_pct.toFixed(1) + "%", `${fmt.money(last.sbc)} in ${fmt.q(last.q)}`)}
`;
    const tlStats = r => `Rev ${fmt.money(r.rev)} (${fmt.pct(r.rev_yoy)} YoY) · Adj. EBITDA ${fmt.money(r.ebitda)} · NI ${fmt.money(r.ni)}${r.superscaled ? ` · Super-scaled ${r.superscaled}` : ""}`;
    const cols = [
      ["Revenue ($M)", r => r.rev / 1e3, 1], ["Revenue YoY %", r => r.rev_yoy, 1], ["Organic growth %", r => r.organic_yoy, 0],
      ["Rule of 40 — adj. EBITDA", r => r.r40_adj, 0], ["Rule of 40 — FCF", r => r.r40_fcf, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["Adj. EBITDA ($M)", r => r.ebitda / 1e3, 1], ["Adj. EBITDA margin %", r => r.ebitda_m, 1],
      ["GAAP net income ($M)", r => r.ni / 1e3, 1], ["GAAP EPS ($)", r => r.eps, 2],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 1], ["Free cash flow ($M)", r => r.fcf / 1e3, 1], ["FCF margin %", r => r.fcf_m, 1],
      ["Stock-based comp ($M)", r => r.sbc / 1e3, 1], ["SBC % of revenue", r => r.sbc_pct, 1],
      ["Cost of revenue %", r => r.cor_pct, 1], ["Sales & marketing %", r => r.sm_pct, 1], ["G&A %", r => r.ga_pct, 1], ["R&D %", r => r.rd_pct, 1],
      ["Scaled customers", r => r.scaled, 0], ["Super-scaled customers", r => r.superscaled, 0],
      ["Scaled ARPU ($K/qtr)", r => r.scaled_arpu_k, 0], ["Super-scaled ARPU ($M/qtr)", r => r.ss_arpu_m, 2],
      ["Direct revenue mix %", r => r.direct_mix, 0], ["Weighted shares (M)", r => r.shares_m, 1],
    ];
    const $M = v => v == null ? null : v / 1e3;
    const nrr = meta.nrr || {};
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", minY: -60,
        cap: () => `${fmt.q(last.q)}: ${last.r40_adj.toFixed(0)} Zeta's way (adj. EBITDA), ${last.r40_fcf.toFixed(0)} on free cash flow, ${last.r40_gaap.toFixed(0)} on strict GAAP.`,
        series: [{ label: "Zeta's way (growth + adj. EBITDA margin)", c: "--s1", f: r => r.r40_adj }, { label: "Cash (growth + FCF margin)", c: "--s2", f: r => r.r40_fcf }, { label: "Strict (growth + GAAP net margin)", c: "--s3", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Revenue", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} year over year. Q4 is the seasonal peak.`,
        series: [{ label: "Revenue", c: "--s1", f: r => $M(r.rev) }] },
      { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line", zero: true,
        cap: () => `Reported ${last.rev_yoy.toFixed(0)}%, organic about ${last.organic_yoy}% (ex-acquisitions & political).`,
        series: [{ label: "Reported", c: "--s1", f: r => r.rev_yoy }, { label: "Organic (ex-M&A & political)", c: "--s2", f: r => r.organic_yoy }] },
      { key: "profit", title: "Profit: GAAP net income vs adjusted EBITDA", unit: "$M", type: "bar",
        cap: () => `Always EBITDA-positive. GAAP turned positive in Q4'24, Q4'25 and Q2'26.`,
        series: [{ label: "GAAP net income", c: "--s1", f: r => $M(r.ni) }, { label: "Adj. EBITDA", c: "--s2", f: r => $M(r.ebitda) }] },
      { key: "margins", title: "Margins", unit: "%", type: "line", minY: -60,
        cap: () => `Adj. EBITDA ${last.ebitda_m.toFixed(1)}%, FCF ${last.fcf_m.toFixed(1)}%, net ${last.ni_m.toFixed(1)}%. Early losses run below the -60% floor.`,
        series: [{ label: "Adj. EBITDA margin", c: "--s1", f: r => r.ebitda_m }, { label: "FCF margin", c: "--s2", f: r => r.fcf_m }, { label: "Net income margin", c: "--s3", f: r => r.ni_m }] },
      { key: "cash", title: "Operating cash flow and free cash flow", unit: "$M", type: "bar",
        cap: () => `FCF ${fmt.money(last.fcf)} in ${fmt.q(last.q)} (${fmt.pct(growth(last.fcf, ly.fcf))} YoY). FY26 guidance: about $255M.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $M(r.ocf) }, { label: "Free cash flow", c: "--s2", f: r => $M(r.fcf) }] },
      { key: "sbc", title: "Stock-based compensation as % of revenue", unit: "%", type: "line", nonneg: true,
        cap: () => `${last.sbc_pct.toFixed(1)}% (${fmt.money(last.sbc)}) in ${fmt.q(last.q)}. Q2'21 was ${rows[0].sbc_pct.toFixed(0)}% (IPO vesting), off the top of the chart.`, maxY: 80,
        series: [{ label: "SBC % of revenue", c: "--s1", f: r => r.sbc_pct }] },
      { key: "costs", title: "Expenses as % of revenue", unit: "%", type: "line", nonneg: true,
        cap: () => `Cost of revenue ${last.cor_pct.toFixed(1)}% · S&M ${last.sm_pct.toFixed(1)}% · G&A ${last.ga_pct.toFixed(1)}% · R&D ${last.rd_pct.toFixed(1)}%.`,
        series: [{ label: "Cost of revenue", c: "--s1", f: r => r.cor_pct }, { label: "Sales & marketing", c: "--s2", f: r => r.sm_pct }, { label: "G&A", c: "--s3", f: r => r.ga_pct }, { label: "R&D", c: "--s4", f: r => r.rd_pct }] },
      { key: "superscaled", title: "Super-scaled customers ($1M+)", unit: "#", type: "bar",
        cap: () => `${last.superscaled}, ${fmt.pct(last.ss_yoy)} YoY. Reported since Q1'22.`,
        series: [{ label: "Super-scaled customers", c: "--s1", f: r => r.superscaled }] },
      { key: "scaled", title: "Scaled customers ($100K+)", unit: "#", type: "bar",
        cap: () => `602 at the end of 2025. No longer reported from 2026.`,
        series: [{ label: "Scaled customers", c: "--s1", f: r => r.scaled }] },
      { key: "ssarpu", title: "Super-scaled ARPU (per quarter)", unit: "$Mx", type: "line",
        cap: () => `$${last.ss_arpu_m}M per customer in ${fmt.q(last.q)}, +17% YoY as reported (chart values are rounded to $0.1M).`,
        series: [{ label: "Super-scaled ARPU", c: "--s1", f: r => r.ss_arpu_m }] },
      { key: "sarpu", title: "Scaled customer ARPU (per quarter)", unit: "$K", type: "line",
        cap: () => `$625K in Q4'25. Spikes every Q4 (holiday campaigns).`,
        series: [{ label: "Scaled ARPU", c: "--s1", f: r => r.scaled_arpu_k }] },
      { key: "direct", title: "Direct platform revenue mix", unit: "%", type: "line",
        cap: () => `${last.direct_mix}% in ${fmt.q(last.q)}, down from 75% a quarter ago. Higher is better for margins.`,
        series: [{ label: "Direct mix", c: "--s1", f: r => r.direct_mix }] },
      { key: "nrr", title: "Net revenue retention (annual)", unit: "%", type: "bar", fixed: true,
        cap: () => `Record 120% in 2025 (ex-LiveIntent). Zeta 2028 plan: 110–115%.`,
        custom: () => ({ labels: Object.keys(nrr).map(y => "FY" + y.slice(2)), series: [{ label: "NRR", c: "--s1", data: Object.values(nrr) }] }) },
      { key: "shares", title: "Weighted shares used for GAAP EPS", unit: "M", type: "bar",
        cap: () => `${Math.round(last.shares_m)}M in ${fmt.q(last.q)} vs ${Math.round(rows.find(r => r.shares_m).shares_m)}M in early 2022. Gaps: no comparable figure disclosed.`,
        series: [{ label: "Weighted shares", c: "--s1", f: r => r.shares_m }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
