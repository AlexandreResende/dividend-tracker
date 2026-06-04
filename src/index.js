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

  const purchaseDateEnv = process.env.PURCHASE_DATE;
  if (!purchaseDateEnv) {
    console.error('Erro: variavel PURCHASE_DATE nao definida no arquivo .env');
    process.exit(1);
  }

  const purchaseDate = new Date(purchaseDateEnv);
  if (isNaN(purchaseDate.getTime())) {
    console.error('Erro: PURCHASE_DATE invalida. Use o formato YYYY-MM-DD.');
    process.exit(1);
  }

  const holdings = tickersEnv
    .split(',')
    .map((entry) => {
      const [ticker, qty] = entry.trim().toUpperCase().split(':');
      return { ticker, quantity: parseInt(qty, 10) || 0 };
    })
    .filter(({ ticker, quantity }) => ticker && quantity > 0);

  if (holdings.length === 0) {
    console.error('Erro: nenhum ticker valido encontrado. Use o formato TICKER:QUANTIDADE.');
    process.exit(1);
  }

  console.log(`Buscando dividendos para: ${holdings.map((h) => `${h.ticker} (${h.quantity})`).join(', ')}...`);

  try {
    const results = await fetchDividends(holdings, purchaseDate);
    const html = generateHtml(results, purchaseDate);

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
