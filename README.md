# Stock Deep Dive

Live: https://istaloni.github.io/StockDeepDive/

Homepage of stocks → click one → quarterly deep dive built from the company's own filings.

## Run it
- Quickest: double-click `index.html`. It opens in your browser (works offline; fonts load from Google when online).
- In VS Code: install the recommended **Live Server** extension, right-click `index.html` → "Open with Live Server".

## Layout
```
index.html          homepage (stock cards)
stock.html?t=SOFI   deep-dive template (same page for every ticker)
css/style.css       styles (light + dark)
js/stocks.js        list of stocks on the homepage  ← add new tickers here
js/common.js        theme, formatting helpers
js/dashboard.js     charts, KPIs, timeline, data table
data/SOFI/data.js   SoFi quarterly numbers + notes (Q2'21–Q2'26)
data/SOFI/filings/  source PDFs — kept locally only (not pushed; see .gitignore)
data/SOFI/text/     text versions of the releases/decks — local only
```

## Add a stock
1. Create `data/TICKER/data.js` with the same shape as `data/SOFI/data.js`.
2. Add `{ ticker, name, sector, data }` to `js/stocks.js`.

## Update SoFi after a new quarter
Add the new quarter's links to `~/Google Drive/.../Karl Stock Investing/SOFI/sofi_links.tsv`, run the download script, then ask Claude to refresh `data/SOFI/data.js`.
