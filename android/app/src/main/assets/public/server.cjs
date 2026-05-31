var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/backend/scheduler.ts
var import_node_cron = __toESM(require("node-cron"), 1);

// src/backend/services/twelvedata.ts
var import_axios = __toESM(require("axios"), 1);
async function fetchYahooFallback() {
  try {
    const symbol = "GC=F";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
    const response = await import_axios.default.get(url, { timeout: 1e4 });
    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    if (!timestamps || !quotes) throw new Error("Malformed Yahoo Finance response");
    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.open[i] !== null && quotes.high[i] !== null && quotes.low[i] !== null && quotes.close[i] !== null) {
        candles.push({
          timestamp: new Date(timestamps[i] * 1e3).toISOString(),
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || 0
        });
      }
    }
    return candles;
  } catch (err) {
    throw new Error(`Yahoo Finance Fallback Failed: ${err.message}`);
  }
}
async function fetchXauUsdData() {
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
    const response = await import_axios.default.get(url, { timeout: 1e4 });
    if (response.data.status === "error" || !response.data.values) {
      throw new Error(response.data.message || "Malformed TwelveData response");
    }
    const rawValues = response.data.values;
    const candles = rawValues.map((v) => ({
      timestamp: new Date(v.datetime).toISOString(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0
    })).reverse();
    return candles;
  } catch (error) {
    console.error(`TwelveData fetch failed: ${error.message}. Falling back to Yahoo Finance.`);
    return fetchYahooFallback();
  }
}

// src/backend/engine/signal.ts
var import_date_fns_tz = require("date-fns-tz");

