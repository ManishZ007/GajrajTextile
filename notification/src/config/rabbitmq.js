import amqp from "amqplib";
import logger from "./logger.js";
import config from "./index.js";

export function createRabbitLifecycle({ connect = amqp.connect, startConsumer, schedule = setTimeout } = {}) {
  let connection, channel, timer, stopped = false, ready = false;
  const retry = () => {
    ready = false;
    if (!stopped && !timer) timer = schedule(() => { timer = null; void start(); }, 5000);
  };
  async function start() {
    if (stopped) return;
    try {
      const current = await connect(config.rabbitmq.url);
      connection = current;
      current.on("error", () => logger.error("RabbitMQ connection error"));
      current.on("close", retry);
      channel = await current.createConfirmChannel();
      channel.on("error", () => logger.error("RabbitMQ channel error"));
      channel.on("close", () => { retry(); void current.close().catch(() => {}); });
      await channel.assertExchange(config.rabbitmq.exchange, "topic", { durable: true });
      await startConsumer(channel);
      ready = true;
      logger.info("RabbitMQ notification consumer ready");
    } catch {
      ready = false;
      if (connection) await connection.close().catch(() => {});
      logger.error("RabbitMQ unavailable; retrying in 5 seconds");
      retry();
    }
  }
  async function stop() {
    stopped = true; ready = false;
    if (timer) clearTimeout(timer);
    if (connection) await connection.close().catch(() => {});
  }
  return { start, stop, isReady: () => ready };
}
