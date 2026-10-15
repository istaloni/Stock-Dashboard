// Intel dashboard profile: derived metrics, KPI tiles, table columns and charts.
window.PROFILES = window.PROFILES || {};
window.PROFILES.INTC = {
  firstQuarter: "2021-Q1",
  derive(all, prevYear) {
    const pct = (a, b) => a != null && b ? a / b * 100 : null;
    for (const r of all) {
      const py = prevYear(r.q) || {};
      r.rev_yoy = growth(r.rev, py.rev);
      r.gm = pct(r.gp, r.rev);
      r.ni_m = pct(r.ni, r.rev);
      r.fcf_m = pct(r.fcf, r.rev);
      r.opex = r.rd != null && r.mga != null ? r.rd + r.mga : null;
      r.r40_fcf = r.rev_yoy != null && r.fcf_m != null ? r.rev_yoy + r.fcf_m : null;
      r.r40_gaap = r.rev_yoy != null && r.ni_m != null ? r.rev_yoy + r.ni_m : null;
      r.dcai_yoy = growth(r.dcai_rev, py.dcai_rev);
    }
  },
  build({ rows, last, ly, lq, kpi, chg }) {
    const ps = v => v == null ? "—" : (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2);
    const kpis = `
      ${kpi("Revenue", fmt.money(last.rev), chg(last.rev, ly.rev, "YoY"))}
      ${kpi("Non-GAAP gross margin", last.ng_gm.toFixed(1) + "%", `GAAP ${last.gm.toFixed(1)}% · year ago ${ly.ng_gm.toFixed(1)}%`)}
      ${kpi("Non-GAAP EPS", ps(last.ng_eps), `GAAP ${ps(last.eps)} (escrow charge) · yr ago ${ps(ly.ng_eps)}`)}
      ${kpi("Data Center & AI rev", fmt.money(last.dcai_rev), chg(last.dcai_rev, ly.dcai_rev, "YoY"))}
      ${kpi("Intel Foundry op. income", fmt.money(last.foundry_oi), `vs ${fmt.money(ly.foundry_oi)} a year ago`)}
      ${kpi("Free cash flow", fmt.money(last.fcf), `OCF ${fmt.money(last.ocf)} − capex ${fmt.money(last.capex)}`)}
`;
    const tlStats = r => `Rev ${fmt.money(r.rev)} (${fmt.pct(r.rev_yoy)} YoY) · NG GM ${r.ng_gm?.toFixed(1)}% · NG EPS ${ps(r.ng_eps)} · GAAP NI ${fmt.money(r.ni)}`;
    const cols = [
      ["Revenue ($M)", r => r.rev / 1e3, 0], ["Revenue YoY %", r => r.rev_yoy, 1],
      ["Rule of 40 — FCF", r => r.r40_fcf, 0], ["Rule of 40 — GAAP", r => r.r40_gaap, 0],
      ["GAAP gross margin %", r => r.gm, 1], ["Non-GAAP gross margin %", r => r.ng_gm, 1],
      ["GAAP net income ($M)", r => r.ni / 1e3, 0], ["GAAP EPS ($)", r => r.eps, 2], ["Non-GAAP EPS ($)", r => r.ng_eps, 2],
      ["Client (CCG) revenue ($M)", r => r.ccg_rev / 1e3, 0], ["Data Center & AI revenue ($M)", r => r.dcai_rev / 1e3, 0], ["Network & Edge revenue ($M)", r => r.nex_rev / 1e3, 0],
      ["Intel Foundry revenue ($M)", r => r.foundry_rev / 1e3, 0],
      ["CCG op. income ($M)", r => r.ccg_oi / 1e3, 0], ["DCAI op. income ($M)", r => r.dcai_oi / 1e3, 0], ["Foundry op. income ($M)", r => r.foundry_oi / 1e3, 0],
      ["R&D ($M)", r => r.rd / 1e3, 0], ["MG&A ($M)", r => r.mga / 1e3, 0], ["Restructuring & other ($M)", r => r.restr / 1e3, 0],
      ["Operating cash flow ($M)", r => r.ocf / 1e3, 0], ["Gross capex ($M)", r => r.capex / 1e3, 0], ["Free cash flow ($M)", r => r.fcf / 1e3, 0],
      ["Dividends paid ($M)", r => r.div / 1e3, 0], ["Diluted shares (M)", r => r.shares, 0], ["Employees (K)", r => r.employees_k, 1],
    ];
    const $B = v => v == null ? null : v / 1e6;
    const charts = [
      { key: "r40", title: "Rule of 40", unit: "%", type: "line", ref: 40, refLabel: "40 = pass", minY: -100,
        cap: () => `${fmt.q(last.q)}: ${last.r40_fcf.toFixed(0)} on free cash flow, ${last.r40_gaap.toFixed(0)} on strict GAAP. Deeply negative for most of the turnaround (axis floor −100).`,
        series: [{ label: "Cash (growth + FCF margin)", c: "--s1", f: r => r.r40_fcf }, { label: "Strict (growth + GAAP net margin)", c: "--s2", f: r => r.r40_gaap }] },
      { key: "revenue", title: "Revenue", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.rev)} in ${fmt.q(last.q)}, ${fmt.pct(last.rev_yoy)} YoY. Bottomed at $11.7B in Q1'23.`,
        series: [{ label: "Revenue", c: "--s1", f: r => $B(r.rev) }] },
      { key: "growth", title: "Revenue growth, year over year", unit: "%", type: "line", zero: true,
        cap: () => `${fmt.pct(last.rev_yoy)} in ${fmt.q(last.q)}, the fastest growth on this chart.`,
        series: [{ label: "YoY growth", c: "--s1", f: r => r.rev_yoy }] },
      { key: "gm", title: "Gross margin", unit: "%", type: "line", nonneg: true,
        cap: () => `Non-GAAP ${last.ng_gm}% vs ~60% in 2021. Dips in Q3'24 and Q2'25 are impairments.`,
        series: [{ label: "Non-GAAP", c: "--s1", f: r => r.ng_gm }, { label: "GAAP", c: "--s2", f: r => r.gm }] },
      { key: "profit", title: "GAAP net income", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.ni)} in ${fmt.q(last.q)}, driven by a ~$12.6B non-cash escrowed-share charge.`,
        series: [{ label: "Net income attributable to Intel", c: "--s1", f: r => $B(r.ni) }] },
      { key: "eps", title: "EPS: non-GAAP vs GAAP", unit: "$", type: "line", minY: -1, nonneg: false,
        cap: () => `Non-GAAP ${ps(last.ng_eps)}, GAAP ${ps(last.eps)}. Axis floor −$1: Q3'24 (−$3.88) and Q2'26 (−$2.16) run below it.`,
        series: [{ label: "Non-GAAP EPS", c: "--s1", f: r => r.ng_eps }, { label: "GAAP EPS", c: "--s2", f: r => r.eps }] },
      { key: "segments", title: "Product revenue by business", unit: "$B", type: "bar", stacked: true,
        cap: () => `Client ${fmt.money(last.ccg_rev)} · Data Center & AI ${fmt.money(last.dcai_rev)} (${fmt.pct(last.dcai_yoy)} YoY).`,
        series: [{ label: "Client (CCG)", c: "--s1", f: r => $B(r.ccg_rev) }, { label: "Data Center & AI", c: "--s2", f: r => $B(r.dcai_rev) }, { label: "Network & Edge (to 2023)", c: "--s3", f: r => $B(r.nex_rev) }] },
      { key: "foundry", title: "Intel Foundry: revenue vs operating income", unit: "$B", type: "bar",
        cap: () => `${fmt.money(last.foundry_rev)} revenue, ${fmt.money(last.foundry_oi)} operating loss in ${fmt.q(last.q)}. Reported since 2024 (2023 restated).`,
        series: [{ label: "Revenue", c: "--s1", f: r => $B(r.foundry_rev) }, { label: "Operating income (loss)", c: "--s2", f: r => $B(r.foundry_oi) }] },
      { key: "segoi", title: "Operating income by segment", unit: "$B", type: "line", zero: true, nonneg: false,
        cap: () => `CCG ${fmt.money(last.ccg_oi)} · DCAI ${fmt.money(last.dcai_oi)} · Foundry ${fmt.money(last.foundry_oi)}.`,
        series: [{ label: "Client (CCG)", c: "--s1", f: r => $B(r.ccg_oi) }, { label: "Data Center & AI", c: "--s2", f: r => $B(r.dcai_oi) }, { label: "Intel Foundry", c: "--s3", f: r => $B(r.foundry_oi) }] },
      { key: "opex", title: "Operating expenses (R&D + MG&A)", unit: "$B", type: "bar", stacked: true,
        cap: () => `${fmt.money(last.opex)} in ${fmt.q(last.q)} vs ~$6.2B at the 2022 peak.`,
        series: [{ label: "R&D", c: "--s1", f: r => $B(r.rd) }, { label: "MG&A", c: "--s2", f: r => $B(r.mga) }] },
      { key: "cash", title: "Cash flow: operations, capex, free cash flow", unit: "$B", type: "bar",
        cap: () => `FCF ${fmt.money(last.fcf)} in ${fmt.q(last.q)}. Capex cut from ~$7B to ${fmt.money(last.capex)} a quarter.`,
        series: [{ label: "Operating cash flow", c: "--s1", f: r => $B(r.ocf) }, { label: "Gross capex", c: "--s2", f: r => $B(r.capex) }, { label: "Free cash flow", c: "--s3", f: r => $B(r.fcf) }] },
      { key: "dividend", title: "Dividends paid", unit: "$B", type: "bar",
        cap: () => `Cut ~two-thirds in 2023, suspended since Q4'24.`,
        series: [{ label: "Dividends", c: "--s1", f: r => $B(r.div) }] },
      { key: "shares", title: "Diluted share count", unit: "M", type: "bar",
        cap: () => `${last.shares.toLocaleString()}M in ${fmt.q(last.q)}, ${fmt.pct(growth(last.shares, ly.shares))} YoY (government, NVIDIA, SoftBank stakes).`,
        series: [{ label: "Diluted shares", c: "--s1", f: r => r.shares }] },
      { key: "employees", title: "Employees (thousands)", unit: "#", type: "bar",
        cap: () => `${last.employees_k}K, down from ~132K at the late-2022 peak.`,
        series: [{ label: "Employees (K)", c: "--s1", f: r => r.employees_k }] },
    ];
    return { kpis, tlStats, cols, charts };
  }
};
