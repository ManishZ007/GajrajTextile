import config from "../config/index.js";
import logger from "../config/logger.js";
import { decryptLoginOtp, InvalidSmsEvent } from "../service/SmsPayload.js";
import { sendLoginSms, PermanentSmsError } from "../service/SmsService.js";

export function createSmsHandler(channel, { send = sendLoginSms, decode = decryptLoginOtp, now = Date.now } = {}) {
  return async (message) => {
    if (!message) return;
    let data;
    try {
      if (message.content.length > 4096 || message.fields.routingKey !== "sms.loginOtp" && message.fields.routingKey !== config.rabbitmq.queue.sms)
        throw new InvalidSmsEvent("Invalid SMS route");
      data = decode(JSON.parse(message.content.toString()));
      await send(data);
      channel.ack(message);
    } catch (error) {
      const attempts = Number(message.properties.headers?.["x-sms-attempts"] || 0);
      const remaining = data ? data.expiresAt - now() : 0;
      if (!data || error instanceof InvalidSmsEvent || error instanceof PermanentSmsError ||
          !Number.isInteger(attempts) || attempts < 0 || attempts >= 2 || remaining <= 15000) {
        // No OTP dead-letter archive: discard invalid/expired/exhausted payloads.
        logger.warn("Login SMS discarded (invalid, expired, permanent failure, or retry limit)");
        channel.ack(message);
        return;
      }
      try {
        await new Promise((resolve, reject) => channel.sendToQueue(`${config.rabbitmq.queue.sms}.retry`, message.content, {
          persistent: true, contentType: "application/json", messageId: message.properties.messageId,
          expiration: String(remaining), headers: { "x-sms-attempts": attempts + 1 },
        }, error => error ? reject(error) : resolve()));
        channel.ack(message);
      } catch {
        logger.error("SMS retry not confirmed; reconnecting without acknowledging");
        await channel.close().catch(() => {});
      }
    }
  };
}
export async function startSmsConsumer(channel) {
  const queue = config.rabbitmq.queue.sms;
  await channel.assertQueue(queue, { durable: true });
  await channel.assertQueue(`${queue}.retry`, { durable: true, arguments: {
    "x-message-ttl": 5000, "x-dead-letter-exchange": "", "x-dead-letter-routing-key": queue,
  } });
  await channel.bindQueue(queue, config.rabbitmq.exchange, "sms.loginOtp");
  await channel.prefetch(5);
  await channel.consume(queue, createSmsHandler(channel), { noAck: false });
}
