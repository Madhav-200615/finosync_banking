const client = require("prom-client");
const express = require("express");

const metricsRouter = express.Router();

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

function initPrometheus() {
  client.collectDefaultMetrics();
}

metricsRouter.get("/", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = {
  initPrometheus,
  metricsRouter,
  httpRequestCounter
};
