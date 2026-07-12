import { getChannel } from "../config/rabbitmq.js";
import index from "../config/index.js";
import logger from "../config/logger.js";
import { sendRegisterEmail } from "../service/EmailService.js";

const exchange = index.rabbitmq.exchange;
const queue = index.rabbitmq.queue.mail;

export const startEmailConsumer = async () => {
  try {
    const channel = getChannel();

    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "email.#");
    logger.info("Email consumer is waiting for email message...");

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());

        try {
          if (msg.fields.routingKey == "email.register") {
            logger.info("Received email request: ", data);

            const payload = {
              to: data.to,
              subject: data.subject,
              name: data.name,
            };

            await sendRegisterEmail(payload);
          } else if (msg.fields.routingKey == "email.orderPlaced") {
            logger.info(`Hello ${data.to} your order is placed`);
          } else {
            logger.info("Unknown email type: ", msg.fields.routingKey);
          }
          channel.ack(msg);
        } catch (error) {
          logger.error("Error sending email: ", error.message);
          channel.ack(msg, false, true);
        }
      }
    });
  } catch (error) {
    logger.error("Email consumer error: ", error.message);
  }
};
