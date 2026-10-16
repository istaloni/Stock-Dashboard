// Registry of stocks shown on the homepage.
// To add a stock: create data/<TICKER>/data.js (same shape as data/SOFI/data.js) and add a line here.
window.STOCKS = [
  { ticker: "SOFI", name: "SoFi Technologies", sector: "Fintech / Digital bank", data: "data/SOFI/data.js" },
  { ticker: "ZETA", name: "Zeta Global", sector: "Marketing software / AI", data: "data/ZETA/data.js" },
  { ticker: "INTC", name: "Intel", sector: "Semiconductors / Foundry", data: "data/INTC/data.js" },
  { ticker: "BE", name: "Bloom Energy", sector: "Energy / Fuel cells (AI power)", data: "data/BE/data.js" }
];
