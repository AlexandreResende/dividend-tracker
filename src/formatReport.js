function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatCurrency(value) {
  if (value == null) return 'N/A';
  return `R$ ${value.toFixed(4)}`;
}

function formatCurrencyTotal(value) {
  if (value == null) return 'N/A';
  return `R$ ${value.toFixed(2)}`;
}

function formatPercent(value) {
  if (value == null) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
}

function formatReport(results, purchaseDate) {
  const today = new Date().toLocaleDateString('pt-BR');
  const separator = '─'.repeat(50);
  const lines = [
    '',
    `  DIVIDEND TRACKER — ${today}`,
    `  Data de compra   : ${formatDate(purchaseDate)}`,
    separator,
  ];

  let grandTotal = 0;

  for (const stock of results) {
    lines.push(`\n  ${stock.ticker}  ${stock.longName}`);
    lines.push(`  Quantidade       : ${stock.quantity} acoes`);
    lines.push(`  Preco atual      : R$ ${stock.regularMarketPrice != null ? stock.regularMarketPrice.toFixed(2) : 'N/A'}`);
    lines.push(`  Dividend Yield   : ${formatPercent(stock.dividendYield)}`);

    const dividends = stock.dividends ?? [];

    if (dividends.length === 0) {
      lines.push('  Sem dividendos desde a data de compra.');
      lines.push(separator);
      continue;
    }

    const sorted = [...dividends].sort((a, b) => new Date(b.date) - new Date(a.date));

    const stockTotal = sorted.reduce((sum, d) => sum + d.dividends * stock.quantity, 0);
    grandTotal += stockTotal;

    lines.push(`  Total a receber  : ${formatCurrencyTotal(stockTotal)}`);
    lines.push('  Dividendos:');
    for (const div of sorted) {
      const total = div.dividends * stock.quantity;
      lines.push(
        `    ${formatDate(div.date)}  ${formatCurrency(div.dividends).padEnd(14)} x ${String(stock.quantity).padStart(6)} acoes = ${formatCurrencyTotal(total)}`
      );
    }

    lines.push(separator);
  }

  lines.push(`\n  TOTAL GERAL      : ${formatCurrencyTotal(grandTotal)}`);
  lines.push('');
  return lines.join('\n');
}

module.exports = { formatReport };
