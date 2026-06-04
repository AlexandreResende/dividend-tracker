const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const { exec } = require('child_process');

const { fetchDividends } = require('./fetchDividends');
const { generateHtml } = require('./generateHtml');

function openFile(filePath) {
  const commands = { darwin: 'open', win32: 'start', linux: 'xdg-open' };
  const cmd = commands[process.platform] || 'xdg-open';
  exec(`${cmd} "${filePath}"`);
}

async function main() {
  const tickersEnv = process.env.TICKERS;
  if (!tickersEnv) {
    console.error('Erro: variavel TICKERS nao definida no arquivo .env');
    process.exit(1);
  }

  // Parse each lot entry (TICKER:QUANTITY:DATE)
  const lotsMap = {};
  for (const entry of tickersEnv.split(',')) {
    const [ticker, qty, dateStr] = entry.trim().toUpperCase().split(':');
    const quantity = parseInt(qty, 10);
    const purchaseDate = new Date(dateStr);

    if (!ticker || !quantity || isNaN(purchaseDate.getTime())) {
      console.error(`Erro: entrada invalida "${entry.trim()}". Use o formato TICKER:QUANTIDADE:YYYY-MM-DD.`);
      process.exit(1);
    }

    if (!lotsMap[ticker]) lotsMap[ticker] = { ticker, lots: [] };
    lotsMap[ticker].lots.push({ quantity, purchaseDate });
  }

  const holdings = Object.values(lotsMap);

  console.log(`Buscando dividendos para: ${holdings.map((h) => {
    const total = h.lots.reduce((s, l) => s + l.quantity, 0);
    return `${h.ticker} (${total} acoes em ${h.lots.length} lote${h.lots.length > 1 ? 's' : ''})`;
  }).join(', ')}...`);

  try {
    const results = await fetchDividends(holdings);
    const html = generateHtml(results);

    const reportPath = path.join(__dirname, '..', 'report.html');
    fs.writeFileSync(reportPath, html, 'utf-8');

    console.log(`Relatorio gerado: ${reportPath}`);
    openFile(reportPath);
  } catch (error) {
    console.error('Erro ao buscar dados de dividendos:', error.message);
    process.exit(1);
  }
}

main();
