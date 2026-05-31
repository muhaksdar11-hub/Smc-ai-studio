export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Trend = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Mode = "SCALPING" | "INTRADAY";
export type Status = "WAITING_KILLZONE" | "NEWS_BLOCK" | "ACTIVE";

export interface Signal {
  id?: string;
  timestamp: string;
  mode: Mode;
  type: "BUY" | "SELL";
  symbol: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  confidence: number;
  bias: Trend;
  trend: Trend;
  atr: number;
  fvg_high: number;
  fvg_low: number;
  ai_verdict: "HIGH_QUALITY" | "LOW_QUALITY" | "PENDING";
  ai_reason: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELED";
  result?: "TP1" | "TP2" | "SL" | "UNKNOWN";
  created_at: string;
  updated_at: string;
}

export interface FractalSwing {
  type: 'HIGH' | 'LOW';
  value: number;
  index: number;
  timestamp: string;
}
