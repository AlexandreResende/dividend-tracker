const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchDividends(holdings) {
  const results = [];

  for (const { ticker, lots } of holdings) {
    const symbol = `${ticker}.SA`;
    const earliestDate = new Date(Math.min(...lots.map((l) => l.purchaseDate.getTime())));

    const [summary, dividendHistory] = await Promise.all([
      yahooFinance.quoteSummary(symbol, { modules: ['price', 'summaryDetail'] }),
      yahooFinance.historical(symbol, {
        period1: earliestDate,
        period2: new Date(),
        events: 'dividends',
      }),
    ]);

    results.push({
      ticker,
      lots,
      longName: summary.price?.longName || summary.price?.shortName || ticker,
      regularMarketPrice: summary.price?.regularMarketPrice,
      dividendYield: summary.summaryDetail?.dividendYield,
      dividends: dividendHistory,
    });
  }

  return results;
}

module.exports = { fetchDividends };
