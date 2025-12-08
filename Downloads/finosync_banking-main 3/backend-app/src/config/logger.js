const path = require("path");
const winston = require("winston");
const expressWinston = require("express-winston");

const logPath = path.join(__dirname, "../../logs/backend.log");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: logPath }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

function initLogger(app) {
  app.use(
    expressWinston.logger({
      winstonInstance: logger,
      meta: true,
      msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
      colorize: false
    })
  );
}

module.exports = { logger, initLogger };
