import amqp from "amqplib";
import logger from "./logger.js";
import config from "./index.js";

let channel;

export async function connectionRabbitMQ() {
  try {
    const connection = await amqp.connect(config.rabbitmq.url);

    channel = await connection.createChannel();

    await channel.assertExchange(config.rabbitmq.exchange, "topic", {
      durable: true,
    });
    logger.info(
      `✅ Connected to RabbitMQ, exchange: ${config.rabbitmq.exchange}`
    );

    connection.on("close", () => {
      logger.error("❌ RabbitMQ connection closed! Retrying...");
      setTimeout(connectionRabbitMQ, 5000);
    });
  } catch (error) {
    logger.error("❌ RabbitMQ connection failed: ", error.message);
    setTimeout(connectionRabbitMQ, 5000);
  }
}

export function getChannel() {
  return channel;
}
