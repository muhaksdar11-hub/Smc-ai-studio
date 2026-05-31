import axios from "axios";
import { Signal } from "../../shared/types.js";

export async function sendTelegramAlert(signal: Signal) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram credentials not configured. Skipping alert.");
    return;
  }

  const message = `
🚨 *XAUUSD SIGNAL* 🚨
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
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });
    console.log("Telegram alert sent successfully");
  } catch (error: any) {
    console.error("Failed to send Telegram alert:", error.message);
  }
}
