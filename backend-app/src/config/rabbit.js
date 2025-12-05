const amqp = require("amqplib");
const { logger } = require("./logger");

let channel = null;

async function initRabbitMQ() {
  const url = process.env.RABBIT_URL || "amqp://localhost";
  const conn = await amqp.connect(url);
  channel = await conn.createChannel();

  await channel.assertQueue("tx-events", { durable: true });

  logger.info("RabbitMQ connected & queue tx-events ready");
}

function getChannel() {
  if (!channel) throw new Error("RabbitMQ not initialised yet");
  return channel;
}

module.exports = { initRabbitMQ, getChannel };
