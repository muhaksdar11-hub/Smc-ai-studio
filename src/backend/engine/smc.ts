import { Candle, FractalSwing, Trend } from "../../shared/types.js";

// Calculates ATR for the given period (default 14)
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - prev.close);
    const lowClose = Math.abs(current.low - prev.close);
    trs.push(Math.max(highLow, highClose, lowClose));
  }
  
  // Simple moving average of TR for the last `period` elements
  const recentTrs = trs.slice(-period);
  const sum = recentTrs.reduce((a, b) => a + b, 0);
  return sum / period;
}

// 5 Candle Fractal setup
export function findSwings(candles: Candle[]): FractalSwing[] {
  const swings: FractalSwing[] = [];
  for (let i = 2; i < candles.length - 2; i++) {
    const isHigh = 
      candles[i].high > candles[i - 2].high &&
      candles[i].high > candles[i - 1].high &&
      candles[i].high > candles[i + 1].high &&
      candles[i].high > candles[i + 2].high;
      
    const isLow = 
      candles[i].low < candles[i - 2].low &&
      candles[i].low < candles[i - 1].low &&
      candles[i].low < candles[i + 1].low &&
      candles[i].low < candles[i + 2].low;

    if (isHigh) swings.push({ type: 'HIGH', value: candles[i].high, index: i, timestamp: candles[i].timestamp });
    if (isLow)  swings.push({ type: 'LOW', value: candles[i].low, index: i, timestamp: candles[i].timestamp });
  }
  return swings;
}

export function detectBOSAndTrend(candles: Candle[], swings: FractalSwing[]): { trend: Trend, bosFound: boolean } {
  let trend: Trend = "NEUTRAL";
  let bosFound = false;
  
  const highs = swings.filter(s => s.type === 'HIGH');
  const lows = swings.filter(s => s.type === 'LOW');
  
  if (highs.length > 0 && lows.length > 0) {
    const lastHigh = highs[highs.length - 1];
    const lastLow = lows[lows.length - 1];
    const lastCandle = candles[candles.length - 1];
    
    // Check BOS based on closes
    if (lastCandle.close > lastHigh.value) {
      trend = "BULLISH";
      bosFound = true;
    } else if (lastCandle.close < lastLow.value) {
      trend = "BEARISH";
      bosFound = true;
    }
  }
  
  return { trend, bosFound };
}

export function detectCHOCH(candles: Candle[], swings: FractalSwing[], previousTrend: Trend): boolean {
  const lastCandle = candles[candles.length - 1];
  const highs = swings.filter(s => s.type === 'HIGH');
  const lows = swings.filter(s => s.type === 'LOW');

  if (previousTrend === "BEARISH" && highs.length > 1) {
    // Bullish CHOCH: Price closes above the last Lower High
    // We assume the most recent high is the last Lower High in a bearish trend
    const lastLowerHigh = highs[highs.length - 1].value;
    if (lastCandle.close > lastLowerHigh) return true;
  }
  
  if (previousTrend === "BULLISH" && lows.length > 1) {
    // Bearish CHOCH: Price closes below the last Higher Low
    // We assume the most recent low is the last Higher Low in a bullish trend
    const lastHigherLow = lows[lows.length - 1].value;
    if (lastCandle.close < lastHigherLow) return true;
  }
  
  return false;
}

export function findFVG(candles: Candle[], atr: number): { type: "BULLISH"| "BEARISH"| null, high: number, low: number, midpoint: number } {
  if (candles.length < 3) return { type: null, high: 0, low: 0, midpoint: 0 };
  
  const c1 = candles[candles.length - 3];
  const c3 = candles[candles.length - 1];
  const minGap = 0.30 * atr;

  // Bullish FVG
  if (c1.high < c3.low && (c3.low - c1.high) >= minGap) {
    return {
      type: "BULLISH",
      high: c3.low,
      low: c1.high,
      midpoint: (c3.low + c1.high) / 2
    };
  }

  // Bearish FVG
  if (c1.low > c3.high && (c1.low - c3.high) >= minGap) {
    return {
      type: "BEARISH",
      high: c1.low,
      low: c3.high,
      midpoint: (c1.low + c3.high) / 2
    };
  }

  return { type: null, high: 0, low: 0, midpoint: 0 };
}

export function isPriceInDiscountZone(price: number, swingLow: number, swingHigh: number, trend: Trend): boolean {
  if (trend === "BULLISH") {
    // Fib Retracement
    const diff = swingHigh - swingLow;
    if (diff <= 0) return false;
    const fib50 = swingHigh - (diff * 0.50);
    const fib618 = swingHigh - (diff * 0.618);
    // Discount zone is between 50% and 61.8% of the retracement
    return (price <= fib50 && price >= fib618);
  } else if (trend === "BEARISH") {
    const diff = swingHigh - swingLow;
    if (diff <= 0) return false;
    const fib50 = swingLow + (diff * 0.50);
    const fib618 = swingLow + (diff * 0.618);
    return (price >= fib50 && price <= fib618);
  }
  return false;
}