// src/backend/engine/smc.ts
function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return 0;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - prev.close);
    const lowClose = Math.abs(current.low - prev.close);
    trs.push(Math.max(highLow, highClose, lowClose));
  }
  const recentTrs = trs.slice(-period);
  const sum = recentTrs.reduce((a, b) => a + b, 0);
  return sum / period;
}
function findSwings(candles) {
  const swings = [];
  for (let i = 2; i < candles.length - 2; i++) {
    const isHigh = candles[i].high > candles[i - 2].high && candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high && candles[i].high > candles[i + 2].high;
    const isLow = candles[i].low < candles[i - 2].low && candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low && candles[i].low < candles[i + 2].low;
    if (isHigh) swings.push({ type: "HIGH", value: candles[i].high, index: i, timestamp: candles[i].timestamp });
    if (isLow) swings.push({ type: "LOW", value: candles[i].low, index: i, timestamp: candles[i].timestamp });
  }
  return swings;
}
function detectBOSAndTrend(candles, swings) {
  let trend = "NEUTRAL";
  let bosFound = false;
  const highs = swings.filter((s) => s.type === "HIGH");
  const lows = swings.filter((s) => s.type === "LOW");
  if (highs.length > 0 && lows.length > 0) {
    const lastHigh = highs[highs.length - 1];
    const lastLow = lows[lows.length - 1];
    const lastCandle = candles[candles.length - 1];
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
function detectCHOCH(candles, swings, previousTrend) {
  const lastCandle = candles[candles.length - 1];
  const highs = swings.filter((s) => s.type === "HIGH");
  const lows = swings.filter((s) => s.type === "LOW");
  if (previousTrend === "BEARISH" && highs.length > 1) {
    const lastLowerHigh = highs[highs.length - 1].value;
    if (lastCandle.close > lastLowerHigh) return true;
  }
  if (previousTrend === "BULLISH" && lows.length > 1) {
    const lastHigherLow = lows[lows.length - 1].value;
    if (lastCandle.close < lastHigherLow) return true;
  }
  return false;
}
function findFVG(candles, atr) {
  if (candles.length < 3) return { type: null, high: 0, low: 0, midpoint: 0 };
  const c1 = candles[candles.length - 3];
  const c3 = candles[candles.length - 1];
  const minGap = 0.3 * atr;
  if (c1.high < c3.low && c3.low - c1.high >= minGap) {
    return {
      type: "BULLISH",
      high: c3.low,
      low: c1.high,
      midpoint: (c3.low + c1.high) / 2
    };
  }
  if (c1.low > c3.high && c1.low - c3.high >= minGap) {
    return {
      type: "BEARISH",
      high: c1.low,
      low: c3.high,
      midpoint: (c1.low + c3.high) / 2
    };
  }
  return { type: null, high: 0, low: 0, midpoint: 0 };
}
function isPriceInDiscountZone(price, swingLow, swingHigh, trend) {
  if (trend === "BULLISH") {
    const diff = swingHigh - swingLow;
    if (diff <= 0) return false;
    const fib50 = swingHigh - diff * 0.5;
    const fib618 = swingHigh - diff * 0.618;
    return price <= fib50 && price >= fib618;
  } else if (trend === "BEARISH") {
    const diff = swingHigh - swingLow;
    if (diff <= 0) return false;
    const fib50 = swingLow + diff * 0.5;
    const fib618 = swingLow + diff * 0.618;
    return price >= fib50 && price <= fib618;
  }
  return false;
}

// src/backend/services/news.ts
var import_axios2 = __toESM(require("axios"), 1);
var import_date_fns = require("date-fns");
var cachedNews = [];
var lastFetch = null;
async function fetchNews() {
  const gnewsKey = process.env.GNEWS_API_KEY;
  if (!gnewsKey) return;
  try {
    if (lastFetch && (/* @__PURE__ */ new Date()).getTime() - lastFetch.getTime() < 36e5) {
      return;
    }
    const query = 'USD OR "Federal Reserve" OR "Interest Rate" OR FOMC OR CPI OR PPI OR NFP OR Gold';
    const res = await import_axios2.default.get(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&token=${gnewsKey}`, { timeout: 1e4 });
    if (res.data && res.data.articles) {
      cachedNews = res.data.articles.map((a) => ({
        title: a.title,
        timestamp: new Date(a.publishedAt)
      }));
      lastFetch = /* @__PURE__ */ new Date();
    }
  } catch (err) {
    console.error("News API failed:", err.message);
  }
}
async function isNewsBlockActive() {
  await fetchNews();
  const now = /* @__PURE__ */ new Date();
  for (const event of cachedNews) {
    const blockStart = (0, import_date_fns.subMinutes)(event.timestamp, 15);
    const blockEnd = (0, import_date_fns.addMinutes)(event.timestamp, 15);
    if ((0, import_date_fns.isWithinInterval)(now, { start: blockStart, end: blockEnd })) {
      return true;
    }
  }
  return false;
}

// src/backend/services/gemini.ts
var import_genai = require("@google/genai");
async function validateSignalWithAI(signalDraft) {
  try {
    const ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
    You are a professional XAUUSD algorithmic trading AI. Validate this Smart Money Concept (SMC) signal JSON setup.
    Critically analyze the setup context: Bias, Trend, FVG gaps, Fibonacci rules, CHOCH presence, and ATR-based SL/TP limits.
    
    SETUP DATA:
    ${JSON.stringify(signalDraft, null, 2)}
    
    You must output ONLY valid JSON in the exact following format, without markdown wrapping or extras:
    {
      "verdict": "HIGH_QUALITY" | "LOW_QUALITY",
      "reason": "Clear explanation of your assessment."
    }
    `;
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.verdict === "HIGH_QUALITY" || parsed.verdict === "LOW_QUALITY") {
        return { verdict: parsed.verdict, reason: parsed.reason };
      }
    }
    return { verdict: "LOW_QUALITY", reason: "AI response format was invalid or empty" };
  } catch (error) {
    console.error("Gemini AI validation failed:", error.message);
    return { verdict: "LOW_QUALITY", reason: `AI Error: ${error.message}` };
  }
}

// src/backend/services/firestore.ts
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var db = null;
function getFirestoreDb() {
  if (db) return db;
  if (!import_firebase_admin.default.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      import_firebase_admin.default.initializeApp({
        credential: import_firebase_admin.default.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log("Firebase initialized via GOOGLE_APPLICATION_CREDENTIALS");
    } else {
      console.warn("Firebase not configured properly, running in memory-mode only.");
    }
  }
  if (import_firebase_admin.default.apps.length > 0) {
    db = import_firebase_admin.default.firestore();
    return db;
  }
  throw new Error("Firestore DB not available.");
}
async function saveSignal(signal) {
  try {
    const database = getFirestoreDb();
    const docRef = database.collection("signals").doc();
    signal.id = docRef.id;
    await docRef.set(signal);
    console.log(`Saved signal ${signal.id} to Firestore`);
  } catch (error) {
    console.error("Failed to save signal to Firestore:", error.message);
  }
}
async function checkSystemStatus() {
  try {
    const database = getFirestoreDb();
    await database.collection("system").doc("connection_test").set({
      status: "ok",
      last_check: (/* @__PURE__ */ new Date()).toISOString()
    });
    return true;
  } catch (err) {
    return false;
  }
}

// src/backend/services/telegram.ts
var import_axios3 = __toESM(require("axios"), 1);
async function sendTelegramAlert(signal) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram credentials not configured. Skipping alert.");
    return;
  }
  const message = `
\u{1F6A8} *XAUUSD SIGNAL* \u{1F6A8}
*Mode*: ${signal.mode}
*Type*: ${signal.type}
*Entry*: ${signal.entry.toFixed(2)}
*SL*: ${signal.sl.toFixed(2)}
*TP1*: ${signal.tp1.toFixed(2)}
*TP2*: ${signal.tp2.toFixed(2)}
*Confidence*: ${signal.confidence}%
*AI Verdict*: ${signal.ai_verdict}
*Timestamp*: ${signal.timestamp}`;
  try {
    await import_axios3.default.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });
    console.log("Telegram alert sent successfully");
  } catch (error) {
    console.error("Failed to send Telegram alert:", error.message);
  }
}

