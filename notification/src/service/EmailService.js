import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../config/logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// load template once at startup
const welcomeTemplate = fs.readFileSync(
  path.join(__dirname, "..", "templates", "welcome.html"),
  "utf-8",
);

export const sendRegisterEmail = async ({ to, subject, name }) => {
  try {
    const html = welcomeTemplate.replace(/\{\{name\}\}/g, name);

    const info = await transporter.sendMail({
      from: `"Gajraj Paithani" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: `Namaste ${name}, welcome to Gajraj Paithani! We're honored to have you join us.`,
      html,
    });

    logger.info("✉️ Email sent:", info.messageId);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
  }
};

// orders mail

export const sendOrderEmail = async ({ to, subject, body }) => {
  try {
    //:TODO letter
  } catch (error) {
    logger.error("Error sending email: ", error);
  }
};
