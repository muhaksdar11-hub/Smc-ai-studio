import { Router } from "express";
import { checkConnections } from "./services/connection.js";
import { fetchXauUsdData } from "./services/twelvedata.js";
import { analyzeMarket, setMode } from "./engine/signal.js";
import { getFirestoreDb } from "./services/firestore.js";

export const apiRouter = Router();

apiRouter.get("/test_connection", async (req, res) => {
  try {
    const status = await checkConnections();
    res.json({ success: true, message: "Connection test executed", data: status });
  } catch (error: any) {
    res.json({ success: false, message: error.message, data: {} });
  }
});

apiRouter.get("/system/status", async (req, res) => {
  try {
    const status = await checkConnections();
    res.json({ success: true, message: "System is online", data: status });
  } catch (error: any) {
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
  } catch (error: any) {
    res.json({ success: false, message: error.message, data: {} });
  }
});

apiRouter.get("/signals", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const db = getFirestoreDb();
    const snap = await db.collection("signals").orderBy("created_at", "desc").limit(limit).get();
    const data = snap.docs.map(d => d.data());
    res.json({ success: true, message: "Signals fetched", data });
  } catch (error: any) {
    res.json({ success: false, message: error.message, data: [] });
  }
});

apiRouter.get("/latest-signal", async (req, res) => {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("signals").orderBy("created_at", "desc").limit(1).get();
    const data = snap.empty ? null : snap.docs[0].data();
    res.json({ success: true, message: "Latest signal fetched", data });
  } catch (error: any) {
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
  // Configs are driven by env variables so this is mainly a placeholder
  res.json({ success: true, message: "Config requires updates in environment variables", data: {} });
});

apiRouter.post("/send_signal", (req, res) => {
  res.json({ success: true, message: "Signal sent feature acts automatically via background scanner.", data: {} });
});