// src/backend/engine/signal.ts
function checkKillzone() {
  const timeZone = process.env.APP_TIMEZONE || "Asia/Makassar";
  const now = /* @__PURE__ */ new Date();
  const hhmmStr = (0, import_date_fns_tz.formatInTimeZone)(now, timeZone, "HHmm");
  const timeInt = parseInt(hhmmStr, 10);
  if (timeInt >= 1500 && timeInt <= 1800 || timeInt >= 2130 && timeInt <= 2359) {
    return "ACTIVE";
  }
  return "WAITING_KILLZONE";
}
var currentMode = "SCALPING";
function setMode(mode) {
  currentMode = mode;
}
async function analyzeMarket(candles) {
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
  const atr = calculateATR(candles, 14);
  const swings = findSwings(candles);
  const { trend: biasTrend, bosFound } = detectBOSAndTrend(candles, swings);
  const hasCHOCH = detectCHOCH(candles, swings, biasTrend === "BULLISH" ? "BEARISH" : "BULLISH");
  const fvg = findFVG(candles, atr);
  const lastCandle = candles[candles.length - 1];
  const price = lastCandle.close;
  const highs = swings.filter((s) => s.type === "HIGH");
  const lows = swings.filter((s) => s.type === "LOW");
  if (highs.length === 0 || lows.length === 0) return null;
  const swingLow = lows[lows.length - 1].value;
  const swingHigh = highs[highs.length - 1].value;
  const inDiscountZone = isPriceInDiscountZone(price, swingLow, swingHigh, biasTrend);
  const canBuy = biasTrend === "BULLISH" && fvg.type === "BULLISH" && inDiscountZone && hasCHOCH;
  const canSell = biasTrend === "BEARISH" && fvg.type === "BEARISH" && inDiscountZone && hasCHOCH;
  if (!canBuy && !canSell) {
    console.log("Market analyzed. No valid signal met ENTRY criteria.");
    return null;
  }
  const type = canBuy ? "BUY" : "SELL";
  const entry = fvg.midpoint !== 0 ? fvg.midpoint : price;
  const slTarget = 1 * atr;
  const sl = type === "BUY" ? entry - slTarget : entry + slTarget;
  let tp1Ratio = 2;
  let tp2Ratio = 3.5;
  if (currentMode === "INTRADAY") {
    tp1Ratio = 2.5;
    tp2Ratio = 4;
  }
  const tp1 = type === "BUY" ? entry + slTarget * tp1Ratio : entry - slTarget * tp1Ratio;
  const tp2 = type === "BUY" ? entry + slTarget * tp2Ratio : entry - slTarget * tp2Ratio;
  let confidence = 80;
  const draftSignal = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    mode: currentMode,
    type,
    symbol: "XAUUSD",
    entry,
    sl,
    tp1,
    tp2,
    confidence,
    // Will update if AI approves
    bias: biasTrend,
    trend: biasTrend,
    atr,
    fvg_high: fvg.high,
    fvg_low: fvg.low,
    ai_verdict: "PENDING",
    ai_reason: "Awaiting Gemini Response",
    status: "ACTIVE",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const aiResult = await validateSignalWithAI(draftSignal);
  draftSignal.ai_verdict = aiResult.verdict;
  draftSignal.ai_reason = aiResult.reason;
  if (aiResult.verdict === "HIGH_QUALITY") {
    draftSignal.confidence += 20;
  }
  if (draftSignal.confidence >= 70 && aiResult.verdict === "HIGH_QUALITY") {
    await saveSignal(draftSignal);
    await sendTelegramAlert(draftSignal);
    return draftSignal;
  } else {
    console.log(`Signal generated but failed validation: ${aiResult.reason}`);
    return null;
  }
}

