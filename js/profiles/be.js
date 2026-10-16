// Bloom Energy dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.BE = {
  firstQuarter: "2019-Q1",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    for (const r of all) {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.gm = pct(r.gp, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.op_m = pct(r.opinc, r.rev);
      r.ebitda_m = pct(r.ebitda, r.rev);
      r.rp_share = pct(r.relparty, r.rev);
      r.prod_yoy = growth(r.rev_product, py.rev_product);
      r.r40_ebitda = r.rev_yoy != null && r.ebitda_m != null ? r.rev_yoy + r.ebitda_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
    }
  },
  build({ rows, last, ly, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const kpis = `
      ${kpi("Revenue", fmt.money(last.rev), chg(last.rev, ly.rev, "YoY"))}
      ${kpi("Product revenue", fmt.money(last.rev_product), chg(last.rev_product, ly.rev_product, "YoY"))}
      ${kpi("Non-GAAP gross margin", last.ng_gm.toFixed(1) + "%", `GAAP ${last.gm.toFixed(1)}% · year ago ${ly.ng_gm.toFixed(1)}%`)}
      ${kpi("Non-GAAP EPS", ps(last.ng_eps), `GAAP ${ps(last.eps)} · year ago ${ps(ly.ng_eps)}`)}
      ${kpi("Adjusted EBITDA", fmt.money(last.ebitda), `${last.ebitda_m.toFixed(1)}% margin · yr ago ${fmt.money(ly.ebitda)}`)}
      ${kpi("Operating cash flow", fmt.money(last.ocf), `vs ${fmt.money(ly.ocf)} a year ago`)}
`;
    const tlStats = r => `Rev ${fmt.money(r.rev)}${r.rev_yoy != null ? ` (${fmt.pct(r.rev_yoy)} YoY)` : ""} · GM ${r.gm?.toFixed(1)}% · GAAP NI ${fmt.money(r.ni)} · EPS ${ps(r.eps)}`;
    const cols = [
      ["Revenue ($M)", r => r.rev / 1e3, 1], ["Revenue YoY %", r => r.rev_yoy, 1],
      ["Product revenue ($M)", r => r.rev_product / 1e3, 1], ["Installation revenue ($M)", r => r.rev_install / 1e3, 1],
      ["Service revenue ($M)", r => r.rev_service / 1e3, 1], ["Electricity revenue ($M)", r => r.rev_elec / 1e3, 1],
      ["Related-party revenue ($M)", r => r.relparty / 1e3, 1], ["Related-party share %", r => r.rp_share, 1],
      ["Rule of 40 — EBITDA", r => r.r40_ebitda, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["GAAP gross margin %", r => r.gm, 1], ["Non-GAAP gross margin %", r => r.ng_gm, 1],
      ["R&D ($M)", r => r.rd / 1e3, 1], ["Sales & marketing ($M)", r => r.sm / 1e3, 1], ["G&A ($M)", r => r.ga / 1e3, 1],
      ["Operating income ($M)", r => r.opinc / 1e3, 1], ["Operating margin %", r => r.op_m, 1],
      ["Adjusted EBITDA ($M)", r => r.ebitda / 1e3, 1], ["GAAP net income ($M)", r => r.ni / 1e3, 1],
      ["GAAP EPS ($)", r => r.eps, 2], ["Non-GAAP EPS ($)", r => r.ng_eps, 2],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 1], ["Stock-based comp ($M)", r => r.sbc / 1e3, 1],
      ["Diluted shares (M)", r => r.shares / 1e3, 1],
    ];
    const $M = v => v == null ? null : v / 1e3;
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", nonneg: false,
        cap: () => `${fmt.q(last.q)}: ${last.r40_ebitda.toFixed(0)} on adj. EBITDA, ${last.r40_gaap.toFixed(0)} on strict GAAP. Starts 2020 (needs a year-ago quarter on the restated basis).`,
        series: [{ label: "Growth + adj. EBITDA margin", c: "--s1", f: r => r.r40_ebitda }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Revenue", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} YoY. The first $1B quarter.`,
        series: [{ label: "Revenue", c: "--s1", f: r => $M(r.rev) }] },
      { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line", zero: true,
        cap: () => `${fmt.pct(last.rev_yoy)} in ${fmt.q(last.q)}; product revenue ${fmt.pct(last.prod_yoy)}.`,
        series: [{ label: "Total revenue", c: "--s1", f: r => r.rev_yoy }, { label: "Product revenue", c: "--s2", f: r => r.prod_yoy }] },
      { key: "mix", title: "Revenue mix", unit: "$M", type: "bar", stacked: true,
        cap: () => `Product is ${(last.rev_product / last.rev * 100).toFixed(0)}% of ${fmt.q(last.q)} revenue; service ${fmt.money(last.rev_service)}.`,
        series: [{ label: "Product", c: "--s1", f: r => $M(r.rev_product) }, { label: "Installation", c: "--s2", f: r => $M(r.rev_install) }, { label: "Service", c: "--s3", f: r => $M(r.rev_service) }, { label: "Electricity", c: "--s4", f: r => $M(r.rev_elec) }] },
      { key: "gm", title: "Gross margin", unit: "%", type: "line", nonneg: false,
        cap: () => `Non-GAAP ${last.ng_gm}%, GAAP ${last.gm.toFixed(1)}%. GAAP dips below zero in Q2'22 and Q3'23 were PPA charges.`,
        series: [{ label: "Non-GAAP", c: "--s1", f: r => r.ng_gm }, { label: "GAAP", c: "--s2", f: r => r.gm }] },
      { key: "profit", title: "GAAP net income vs adjusted EBITDA", unit: "$M", type: "bar",
        cap: () => `Net income ${fmt.money(last.ni)}, adj. EBITDA ${fmt.money(last.ebitda)} in ${fmt.q(last.q)}.`,
        series: [{ label: "Adj. EBITDA", c: "--s1", f: r => $M(r.ebitda) }, { label: "GAAP net income", c: "--s2", f: r => $M(r.ni) }] },
      { key: "opm", title: "Operating margin (GAAP)", unit: "%", type: "line", zero: true, nonneg: false,
        cap: () => `${last.op_m.toFixed(1)}% in ${fmt.q(last.q)} vs ${ly.op_m.toFixed(1)}% a year ago.`,
        series: [{ label: "Operating margin", c: "--s1", f: r => r.op_m }] },
      { key: "opex", title: "Operating expenses", unit: "$M", type: "bar", stacked: true,
        cap: () => `${fmt.money(last.opex)} in ${fmt.q(last.q)}: ${(last.opex / last.rev * 100).toFixed(0)}% of revenue.`,
        series: [{ label: "R&D", c: "--s1", f: r => $M(r.rd) }, { label: "Sales & marketing", c: "--s2", f: r => $M(r.sm) }, { label: "G&A", c: "--s3", f: r => $M(r.ga) }] },
      { key: "cash", title: "Operating cash flow", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.ocf)} in ${fmt.q(last.q)}. Very seasonal: burns in Q1–Q2, collects in Q4. Starts 2020.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $M(r.ocf) }] },
      { key: "relparty", title: "Related-party revenue (share of total)", unit: "%", type: "bar",
        cap: () => `${last.rp_share.toFixed(0)}% in ${fmt.q(last.q)}, down from 74% in Q4'25. SK ecoplant in 2023–24, Brookfield JVs from Q3'25.`,
        series: [{ label: "Related-party share", c: "--s2", f: r => r.rp_share }] },
      { key: "sbc", title: "Stock-based compensation", unit: "$M", type: "bar",
        cap: () => `${fmt.money(last.sbc)} in ${fmt.q(last.q)}, ${fmt.pct(growth(last.sbc, ly.sbc))} YoY. Starts 2020.`,
        series: [{ label: "SBC", c: "--s1", f: r => $M(r.sbc) }] },
      { key: "shares", title: "Diluted share count", unit: "M", type: "bar",
        cap: () => `${(last.shares / 1e3).toFixed(0)}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY.`,
        series: [{ label: "Diluted shares", c: "--s1", f: r => $M(r.shares) }] },
      { key: "eps", title: "EPS: non-GAAP vs GAAP", unit: "$", type: "line", nonneg: false, zero: true,
        cap: () => `Non-GAAP ${ps(last.ng_eps)}, GAAP ${ps(last.eps)} in ${fmt.q(last.q)}.`,
        series: [{ label: "Non-GAAP EPS", c: "--s1", f: r => r.ng_eps }, { label: "GAAP EPS", c: "--s2", f: r => r.eps }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
