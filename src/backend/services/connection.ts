import { fetchXauUsdData } from "./twelvedata.js";
import { checkSystemStatus } from "./firestore.js";

export async function checkConnections() {
  const isFirestoreOk = await checkSystemStatus();
  let isMarketOk = false;
  
  try {
     const data = await fetchXauUsdData();
     isMarketOk = data.length > 0;
  } catch(err) {
     isMarketOk = false;
  }
  
  return {
    firestore: isFirestoreOk ? "OK" : "ERROR",
    market_data: isMarketOk ? "OK" : "ERROR",
    telegram: process.env.TELEGRAM_BOT_TOKEN ? "CONFIGURED" : "MISSING",
    gemini: process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING",
    gnews: process.env.GNEWS_API_KEY ? "CONFIGURED" : "MISSING",
    twelve_data: process.env.TWELVEDATA_API_KEY ? "CONFIGURED" : "MISSING",
  };
}
