import cron from "node-cron";
import { fetchXauUsdData } from "./services/twelvedata.js";
import { analyzeMarket } from "./engine/signal.js";

let isRunning = false;

export function startScheduler() {
  // PRD: Interval 60 Seconds
  cron.schedule("*/60 * * * * *", async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      console.log("Scheduler: Running market scan...");
      const data = await fetchXauUsdData();
      await analyzeMarket(data);
    } catch (error: any) {
      console.error("Scheduler Error:", error.message);
    } finally {
      isRunning = false;
    }
  });

  console.log("Scheduler started. Running every 60 seconds.");
}
