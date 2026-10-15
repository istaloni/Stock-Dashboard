// Tiny dependency-free SVG chart renderer (bar, stacked bar, line) with hover tooltips.
// Usage: MiniChart.render(boxEl, { type, stacked, labels, series:[{label,color,data}], tick(v), tip(v) })
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  function niceStep(span, count) {
    const raw = span / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  // bar path with rounded corners only at the data end (square at the baseline)
  function barPath(x, y0, y1, w, r) {
    const up = y1 < y0, h = Math.abs(y1 - y0);
    r = Math.min(r, w / 2, h);
    if (h < 0.5) return "";
    if (up) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
    return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
  }

  function render(box, cfg) {
    box.innerHTML = "";
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const W = box.clientWidth || 360, H = box.clientHeight || 240;
    const multi = cfg.series.length > 1;
    let top = 8;
    if (multi) {
      const lg = document.createElement("div");
      lg.className = "legend";
      lg.innerHTML = cfg.series.map(s => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join("");
      box.appendChild(lg);
      top = Math.max(30, lg.offsetHeight + 12);
    }
    const n = cfg.labels.length;
    // domain
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) {
      if (cfg.stacked) {
        let p = 0, m = 0;
        cfg.series.forEach(s => { const v = s.data[i]; if (v == null) return; v >= 0 ? p += v : m += v; });
        hi = Math.max(hi, p); lo = Math.min(lo, m);
      } else cfg.series.forEach(s => { const v = s.data[i]; if (v == null) return; hi = Math.max(hi, v); lo = Math.min(lo, v); });
    }
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    if (cfg.type === "bar" || cfg.zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    else { const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad; if (lo < 0 && cfg.nonneg && cfg.minY == null) lo = 0; }
    if (cfg.ref != null) { hi = Math.max(hi, cfg.ref * 1.1); lo = Math.min(lo, cfg.ref); }
    if (cfg.minY != null && lo < cfg.minY) lo = cfg.minY;
    if (cfg.maxY != null && hi > cfg.maxY) hi = cfg.maxY;
    const step = niceStep(hi - lo, 5);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const ticks = []; for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));

    const tickLabels = ticks.map(cfg.tick || (v => v));
    const left = Math.max(36, 8 + 7 * Math.max(...tickLabels.map(t => String(t).length)));
    const right = 8, bottom = 22;
    const pw = W - left - right, ph = H - top - bottom;
    const band = pw / n;
    const X = i => left + band * (i + 0.5);
    const Y = v => top + ph - (v - lo) / (hi - lo) * ph;

    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": cfg.title || "chart" }, box);
    const cid = "clip" + Math.random().toString(36).slice(2);
    const defs = el("defs", {}, svg), cp = el("clipPath", { id: cid }, defs);
    el("rect", { x: left - 6, y: top - 6, width: pw + 12, height: ph + 6 }, cp);
    const plot = el("g", { "clip-path": `url(#${cid})` }, null);
    // grid + y ticks
    ticks.forEach((t, k) => {
      el("line", { x1: left, x2: W - right, y1: Y(t), y2: Y(t), stroke: t === 0 && lo < 0 ? css("--text-3") : css("--grid"), "stroke-width": 1 }, svg);
      const tx = el("text", { x: left - 6, y: Y(t) + 4, "text-anchor": "end", class: "ax" }, svg);
      tx.textContent = tickLabels[k];
    });
    // x labels, thinned so they never collide
    const every = Math.max(1, Math.ceil(n * 46 / pw));
    for (let i = n - 1; i >= 0; i -= every) {
      const tx = el("text", { x: X(i), y: H - 6, "text-anchor": "middle", class: "ax" }, svg);
      tx.textContent = cfg.labels[i];
    }
    if (cfg.ref != null) {
      el("line", { x1: left, x2: W - right, y1: Y(cfg.ref), y2: Y(cfg.ref), stroke: css("--text-2"), "stroke-width": 1.5, "stroke-dasharray": "5 4" }, svg);
      const rt = el("text", { x: left + 6, y: Y(cfg.ref) - 5, "text-anchor": "start", class: "ax ref" }, svg);
      rt.textContent = cfg.refLabel || String(cfg.ref);
    }
    const hl = el("rect", { x: 0, y: top, width: band, height: ph, fill: css("--text"), opacity: 0 }, svg);
    const cross = el("line", { y1: top, y2: top + ph, stroke: css("--text-3"), "stroke-width": 1, opacity: 0 }, svg);

    if (cfg.type === "bar") {
      const k = cfg.stacked ? 1 : cfg.series.length;
      const bw = Math.min(22, band * (cfg.stacked ? 0.62 : 0.72) / k);
      const gap = cfg.stacked ? 0 : Math.min(2, bw * 0.15);
      for (let i = 0; i < n; i++) {
        let pos = 0, neg = 0;
        cfg.series.forEach((s, j) => {
          const v = s.data[i]; if (v == null) return;
          let x, y0, y1;
          if (cfg.stacked) {
            x = X(i) - bw / 2;
            if (v >= 0) { y0 = Y(pos); pos += v; y1 = Y(pos); } else { y0 = Y(neg); neg += v; y1 = Y(neg); }
            // 2px surface gap between stacked segments
            if (j > 0) y0 += v >= 0 ? -1 : 1;
          } else {
            x = X(i) - (k * bw + (k - 1) * gap) / 2 + j * (bw + gap);
            y0 = Y(0); y1 = Y(v);
          }
          const last = cfg.stacked ? cfg.series.slice(j + 1).every(t => t.data[i] == null || Math.sign(t.data[i]) !== Math.sign(v)) : true;
          const d = barPath(x, y0, y1, bw, last ? 4 : 0);
          if (d) el("path", { d, fill: s.color }, plot);
        });
      }
    } else {
      cfg.series.forEach(s => {
        let d = "", started = false;
        s.data.forEach((v, i) => { if (v == null) return; d += (started ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); started = true; });
        el("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, plot);
        // end-point marker + direct label on the latest value
        let li = s.data.length - 1; while (li >= 0 && s.data[li] == null) li--;
        if (li >= 0) el("circle", { cx: X(li), cy: Y(s.data[li]), r: 4, fill: s.color, stroke: css("--surface"), "stroke-width": 2 }, plot);
      });
    }
    svg.insertBefore(plot, cross);
    const dots = cfg.type === "line" ? cfg.series.map(s => el("circle", { r: 5, fill: s.color, stroke: css("--surface"), "stroke-width": 2, opacity: 0 }, svg)) : [];

    // tooltip
    const tip = document.createElement("div");
    tip.className = "tip"; tip.hidden = true; box.appendChild(tip);
    const hit = el("rect", { x: left, y: top, width: pw, height: ph, fill: "transparent" }, svg);
    const move = (evt) => {
      const r = svg.getBoundingClientRect();
      const px = (evt.touches ? evt.touches[0].clientX : evt.clientX) - r.left;
      const i = Math.max(0, Math.min(n - 1, Math.floor((px - left) / band)));
      if (cfg.type === "bar") { hl.setAttribute("x", left + band * i); hl.setAttribute("width", band); hl.setAttribute("opacity", 0.05); }
      else {
        cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 0.6);
        dots.forEach((d, j) => { const v = cfg.series[j].data[i]; if (v == null) { d.setAttribute("opacity", 0); return; } d.setAttribute("cx", X(i)); d.setAttribute("cy", Y(v)); d.setAttribute("opacity", 1); });
      }
      tip.innerHTML = `<b>${cfg.labels[i]}</b>` + cfg.series.map(s => `<div><i style="background:${s.color}"></i>${multi ? s.label + ": " : ""}<span class="num">${(cfg.tip || (v => v))(s.data[i])}</span></div>`).join("");
      tip.hidden = false;
      const tw = tip.offsetWidth, bx = X(i) + 12 + tw > W ? X(i) - 12 - tw : X(i) + 12;
      tip.style.left = Math.max(0, bx) + "px"; tip.style.top = (top + 4) + "px";
    };
    const leave = () => { tip.hidden = true; hl.setAttribute("opacity", 0); cross.setAttribute("opacity", 0); dots.forEach(d => d.setAttribute("opacity", 0)); };
    hit.addEventListener("mousemove", move); hit.addEventListener("touchstart", move, { passive: true }); hit.addEventListener("touchmove", move, { passive: true });
    hit.addEventListener("mouseleave", leave); hit.addEventListener("touchend", leave);
  }
  window.MiniChart = { render };
})();
