import axios from "axios";
import { Candle } from "../../shared/types.js";

// Uses Yahoo Finance as fallback
async function fetchYahooFallback(): Promise<Candle[]> {
  try {
    const symbol = "GC=F";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    if (!timestamps || !quotes) throw new Error("Malformed Yahoo Finance response");

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
       // Filter out nulls
       if (quotes.open[i] !== null && quotes.high[i] !== null && quotes.low[i] !== null && quotes.close[i] !== null) {
          candles.push({
            timestamp: new Date(timestamps[i] * 1000).toISOString(),
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0
          });
       }
    }
    
    return candles;
  } catch (err: any) {
    throw new Error(`Yahoo Finance Fallback Failed: ${err.message}`);
  }
}

export async function fetchXauUsdData(): Promise<Candle[]> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    console.warn("TWELVEDATA_API_KEY is missing. Using Yahoo Finance fallback immediately.");
    return fetchYahooFallback();
  }

  try {
    const symbol = "XAU/USD";
    const interval = "5min";
    const outputsize = 100;
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data.status === "error" || !response.data.values) {
      throw new Error(response.data.message || "Malformed TwelveData response");
    }

    const rawValues = response.data.values;
    const candles: Candle[] = rawValues.map((v: any) => ({
      timestamp: new Date(v.datetime).toISOString(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0
    })).reverse(); // Reverse to get chronological order (oldest to newest)

    return candles;
  } catch (error: any) {
    console.error(`TwelveData fetch failed: ${error.message}. Falling back to Yahoo Finance.`);
    return fetchYahooFallback();
  }
}
