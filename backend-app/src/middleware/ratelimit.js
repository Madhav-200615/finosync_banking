const { redisClient } = require("../config/redis");

module.exports = function loginRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const key = `login_attempts:${ip}`;
  const max = 10;
  const windowSec = 60;

  redisClient
    .multi()
    .incr(key)
    .expire(key, windowSec)
    .exec()
    .then(([cnt]) => {
      const attempts = cnt[1];
      if (attempts > max) {
        return res
          .status(429)
          .json({ error: "Too many attempts, try again in a minute" });
      }
      next();
    })
    .catch(next);
};
