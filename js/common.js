// Shared helpers: theme toggle, script loading, formatting.
(function () {
  const KEY = "sd-theme";
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  try { applyTheme(localStorage.getItem(KEY)); } catch (e) {}
  window.toggleTheme = function () {
    const cur = document.documentElement.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    document.dispatchEvent(new Event("themechange"));
  };

  // Load a script by URL (works when the page is opened straight from disk).
  window.loadScript = function (src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  };

  window.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // Formatting. Inputs are in $ thousands unless noted.
  window.fmt = {
    money(k, d = 0) {
      if (k == null) return "—";
      const a = Math.abs(k), s = k < 0 ? "-" : "";
      if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(d || 2) + "B";
      return s + "$" + (a / 1e3).toFixed(d || 0) + "M";
    },
    count(n) {
      if (n == null) return "—";
      if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
      if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
      return String(n);
    },
    pct(x, d = 0) { return x == null || !isFinite(x) ? "—" : (x > 0 ? "+" : "") + x.toFixed(d) + "%"; },
    q(q) { return "Q" + q.slice(-1) + "'" + q.slice(2, 4); }
  };
  window.growth = (a, b) => (a == null || b == null || b === 0) ? null : (a / b - 1) * 100 * (b < 0 ? -1 : 1);
})();
