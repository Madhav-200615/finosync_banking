const { getChannel } = require("../config/rabbit");
const { logger } = require("../config/logger");
// In real life this might write to analytics warehouse, etc.

async function startConsumer() {
  const ch = getChannel();
  await ch.consume(
    "tx-events",
    (msg) => {
      if (!msg) return;
      const payload = JSON.parse(msg.content.toString());
      logger.info("Consumed tx-event from RabbitMQ", payload);
      ch.ack(msg);
    },
    { noAck: false }
  );
}

module.exports = { startConsumer };
