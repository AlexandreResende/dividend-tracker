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

function loadHoldings() {
  const tickersPath = path.join(__dirname, '..', 'tickers.json');
  if (!fs.existsSync(tickersPath)) {
    console.error('Erro: arquivo tickers.json nao encontrado. Copie tickers.json.example para tickers.json e preencha suas posicoes.');
    process.exit(1);
  }

  const entries = JSON.parse(fs.readFileSync(tickersPath, 'utf-8'));
  const lotsMap = {};

  for (const { ticker, quantity, buyDate } of entries) {
    const key = ticker.toUpperCase();
    const purchaseDate = new Date(buyDate);

    if (!key || !quantity || isNaN(purchaseDate.getTime())) {
      console.error(`Erro: entrada invalida ${JSON.stringify({ ticker, quantity, buyDate })}. Campos obrigatorios: ticker, quantity, buyDate (YYYY-MM-DD).`);
      process.exit(1);
    }

    if (!lotsMap[key]) lotsMap[key] = { ticker: key, lots: [] };
    lotsMap[key].lots.push({ quantity, purchaseDate });
  }

  return Object.values(lotsMap);
}

async function main() {
  const holdings = loadHoldings();

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
