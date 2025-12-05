const { getChannel } = require("../config/rabbit");
const { logger } = require("../config/logger");

async function publishTransaction(tx) {
  const ch = getChannel();
  const payload = Buffer.from(JSON.stringify(tx));
  await ch.sendToQueue("tx-events", payload, { persistent: true });
  logger.info("Published transaction to RabbitMQ");
}

module.exports = { publishTransaction };
