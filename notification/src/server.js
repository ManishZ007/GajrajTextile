import { smsConfigurationReady } from "./service/SmsService.js";
import logger from "./config/logger.js";
import config from "./config/index.js";
import { createRabbitLifecycle } from "./config/rabbitmq.js";
import app from "./app.js";
import { startSmsConsumer } from "./consumers/sms.consumer.js";
import { startEmailConsumer } from "./consumers/email.consumer.js";

const rabbit = createRabbitLifecycle({ startConsumer: startEmailConsumer });
// Separate connections/channels prevent SMS retries from interrupting email delivery.
const smsRabbit = createRabbitLifecycle({ startConsumer: startSmsConsumer });
app.get("/health", (_req, res) => res.status(rabbit.isReady() && smsRabbit.isReady() ? 200 : 503).json({ emailReady: rabbit.isReady(), smsReady: smsRabbit.isReady() }));
const server = app.listen(config.port, () => logger.info(`Notification Service running on port ${config.port}`));
void rabbit.start();
if (smsConfigurationReady()) void smsRabbit.start();
else logger.warn("SMS consumer paused: configure sandbox API key, sender ID and OTP delivery key, then restart Notification.");
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => { server.close(); await rabbit.stop(); await smsRabbit.stop(); });
}