// src/backend/scheduler.ts
var isRunning = false;
function startScheduler() {
  import_node_cron.default.schedule("*/60 * * * * *", async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      console.log("Scheduler: Running market scan...");
      const data = await fetchXauUsdData();
      await analyzeMarket(data);
    } catch (error) {
      console.error("Scheduler Error:", error.message);
    } finally {
      isRunning = false;
    }
  });
  console.log("Scheduler started. Running every 60 seconds.");
}

// src/backend/routes.ts
var import_express = require("express");

// src/backend/services/connection.ts
async function checkConnections() {
  const isFirestoreOk = await checkSystemStatus();
  let isMarketOk = false;
  try {
    const data = await fetchXauUsdData();
    isMarketOk = data.length > 0;
  } catch (err) {
    isMarketOk = false;
  }
  return {
    firestore: isFirestoreOk ? "OK" : "ERROR",
    market_data: isMarketOk ? "OK" : "ERROR",
    telegram: process.env.TELEGRAM_BOT_TOKEN ? "CONFIGURED" : "MISSING",
    gemini: process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING",
    gnews: process.env.GNEWS_API_KEY ? "CONFIGURED" : "MISSING",
    twelve_data: process.env.TWELVEDATA_API_KEY ? "CONFIGURED" : "MISSING"
  };
}

// src/backend/routes.ts
var apiRouter = (0, import_express.Router)();
apiRouter.get("/test_connection", async (req, res) => {
  try {
    const status = await checkConnections();
    res.json({ success: true, message: "Connection test executed", data: status });
  } catch (error) {
    res.json({ success: false, message: error.message, data: {} });
  }
});
apiRouter.get("/system/status", async (req, res) => {
  try {
    const status = await checkConnections();
    res.json({ success: true, message: "System is online", data: status });
  } catch (error) {
    res.json({ success: false, message: error.message, data: null });
  }
});
apiRouter.post("/scan", async (req, res) => {
  try {
    const marketData = await fetchXauUsdData();
    const signal = await analyzeMarket(marketData);
    if (!signal) {
      return res.json({ success: true, message: "Scan complete. No valid setup found based on strict PRD rules.", data: null });
    }
    res.json({ success: true, message: "Scan complete. Signal generated.", data: signal });
  } catch (error) {
    res.json({ success: false, message: error.message, data: {} });
  }
});
apiRouter.get("/signals", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const db2 = getFirestoreDb();
    const snap = await db2.collection("signals").orderBy("created_at", "desc").limit(limit).get();
    const data = snap.docs.map((d) => d.data());
    res.json({ success: true, message: "Signals fetched", data });
  } catch (error) {
    res.json({ success: false, message: error.message, data: [] });
  }
});
apiRouter.get("/latest-signal", async (req, res) => {
  try {
    const db2 = getFirestoreDb();
    const snap = await db2.collection("signals").orderBy("created_at", "desc").limit(1).get();
    const data = snap.empty ? null : snap.docs[0].data();
    res.json({ success: true, message: "Latest signal fetched", data });
  } catch (error) {
    res.json({ success: false, message: error.message, data: null });
  }
});
apiRouter.post("/switch_mode", (req, res) => {
  const mode = req.body.mode;
  if (mode === "SCALPING" || mode === "INTRADAY") {
    setMode(mode);
    res.json({ success: true, message: `Mode switched to ${mode}`, data: { mode } });
  } else {
    res.json({ success: false, message: "Invalid mode", data: {} });
  }
});
apiRouter.post("/save_config", (req, res) => {
  res.json({ success: true, message: "Config requires updates in environment variables", data: {} });
});
apiRouter.post("/send_signal", (req, res) => {
  res.json({ success: true, message: "Signal sent feature acts automatically via background scanner.", data: {} });
});

// server.ts
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  app.use(import_express2.default.json());
  app.use("/api", apiRouter);
  startScheduler();
  checkConnections().catch((err) => {
    console.error("Initial connection check failed:", err.message);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
