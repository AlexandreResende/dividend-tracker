const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchDividends(holdings, purchaseDate) {
  const results = [];

  for (const { ticker, quantity } of holdings) {
    const symbol = `${ticker}.SA`;

    const [summary, dividendHistory] = await Promise.all([
      yahooFinance.quoteSummary(symbol, { modules: ['price', 'summaryDetail'] }),
      yahooFinance.historical(symbol, {
        period1: purchaseDate,
        period2: new Date(),
        events: 'dividends',
      }),
    ]);

    results.push({
      ticker,
      quantity,
      longName: summary.price?.longName || summary.price?.shortName || ticker,
      regularMarketPrice: summary.price?.regularMarketPrice,
      dividendYield: summary.summaryDetail?.dividendYield,
      dividends: dividendHistory,
    });
  }

  return results;
}

module.exports = { fetchDividends };
