function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatCurrency(value) {
  if (value == null) return 'N/A';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 });
}

function formatCurrencyTotal(value) {
  if (value == null) return 'N/A';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value) {
  if (value == null) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
}

// Returns the number of shares that were held on a given dividend date
function effectiveQuantity(lots, dividendDate) {
  return lots
    .filter((lot) => lot.purchaseDate <= dividendDate)
    .reduce((sum, lot) => sum + lot.quantity, 0);
}

function buildStockCard(stock) {
  const currentYear = new Date().getFullYear();
  const { lots, dividends: rawDividends } = stock;
  const dividends = rawDividends ?? [];
  const sorted = [...dividends].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalQuantity = lots.reduce((s, l) => s + l.quantity, 0);

  const stockTotal = sorted.reduce((sum, d) => {
    return sum + effectiveQuantity(lots, d.date) * d.dividends;
  }, 0);

  const stockYearTotal = sorted
    .filter((d) => new Date(d.date).getUTCFullYear() === currentYear)
    .reduce((sum, d) => sum + effectiveQuantity(lots, d.date) * d.dividends, 0);

  const lotsRows = lots
    .slice()
    .sort((a, b) => a.purchaseDate - b.purchaseDate)
    .map((lot) => `
      <tr class="lot-row">
        <td>${formatDate(lot.purchaseDate)}</td>
        <td class="num">${lot.quantity.toLocaleString('pt-BR')} ações</td>
      </tr>`).join('');

  const dividendRows = sorted.length === 0
    ? `<tr><td colspan="4" class="empty">Sem dividendos desde a data de compra.</td></tr>`
    : sorted.map((div) => {
        const qty = effectiveQuantity(lots, div.date);
        const total = qty * div.dividends;
        return `
        <tr>
          <td>${formatDate(div.date)}</td>
          <td class="num">${formatCurrency(div.dividends)}</td>
          <td class="num">${qty.toLocaleString('pt-BR')}</td>
          <td class="num total-cell">${formatCurrencyTotal(total)}</td>
        </tr>`;
      }).join('');

  return `
  <div class="card">
    <div class="card-header">
      <div class="ticker-info">
        <span class="ticker">${stock.ticker}</span>
        <span class="long-name">${stock.longName}</span>
      </div>
      <div class="card-total">${formatCurrencyTotal(stockTotal)}</div>
    </div>
    <div class="card-meta">
      <div class="meta-item">
        <span class="meta-label">Total de ações</span>
        <span class="meta-value">${totalQuantity.toLocaleString('pt-BR')} ações</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Lotes</span>
        <span class="meta-value">${lots.length}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Preço atual</span>
        <span class="meta-value">${stock.regularMarketPrice != null ? formatCurrencyTotal(stock.regularMarketPrice) : 'N/A'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Dividend Yield</span>
        <span class="meta-value yield">${formatPercent(stock.dividendYield)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total recebido</span>
        <span class="meta-value highlight">${formatCurrencyTotal(stockTotal)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Recebido em ${currentYear}</span>
        <span class="meta-value highlight">${formatCurrencyTotal(stockYearTotal)}</span>
      </div>
    </div>
    <div class="lots-section">
      <div class="lots-title">Lotes comprados</div>
      <table class="lots-table">
        <thead>
          <tr>
            <th>Data de compra</th>
            <th class="num">Quantidade</th>
          </tr>
        </thead>
        <tbody>${lotsRows}</tbody>
      </table>
    </div>
    <table>
      <thead>
        <tr>
          <th>Data de pagamento</th>
          <th class="num">Valor por ação</th>
          <th class="num">Ações elegíveis</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${dividendRows}
      </tbody>
    </table>
  </div>`;
}

