import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { startScheduler } from "./src/backend/scheduler.js";
import { apiRouter } from "./src/backend/routes.js";
import { checkConnections } from "./src/backend/services/connection.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API routing
  app.use("/api", apiRouter);

  // Background Scheduler
  startScheduler();

  // Test System Connections on start
  checkConnections().catch(err => {
    console.error("Initial connection check failed:", err.message);
  });

  // Vite middleware for development (React SPA fallback)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
