const { httpRequestCounter } = require("../config/prometheus");

module.exports = function metrics(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const route = req.route && req.route.path ? req.route.path : req.path;
    httpRequestCounter.inc(
      { method: req.method, route, status: res.statusCode },
      1
    );
  });
  next();
};
