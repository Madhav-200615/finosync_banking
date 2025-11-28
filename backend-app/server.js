require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");

// Config imports
const { connectMongo } = require("./src/config/mongo");
const { pgPool } = require("./src/config/postgres");
const { redisClient } = require("./src/config/redis");
const { initLogger, logger } = require("./src/config/logger");
const { initPrometheus, metricsRouter } = require("./src/config/prometheus");
const { initRabbitMQ } = require("./src/config/rabbit");
const { initWsServer } = require("./src/services/ws");

// Routes
const authRoutes = require("./src/routes/auth");
const accountRoutes = require("./src/routes/accounts");
const txRoutes = require("./src/routes/transactions");
const analyticsRoutes = require("./src/routes/analytics");
const searchRoutes = require("./src/routes/search");
const transferRoutes = require("./src/routes/transfer");
const statementsRoutes = require("./src/routes/statements");
const fdRoutes = require("./src/routes/fd");
const loanRoutes = require("./src/routes/loan");          // ⭐ NEW LOAN ROUTES
//const cardRoutes = require("./src/routes/cards");         // ⭐ (future)
//const investRoutes = require("./src/routes/investments"); // ⭐ (future)

// Middleware
const metricsMiddleware = require("./src/middleware/metrics");

const app = express();
const server = http.createServer(app);

// ---------------- GLOBAL MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
initLogger(app);
initPrometheus();
app.use(metricsMiddleware);

// ---------------- HEALTH CHECK ----------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------------- API ROUTES ----------------
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", txRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/statements", statementsRoutes);
app.use("/api/fd", fdRoutes);
app.use("/api/loans", loanRoutes);              // ⭐ NEW
//app.use("/api/cards", cardRoutes);              // ⭐ placeholder
//app.use("/api/investments", investRoutes);      // ⭐ placeholder

// Prometheus metrics
app.use("/metrics", metricsRouter);

// ---------------- 404 HANDLER ----------------
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { err: err.stack || err.toString() });
  res.status(500).json({ error: "Internal server error" });
});

// ---------------- START SERVER + SERVICES ----------------
async function start() {
  try {
    logger.info("Starting FastBank backend...");

    await connectMongo();
    logger.info("MongoDB connected");

    await pgPool.connect();
    logger.info("Postgres connected");

    await redisClient.connect();
    logger.info("Redis connected");

    await initRabbitMQ();
    logger.info("RabbitMQ connected");

    // ⭐ Initialize WebSocket server
    initWsServer(server);
    logger.info("WebSocket server started");

    const port = process.env.PORT || 8000;
    server.listen(port, () => {
      logger.info(`Backend listening on port ${port}`);
      console.log(`Backend listening on port ${port}`);
    });

  } catch (err) {
    console.error("Failed to start backend:", err);
    logger.error("Startup failure", { err: err.stack || err.toString() });
    process.exit(1);
  }
}

start();
