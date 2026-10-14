// SoFi-specific dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.SOFI = {
  firstQuarter: "2021-Q2",
  derive(all, prevYear) {
    for (const r of all) {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.cons_adjrev, py.cons_adjrev);
      r.members_yoy = growth(r.members, py.members);
      r.ebitda_m = r.cons_ebitda != null && r.cons_adjrev ? r.cons_ebitda / r.cons_adjrev * 100 : null;
      r.ni_m = r.cons_ni != null && r.cons_adjrev ? r.cons_ni / r.cons_adjrev * 100 : null;
      r.lend_m = r.lend_cp != null && r.lend_adjrev ? r.lend_cp / r.lend_adjrev * 100 : null;
      r.fs_m = r.fs_cp != null && r.fs_rev ? r.fs_cp / r.fs_rev * 100 : null;
      r.tech_m = r.tech_cp != null && r.tech_rev ? r.tech_cp / r.tech_rev * 100 : null;
      r.r40_adj = r.rev_yoy != null && r.ebitda_m != null ? r.rev_yoy + r.ebitda_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
      r.ppm = r.products && r.members ? r.products / r.members : null;
      r.orig_total = (r.orig_personal || 0) + (r.orig_student || 0) + (r.orig_home || 0) || null;
      r.nonlend_share = r.fs_rev != null && r.tech_rev != null && r.cons_adjrev ? (r.fs_rev + r.tech_rev) / r.cons_adjrev * 100 : null;
    }
  },
  build({ rows, last, ly, lq, kpi, chg }) {
    const kpis = `
      ${kpi("Adj. net revenue", fmt.money(last.cons_adjrev), chg(last.cons_adjrev, ly.cons_adjrev, "YoY"))}
      ${kpi("GAAP net income", fmt.money(last.cons_ni), `EPS $${last.eps?.toFixed(2)} · margin ${last.ni_m.toFixed(0)}%`)}
      ${kpi("Adj. EBITDA", fmt.money(last.cons_ebitda), `margin ${last.ebitda_m.toFixed(0)}% · ${chg(last.cons_ebitda, ly.cons_ebitda, "YoY")}`)}
      ${kpi("Members", fmt.count(last.members), chg(last.members, ly.members, "YoY"))}
      ${kpi("Deposits", fmt.money(last.deposits, 1), chg(last.deposits, lq.deposits, "QoQ"))}
      ${kpi("Tangible book / share", "$" + last.tbv_ps.toFixed(2), chg(last.tbv_ps, ly.tbv_ps, "YoY"))}
`;
    const tlStats = r => `Rev ${fmt.money(r.cons_adjrev)} (${fmt.pct(r.rev_yoy)} YoY) · NI ${fmt.money(r.cons_ni)} · Members ${fmt.count(r.members)}`;
    const cols = [
    ["Adj. net revenue ($M)", r => r.cons_adjrev / 1e3, 1], ["Revenue YoY %", r => r.rev_yoy, 1],
    ["Rule of 40 — adjusted", r => r.r40_adj, 0], ["Rule of 40 — strict GAAP", r => r.r40_gaap, 0],
    ["GAAP net income ($M)", r => r.cons_ni / 1e3, 1], ["Diluted EPS ($)", r => r.eps, 2],
    ["Adj. EBITDA ($M)", r => r.cons_ebitda / 1e3, 1], ["EBITDA margin %", r => r.ebitda_m, 1],
    ["Lending adj. rev ($M)", r => r.lend_adjrev / 1e3, 1], ["Financial Services rev ($M)", r => r.fs_rev / 1e3, 1], ["Tech Platform rev ($M)", r => r.tech_rev / 1e3, 1],
    ["Lending margin %", r => r.lend_m, 1], ["Fin. Services margin %", r => r.fs_m, 1], ["Tech Platform margin %", r => r.tech_m, 1],
    ["Members (M)", r => r.members / 1e6, 2], ["Products (M)", r => r.products / 1e6, 2], ["Products / member", r => r.ppm, 2],
    ["Originations — personal ($M)", r => r.orig_personal / 1e3, 0], ["Originations — student ($M)", r => r.orig_student / 1e3, 0], ["Originations — home ($M)", r => r.orig_home / 1e3, 0],
    ["Deposits ($M)", r => r.deposits / 1e3, 0], ["Personal loan NCO %", r => r.nco_personal, 2],
    ["PL fair value: discount rate %", r => r.pl_discount, 2], ["PL fair value: default rate %", r => r.pl_default, 2],
    ["Diluted shares (M)", r => r.shares_dil_m, 1], ["Tangible book ($M)", r => r.tbv / 1e3, 0], ["TBV / share ($)", r => r.tbv_ps, 2],
    ["Tech Platform accounts (M)", r => r.tech_accounts / 1e6, 1],
  ];
    const $M = v => v == null ? null : v / 1e3;          // $K -> $M
    const $B = v => v == null ? null : v / 1e6;          // $K -> $B
    const charts = [
    { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass",
      cap: () => `${fmt.q(last.q)}: ${last.r40_adj.toFixed(0)} on SoFi's adjusted basis, ${last.r40_gaap.toFixed(0)} on strict GAAP. Above the dashed line passes.`,
      series: [{ label: "SoFi's way (growth + adj. EBITDA margin)", c: "--s1", f: r => r.r40_adj }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
    { key: "revenue", title: "Adjusted net revenue", unit: "$M", type: "bar",
      cap: () => `${fmt.money(last.cons_adjrev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} year over year.`,
      series: [{ label: "Adj. net revenue", c: "--s1", f: r => $M(r.cons_adjrev) }] },
    { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line",
      cap: () => `Growth bottomed at ${Math.min(...rows.filter(r => r.rev_yoy != null).map(r => r.rev_yoy)).toFixed(0)}% and has re-accelerated to ${last.rev_yoy.toFixed(0)}%.`,
      series: [{ label: "YoY growth", c: "--s1", f: r => r.rev_yoy }] },
    { key: "profit", title: "Profit: GAAP net income vs adjusted EBITDA", unit: "$M", type: "bar",
      cap: () => `GAAP-profitable since Q4'23. Q4'24 includes a one-time $258M tax benefit.`,
      series: [{ label: "GAAP net income", c: "--s1", f: r => $M(r.cons_ni) }, { label: "Adj. EBITDA", c: "--s2", f: r => $M(r.cons_ebitda) }] },
    { key: "margins", title: "Margins", unit: "%", type: "line", minY: -50,
      cap: () => `Adj. EBITDA margin ${last.ebitda_m.toFixed(0)}%, net margin ${last.ni_m.toFixed(0)}%. Axis floor -50%: the Q2'21 and Q3'23 losses run below it.`,
      series: [{ label: "Adj. EBITDA margin", c: "--s1", f: r => r.ebitda_m }, { label: "Net income margin", c: "--s2", f: r => r.ni_m }] },
    { key: "segments", title: "Revenue by segment", unit: "$M", type: "bar", stacked: true,
      cap: () => `Lending ${Math.round(last.lend_adjrev / last.cons_adjrev * 100)}% of adjusted revenue. Bars exclude Corporate/Other, which is negative.`,
      series: [{ label: "Lending (adj.)", c: "--s1", f: r => $M(r.lend_adjrev) }, { label: "Financial Services", c: "--s2", f: r => $M(r.fs_rev) }, { label: "Tech Platform", c: "--s3", f: r => $M(r.tech_rev) }] },
    { key: "segmargins", title: "Segment contribution margin", unit: "%", type: "line", minY: -50,
      cap: () => `Lending ${last.lend_m.toFixed(0)}% · Financial Services ${last.fs_m.toFixed(0)}% · Tech ${last.tech_m.toFixed(0)}%. Financial Services ran deep losses until Q3'23 (below the axis floor).`,
      series: [{ label: "Lending", c: "--s1", f: r => r.lend_m }, { label: "Financial Services", c: "--s2", f: r => r.fs_m }, { label: "Tech Platform", c: "--s3", f: r => r.tech_m }] },
    { key: "members", title: "Members and products", unit: "M", type: "line",
      cap: () => `${fmt.count(last.members)} members, ${fmt.count(last.products)} products.`,
      series: [{ label: "Members", c: "--s1", f: r => r.members && r.members / 1e6 }, { label: "Products", c: "--s2", f: r => r.products && r.products / 1e6 }] },
    { key: "ppm", title: "Products per member", unit: "x", type: "line",
      cap: () => `${last.ppm.toFixed(2)} products per member, a record high.`,
      series: [{ label: "Products / member", c: "--s1", f: r => r.ppm }] },
    { key: "orig", title: "Loan originations", unit: "$B", type: "bar", stacked: true,
      cap: () => `$${$B(last.orig_total).toFixed(1)}B in ${fmt.q(last.q)}. Personal loans include Loan Platform Business volume made for partners.`,
      series: [{ label: "Personal", c: "--s1", f: r => $B(r.orig_personal) }, { label: "Student", c: "--s2", f: r => $B(r.orig_student) }, { label: "Home", c: "--s3", f: r => $B(r.orig_home) }] },
    { key: "deposits", title: "Deposits", unit: "$B", type: "bar",
      cap: () => `Bank charter in early 2022. Deposits now ${fmt.money(last.deposits, 1)}.`,
      series: [{ label: "Total deposits", c: "--s1", f: r => $B(r.deposits) }] },
    { key: "nco", title: "Personal loan net charge-off rate", unit: "%", type: "line",
      cap: () => `${last.nco_personal}% annualized. Reported rate excludes late-stage loans SoFi sells; management's all-in estimate is higher.`,
      series: [{ label: "Annualized NCO", c: "--s1", f: r => r.nco_personal }] },
    { key: "fv", title: "Personal loan fair-value assumptions", unit: "%", type: "line",
      cap: () => `The model inputs behind Lending's fair-value marks. Watch for discount-rate cuts that lift profits.`,
      series: [{ label: "Coupon", c: "--s1", f: r => r.pl_coupon }, { label: "Discount rate", c: "--s2", f: r => r.pl_discount }, { label: "Annual default", c: "--s3", f: r => r.pl_default }] },
    { key: "shares", title: "Diluted share count", unit: "M", type: "bar",
      cap: () => `${last.shares_dil_m.toLocaleString()}M weighted diluted shares, ${fmt.pct(growth(last.shares_dil_m, ly.shares_dil_m))} YoY.`,
      series: [{ label: "Diluted shares", c: "--s1", f: r => r.shares_dil_m }] },
    { key: "tbv", title: "Tangible book value", unit: "$B", type: "bar",
      cap: () => `${fmt.money(last.tbv, 1)} ($${last.tbv_ps.toFixed(2)}/share). The 2H25 jump is mostly equity raised.`,
      series: [{ label: "Tangible book value", c: "--s1", f: r => $B(r.tbv) }] },
    { key: "tech", title: "Tech Platform (Galileo) accounts", unit: "M", type: "line",
      cap: () => `${fmt.count(last.tech_accounts)}, down from a ${fmt.count(Math.max(...rows.map(r => r.tech_accounts || 0)))} peak.`,
      series: [{ label: "Accounts", c: "--s3", f: r => r.tech_accounts && r.tech_accounts / 1e6 }] },
  ];

    return { kpis, tlStats, cols, charts };
  }
};
