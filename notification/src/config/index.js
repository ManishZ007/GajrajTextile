import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 4000,
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost",
    exchange: process.env.RABBITMQ_EXCHANGE || "notification_exchange",
    queue: {
      mail: "mail_queue",
      sms: "sms_queue",
    },
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-email-password",
  },
};
