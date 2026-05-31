import { Candle, Signal, Mode, Status } from "../../shared/types.js";
import { formatInTimeZone } from 'date-fns-tz';
import { calculateATR, findSwings, detectBOSAndTrend, detectCHOCH, findFVG, isPriceInDiscountZone } from "./smc.js";
import { isNewsBlockActive } from "../services/news.js";
import { validateSignalWithAI } from "../services/gemini.js";
import { saveSignal } from "../services/firestore.js";
import { sendTelegramAlert } from "../services/telegram.js";

function checkKillzone(): Status {
  const timeZone = process.env.APP_TIMEZONE || 'Asia/Makassar';
  const now = new Date();
  
  // Format as HHmm string in WITA (Asia/Makassar)
  const hhmmStr = formatInTimeZone(now, timeZone, 'HHmm');
  const timeInt = parseInt(hhmmStr, 10);

  // Killzone: 15:00-18:00 (1500-1800) AND 21:30-00:00 (2130-2359)
  if (
    (timeInt >= 1500 && timeInt <= 1800) ||
    (timeInt >= 2130 && timeInt <= 2359)
  ) {
    return "ACTIVE";
  }
  
  return "WAITING_KILLZONE";
}

let currentMode: Mode = "SCALPING";

export function setMode(mode: Mode) {
  currentMode = mode;
}

export function getCurrentMode() {
  return currentMode;
}

export async function analyzeMarket(candles: Candle[]): Promise<Signal | null> {
  const kzStatus = checkKillzone();
  if (kzStatus !== "ACTIVE") {
     console.log(`Execution blocked: ${kzStatus}`);
     return null;
  }

  const newsBlocked = await isNewsBlockActive();
  if (newsBlocked) {
     console.log("Execution blocked: NEWS_BLOCK");
     return null;
  }

  // 1. Calculate Engine Context
  const atr = calculateATR(candles, 14);
  const swings = findSwings(candles);
  const { trend: biasTrend, bosFound } = detectBOSAndTrend(candles, swings);
  
  // 2. CHOCH Details
  const hasCHOCH = detectCHOCH(candles, swings, biasTrend === 'BULLISH' ? 'BEARISH' : 'BULLISH');
  
  // 3. FVG
  const fvg = findFVG(candles, atr);
  
  const lastCandle = candles[candles.length - 1];
  const price = lastCandle.close;

  // 4. Fibonacci Discount Zone
  // Get last swing low and high
  const highs = swings.filter(s => s.type === 'HIGH');
  const lows = swings.filter(s => s.type === 'LOW');
  
  if (highs.length === 0 || lows.length === 0) return null;

  const swingLow = lows[lows.length - 1].value;
  const swingHigh = highs[highs.length - 1].value;
  const inDiscountZone = isPriceInDiscountZone(price, swingLow, swingHigh, biasTrend);

  // 5. Build Entry Logic
  const canBuy = biasTrend === "BULLISH" && fvg.type === "BULLISH" && inDiscountZone && hasCHOCH;
  const canSell = biasTrend === "BEARISH" && fvg.type === "BEARISH" && inDiscountZone && hasCHOCH;

  if (!canBuy && !canSell) {
     console.log("Market analyzed. No valid signal met ENTRY criteria.");
     return null;
  }

  const type = canBuy ? "BUY" : "SELL";
  const entry = fvg.midpoint !== 0 ? fvg.midpoint : price; // Prefer entry around midpoint
  
  const slTarget = 1.0 * atr;
  const sl = type === "BUY" ? entry - slTarget : entry + slTarget;
  
  let tp1Ratio = 2.0;
  let tp2Ratio = 3.5;
  if (currentMode === "INTRADAY") {
    tp1Ratio = 2.5;
    tp2Ratio = 4.0;
  }
  
  const tp1 = type === "BUY" ? entry + (slTarget * tp1Ratio) : entry - (slTarget * tp1Ratio);
  const tp2 = type === "BUY" ? entry + (slTarget * tp2Ratio) : entry - (slTarget * tp2Ratio);

  // Confidence Score
  // Since we require ALL logic to be true to enter:
  // Bias(20) + FVG(20) + Fib(20) + CHOCH(20) = 80 points standard.
  let confidence = 80;

  const draftSignal: Signal = {
    timestamp: new Date().toISOString(),
    mode: currentMode,
    type,
    symbol: "XAUUSD",
    entry,
    sl,
    tp1,
    tp2,
    confidence, // Will update if AI approves
    bias: biasTrend,
    trend: biasTrend,
    atr,
    fvg_high: fvg.high,
    fvg_low: fvg.low,
    ai_verdict: "PENDING",
    ai_reason: "Awaiting Gemini Response",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 6. AI Validation Engine
  const aiResult = await validateSignalWithAI(draftSignal);
  draftSignal.ai_verdict = aiResult.verdict;
  draftSignal.ai_reason = aiResult.reason;

  if (aiResult.verdict === "HIGH_QUALITY") {
    draftSignal.confidence += 20; // Reaches 100
  } 

  if (draftSignal.confidence >= 70 && aiResult.verdict === "HIGH_QUALITY") {
    // 7. Save and Alert
    await saveSignal(draftSignal);
    await sendTelegramAlert(draftSignal);
    return draftSignal;
  } else {
     console.log(`Signal generated but failed validation: ${aiResult.reason}`);
     return null;
  }
}
