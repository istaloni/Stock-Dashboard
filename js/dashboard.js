// Deep-dive dashboard. Reads ?t=TICKER, loads data/<TICKER>/data.js, renders everything.
(async function () {
  const app = document.getElementById("app");
  const ticker = (new URLSearchParams(location.search).get("t") || "SOFI").toUpperCase();
  const entry = (window.STOCKS || []).find(s => s.ticker === ticker);
  if (!entry) { app.innerHTML = `<p style="padding:40px 0">Unknown ticker <b>${ticker}</b>. <a href="index.html">Back to all stocks</a></p>`; return; }
  try { await loadScript(entry.data); await loadScript(entry.profile || `js/profiles/${ticker.toLowerCase()}.js`); } catch (e) { app.innerHTML = `<p style="padding:40px 0">${e.message}</p>`; return; }
  const D = window.STOCK_DATA[ticker];
  const M = D.meta;
  document.title = `${ticker} Deep Dive`;

  // ---- derived metrics ----
  const all = D.quarters;
  const byQ = Object.fromEntries(all.map(r => [r.q, r]));
  const prevYear = q => { const y = +q.slice(0, 4) - 1; return byQ[y + q.slice(4)]; };
  const prevQ = q => { let y = +q.slice(0, 4), n = +q.slice(-1) - 1; if (!n) { n = 4; y--; } return byQ[`${y}-Q${n}`]; };
  const P = window.PROFILES[ticker];
  P.derive(all, prevYear);
  const rows = all.filter(r => r.q >= P.firstQuarter);
  const last = rows[rows.length - 1], ly = prevYear(last.q), lq = prevQ(last.q);

  // ---- layout ----
  const chg = (a, b, label) => {
    const g = growth(a, b);
    if (g == null) return "";
    return `<span class="${g >= 0 ? "up" : "down"}">${fmt.pct(g)}</span> ${label}`;
  };
  const kpi = (lbl, val, sub) => `<div class="card kpi"><div class="lbl">${lbl}</div><div class="val">${val}</div><div class="chg">${sub || "&nbsp;"}</div></div>`;

  const B = P.build({ rows, last, ly, lq, kpi, chg, meta: M });

  app.innerHTML = `
    <div class="dash-head">
      <div>
        <a class="back" href="index.html">← All stocks</a>
        <h1><span class="ticker">${ticker}</span>${M.name}</h1>
        <div class="sub">${M.exchange} · ${M.sector} · Public since ${M.ipo} · Latest: ${fmt.q(M.latest)} · ${M.nextEarnings}</div>
      </div>
    </div>

    <section class="kpis" aria-label="Latest quarter">
      ${B.kpis}
    </section>

    ${M.nextQuarter ? (() => { const N = M.nextQuarter; return `
    <div class="section-title"><div><h2>Next quarter: ${fmt.q(N.period)}</h2><p>Reports ${N.date}. Company guidance vs Wall Street consensus, as of ${N.asOf}.</p></div></div>
    <section class="outlook" aria-label="Next quarter outlook">
      ${N.items.map(it => `<div class="card ol-item">
        <div class="lbl">${it.label}</div>
        <div class="ol-grid">
          <div><div class="ol-k">Consensus</div><div class="ol-v num">${it.consensus}</div></div>
          <div><div class="ol-k">Guidance</div><div class="ol-g">${it.guidance}</div></div>
        </div>
        ${it.actual ? `<div class="ol-actual ${it.result === "beat" ? "up" : it.result === "miss" ? "down" : ""}">Actual: <b class="num">${it.actual}</b>${it.result ? " · " + it.result.toUpperCase() : ""}</div>` : ""}
        <div class="ol-foot">Year ago: <span class="num">${it.yearAgo}</span>${it.note ? ` · ${it.note}` : ""}</div>
      </div>`).join("")}
    </section>
    <p class="ol-src">Consensus = average analyst estimate (a snapshot, not live). Sources: ${N.sources.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(" · ")}</p>`; })() : ""}

    <section class="two-col">
      <div class="card thesis"><h3><span class="pill bull">BULL</span>What's working</h3><ul>${M.bull.map(x => `<li>${x}</li>`).join("")}</ul></div>
      <div class="card thesis"><h3><span class="pill bear">BEAR</span>What to watch</h3><ul>${M.bear.map(x => `<li>${x}</li>`).join("")}</ul></div>
    </section>

    <div class="section-title">
      <div><h2>Trends</h2><p>Hover any chart for exact values. Open "What am I looking at?" under a chart for a plain-English explanation.</p></div>
      <div class="filters" role="group" aria-label="Time range">
        <button class="btn active" data-n="0">Since IPO</button>
        <button class="btn" data-n="12">3 years</button>
        <button class="btn" data-n="8">2 years</button>
      </div>
    </div>
    <section class="charts" id="charts"></section>

    <div class="section-title"><div><h2>Guidance</h2><p>${M.guidance.period}</p></div></div>
    <div class="card table-wrap"><table class="guidance"><thead><tr><th>Metric</th><th>Guidance</th><th>Change</th></tr></thead>
      <tbody>${M.guidance.items.map(i => `<tr><td>${i[0]}</td><td class="num">${i[1]}</td><td>${i[2]}</td></tr>`).join("")}</tbody></table></div>

    <div class="section-title"><div><h2>Quarter by quarter</h2><p>What happened each quarter, with links to the source documents on ${M.irUrl ? `<a href="${M.irUrl}" target="_blank" rel="noopener">${M.name}'s investor relations site</a>` : "the company's investor relations site"}.</p></div></div>
    <section class="timeline" id="timeline"></section>

    ${M.glossary ? `<div class="section-title"><div><h2>Glossary</h2><p>Other terms used in ${M.name}'s reports and this dashboard.</p></div></div>
    <div class="card glossary"><dl>${M.glossary.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl></div>` : ""}

    <div class="section-title">
      <div><h2>Data table</h2><p>Dollar figures in $ millions. Newest quarter first.</p></div>
      <button class="btn" id="csv">Download CSV</button>
    </div>
    <div class="card table-wrap" id="table"></div>

    <p class="footer">Sources: ${M.sources} Figures as originally reported, with restated values from newer releases used where available. Not investment advice.</p>
  `;

  // ---- timeline ----
  document.getElementById("timeline").innerHTML = rows.slice().reverse().map(r => `
    <div class="card tl-item">
      <div><div class="tl-q">${fmt.q(r.q)}</div></div>
      <div>
        <p class="tl-note">${r.note || ""}</p>
        <div class="tl-stats">${B.tlStats(r)}</div>
        <div class="tl-links" style="margin-top:6px">${Object.entries(r.files || {}).map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${k}</a>`).join("")}</div>
      </div>
    </div>`).join("");

  // ---- data table + CSV ----
  const cols = B.cols;
  const val = (f, r) => { try { const v = f(r); return v == null || !isFinite(v) ? null : v; } catch (e) { return null; } };
  const rev = rows.slice().reverse();
  document.getElementById("table").innerHTML = `<table><thead><tr><th>Metric</th>${rev.map(r => `<th>${fmt.q(r.q)}</th>`).join("")}</tr></thead><tbody>${
    cols.map(([n, f, d]) => `<tr><td>${n}</td>${rev.map(r => { const v = val(f, r); return `<td class="num">${v == null ? "—" : v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}</td>`; }).join("")}</tr>`).join("")
  }</tbody></table>`;
  document.getElementById("csv").onclick = () => {
    const lines = [["Quarter", ...cols.map(c => c[0])].join(",")];
    for (const r of rows) lines.push([r.q, ...cols.map(([, f]) => { const v = val(f, r); return v == null ? "" : +v.toFixed(4); })].join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `${ticker}_quarterly.csv`; a.click();
  };

  // ---- charts ----
  const charts = B.charts;
  const host = document.getElementById("charts");
  const EX = M.explain || {};
  host.innerHTML = charts.map((c, i) => `<div class="card chart-card${c.key === "r40" ? " wide" : ""}"><h3>${c.title}</h3><p class="cap">${c.cap()}</p><div class="box" id="c${i}"></div>${EX[c.key] ? `<details class="explain"><summary>What am I looking at?</summary><div>${EX[c.key]}</div></details>` : ""}</div>`).join("");

  let range = 0;
  const sgn = v => v < 0 ? "-" : "";
  const tickFmt = (u) => (v) => u === "$" ? (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2) : u === "#" ? v.toLocaleString() : u === "$K" ? "$" + v + "K" : u === "$Mx" ? "$" + v + "M" : u === "$M" ? (Math.abs(v) >= 1000 ? sgn(v) + "$" + +(Math.abs(v) / 1000).toFixed(2) + "B" : sgn(v) + "$" + Math.abs(v) + "M") : u === "$B" ? (v < 0 ? "-$" : "$") + Math.abs(v) + "B" : u === "%" ? v + "%" : u === "M" ? v.toLocaleString() + "M" : v;
  const tipFmt = (u, v) => v == null ? "—" : u === "$" ? (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2) : u === "#" ? v.toLocaleString() : u === "$K" ? "$" + v.toLocaleString() + "K" : u === "$Mx" ? "$" + v.toFixed(2) + "M" : u === "$M" ? sgn(v) + "$" + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 1 }) + "M"
    : u === "$B" ? (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2) + "B" : u === "%" ? v.toFixed(2) + "%" : u === "M" ? v.toFixed(1) + "M" : v.toFixed(2);

  function draw() {
    const R = range ? rows.slice(-range) : rows;
    charts.forEach((c, i) => {
      const cu = c.custom ? c.custom() : null;
      MiniChart.render(document.getElementById("c" + i), {
        title: c.title, type: c.type, stacked: !!c.stacked, nonneg: c.nonneg != null ? c.nonneg : c.unit !== "%", zero: c.zero, minY: c.minY, maxY: c.maxY, ref: c.ref, refLabel: c.refLabel,
        labels: cu ? cu.labels : R.map(r => fmt.q(r.q)),
        series: cu ? cu.series.map(s => ({ label: s.label, color: css(s.c), data: s.data }))
          : c.series.map(s => ({ label: s.label, color: css(s.c), data: R.map(r => { const v = s.f(r); return v == null || !isFinite(v) ? null : v; }) })),
        tick: tickFmt(c.unit), tip: v => tipFmt(c.unit, v)
      });
    });
  }
  draw();
  document.querySelectorAll(".filters .btn").forEach(b => b.onclick = () => {
    document.querySelectorAll(".filters .btn").forEach(x => x.classList.toggle("active", x === b));
    range = +b.dataset.n; draw();
  });
  document.addEventListener("themechange", draw);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
})();
