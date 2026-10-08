import config from "../config/index.js";
import logger from "../config/logger.js";
import { deliverEmail, InvalidEmailEvent } from "../service/EmailService.js";

// Acknowledge only after SMTP accepts the message or RabbitMQ confirms its replacement.
export function confirmedCopy(channel, queue, message, headers) {
  return new Promise((resolve, reject) => {
    channel.sendToQueue(
      queue,
      message.content,
      {
        ...message.properties,
        expiration: undefined,
        persistent: true,
        headers,
      },
      (error) => (error ? reject(error) : resolve()),
    );
  });
}
export function createEmailHandler(channel, deliver = deliverEmail) {
  return async (message) => {
    if (!message) return;
    const headers = message.properties.headers || {};
    const route = headers["x-email-route"] || message.fields.routingKey;
    const attempts = Number(headers["x-email-attempts"] || 0);
    try {
      let data;
      try {
        data = JSON.parse(message.content.toString());
      } catch {
        throw new InvalidEmailEvent("Invalid JSON");
      }
      await deliver(route, data);
      channel.ack(message);
    } catch (error) {
      const permanent =
        error instanceof InvalidEmailEvent ||
        (error.responseCode >= 500 && error.responseCode < 600);
      const exhausted = !Number.isFinite(attempts) || attempts >= 3;
      // Reset links are credentials: discard invalid/expired/exhausted messages instead of retaining them in a failed queue.
      if (route === "email.passwordReset" && (permanent || exhausted)) {
        channel.ack(message);
        logger.warn("Password reset email discarded after invalidity or delivery failure");
        return;
      }
      const destination = `${config.rabbitmq.queue.mail}.${permanent || exhausted ? "failed" : "retry"}`;
      try {
        await confirmedCopy(channel, destination, message, {
          ...headers,
          "x-email-route": route,
          "x-email-attempts": attempts + 1,
        });
        channel.ack(message);
        logger.warn(`Email delivery deferred to ${destination}`);
      } catch {
        // Closing returns every unacknowledged delivery to RabbitMQ; reconnect has backoff.
        logger.error("Email retry could not be persisted; reconnecting");
        await channel.close().catch(() => {});
      }
    }
  };
}
export async function startEmailConsumer(channel) {
  const queue = config.rabbitmq.queue.mail;
  await channel.assertQueue(queue, { durable: true });
  await channel.assertQueue(`${queue}.failed`, { durable: true });
  await channel.assertQueue(`${queue}.retry`, {
    durable: true,
    arguments: {
      "x-message-ttl": 30000,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": queue,
    },
  });
  await channel.bindQueue(queue, config.rabbitmq.exchange, "email.#");
  await channel.prefetch(5);
  await channel.consume(queue, createEmailHandler(channel), { noAck: false });
}
