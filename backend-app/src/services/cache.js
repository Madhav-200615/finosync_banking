const { redisClient } = require("../config/redis");

async function getCached(key) {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCached(key, value, ttlSec = 60) {
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSec });
}

module.exports = { getCached, setCached };
