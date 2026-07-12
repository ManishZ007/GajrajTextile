import dotenv from "dotenv";
dotenv.config();

import logger from "./config/logger.js";
import { connectionRabbitMQ } from "./config/rabbitmq.js";

import app from "./app.js";
import { startEmailConsumer } from "./consumers/email.consumer.js";

async function startServer() {
  try {
    // connect to rabbitmq
    await connectionRabbitMQ();
    startEmailConsumer();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