function generateHtml(results) {
  const currentYear = new Date().getFullYear();
  const today = new Date().toLocaleDateString('pt-BR');

  const grandTotal = results.reduce((sum, stock) => {
    return sum + (stock.dividends ?? []).reduce((s, d) => {
      return s + effectiveQuantity(stock.lots, d.date) * d.dividends;
    }, 0);
  }, 0);

  const grandYearTotal = results.reduce((sum, stock) => {
    return sum + (stock.dividends ?? [])
      .filter((d) => new Date(d.date).getUTCFullYear() === currentYear)
      .reduce((s, d) => s + effectiveQuantity(stock.lots, d.date) * d.dividends, 0);
  }, 0);

  const cards = results.map(buildStockCard).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dividend Tracker — ${today}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem;
    }

    header {
      max-width: 960px;
      margin: 0 auto 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid #2d3748;
      padding-bottom: 1.25rem;
    }

    header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }

    header h1 span { color: #48bb78; }

    .header-meta {
      font-size: 0.8rem;
      color: #718096;
    }

    .grand-total-bar {
      max-width: 960px;
      margin: 0 auto 2rem;
      background: #1a202c;
      border: 1px solid #2d3748;
      border-left: 4px solid #48bb78;
      border-radius: 8px;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .grand-total-bar .totals {
      display: flex;
      gap: 2.5rem;
      flex-wrap: wrap;
    }

    .grand-total-bar .total-group {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .grand-total-bar .label {
      font-size: 0.7rem;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .grand-total-bar .amount {
      font-size: 1.75rem;
      font-weight: 700;
      color: #48bb78;
    }

    .grand-total-bar .amount.secondary {
      font-size: 1.75rem;
      color: #63b3ed;
    }

    .cards { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

    .card {
      background: #1a202c;
      border: 1px solid #2d3748;
      border-radius: 10px;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #171e2c;
      border-bottom: 1px solid #2d3748;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .ticker-info { display: flex; align-items: baseline; gap: 0.75rem; }
    .ticker { font-size: 1.1rem; font-weight: 700; color: #fff; }
    .long-name { font-size: 0.85rem; color: #718096; }
    .card-total { font-size: 1.1rem; font-weight: 700; color: #48bb78; }

    .card-meta {
      display: flex;
      flex-wrap: wrap;
      border-bottom: 1px solid #2d3748;
    }

    .meta-item {
      flex: 1 1 130px;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.85rem 1.5rem;
      border-right: 1px solid #2d3748;
    }

    .meta-item:last-child { border-right: none; }

    .meta-label { font-size: 0.7rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-value { font-size: 0.95rem; font-weight: 600; color: #e2e8f0; }
    .meta-value.yield { color: #63b3ed; }
    .meta-value.highlight { color: #48bb78; }

    .lots-section {
      border-bottom: 1px solid #2d3748;
      padding: 0.75rem 1.5rem;
      background: #161c28;
    }

    .lots-title {
      font-size: 0.7rem;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .lots-table {
      width: auto;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .lots-table th {
      padding: 0.25rem 1rem 0.25rem 0;
      text-align: left;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #718096;
    }

    .lot-row td {
      padding: 0.25rem 1rem 0.25rem 0;
      border-top: 1px solid #2d3748;
      color: #a0aec0;
      font-size: 0.82rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    thead tr { background: #171e2c; }

    th {
      padding: 0.65rem 1.5rem;
      text-align: left;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #718096;
    }

    td {
      padding: 0.65rem 1.5rem;
      border-top: 1px solid #2d3748;
      color: #cbd5e0;
    }

    tr:hover td { background: #202737; }

    .num { text-align: right; }
    .total-cell { color: #48bb78; font-weight: 600; }
    .empty { text-align: center; color: #718096; padding: 1.5rem; }

    footer {
      max-width: 960px;
      margin: 2rem auto 0;
      text-align: center;
      font-size: 0.75rem;
      color: #4a5568;
    }
  </style>
</head>
<body>
  <header>
    <h1>Dividend <span>Tracker</span></h1>
    <div class="header-meta">Gerado em ${today}</div>
  </header>

  <div class="grand-total-bar">
    <div class="totals">
      <div class="total-group">
        <span class="label">Total recebido</span>
        <span class="amount">${formatCurrencyTotal(grandTotal)}</span>
      </div>
      <div class="total-group">
        <span class="label">Recebido em ${currentYear}</span>
        <span class="amount secondary">${formatCurrencyTotal(grandYearTotal)}</span>
      </div>
    </div>
  </div>

  <div class="cards">
    ${cards}
  </div>

  <footer>Dados via Yahoo Finance &bull; Bovespa (B3)</footer>
</body>
</html>`;
}

module.exports = { generateHtml };
