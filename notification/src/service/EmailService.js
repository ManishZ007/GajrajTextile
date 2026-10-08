import nodemailer from "nodemailer";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import config from "../config/index.js";

const readTemplate = (file) =>
  fs.readFileSync(new URL(`../templates/${file}`, import.meta.url), "utf8");
const layoutTemplate = readTemplate("layout.html");
const registrationTemplates = Object.fromEntries(
  ["CUSTOMER", "WORKER", "MANAGER"].map((role) => [
    role,
    readTemplate(`welcome_${role.toLowerCase()}.html`),
  ]),
);
const resetTemplate = readTemplate("password_reset.html");
const orderPlacedTemplate = readTemplate("order_placed.html");
const logoAttachments = ["logo-mark", "logo-mark-white", "logo-wordmark"].map((cid) => ({
  filename: `${cid}.png`,
  path: fileURLToPath(new URL(`../assets/${cid}.png`, import.meta.url)),
  cid,
}));
const registrationContent = {
  CUSTOMER: {
    subject: "Welcome to Gajraj Paithani",
    body: "Welcome to Gajraj Paithani! We're honored to have you join us.",
  },
  WORKER: {
    subject: "Your worker registration at Gajraj Paithani",
    body: "We have received your worker registration. Registration and verification are separate steps. Your manager will review your details and confirm your verification status. Contact your manager for the next steps and work assignments.",
  },
  MANAGER: {
    subject: "Welcome to the Gajraj Paithani management team",
    body: "Your management account has been created. Sign in to the manager dashboard using your registered email to review customer orders, coordinate workers, and manage inventory according to your assigned permissions.",
  },
};
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: Number(config.email.port) === 465,
  auth: { user: config.email.user, pass: config.email.pass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
});
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const fill = (template, values) =>
  template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.hasOwn(values, key) ? escapeHtml(values[key]) : match,
  );
// Single pass so placeholders inside the already-filled content are never re-expanded.
const page = (content, { title, preheader }) =>
  layoutTemplate.replace(/\{\{(title|preheader|year|content)\}\}/g, (_, key) =>
    key === "content"
      ? content
      : escapeHtml({ title, preheader, year: new Date().getFullYear() }[key]),
  );
export class InvalidEmailEvent extends Error {}
export function renderEmail(route, data) {
  if (
    !data ||
    typeof data.to !== "string" ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.to)
  ) {
    throw new InvalidEmailEvent("A single recipient email is required");
  }
  const name =
    typeof data.name === "string" && data.name.trim()
      ? data.name.trim()
      : "there";
  if (route === "email.passwordReset") {
    let url;
    try { url = new URL(data.resetUrl); } catch { throw new InvalidEmailEvent("Invalid reset link"); }
    if (!Number.isSafeInteger(data.expiresAt) || data.expiresAt <= Date.now()
        || data.expiresAt > Date.now() + 910000
        || url.username || url.password || url.pathname !== "/reset-password"
        || url.search || !/^#token=[A-Za-z0-9_-]{43}$/.test(url.hash)
        || !(url.protocol === "https:" || (url.protocol === "http:"
            && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
      throw new InvalidEmailEvent("Invalid or expired reset email");
    }
    return {
      to: data.to,
      subject: "Reset your Gajraj Paithani password",
      text: `Namaste ${name}, open this link to choose a new password: ${url.href}
This link expires in 15 minutes and can be used once. If you did not request this, ignore this email.`,
      html: page(fill(resetTemplate, { name, resetUrl: url.href }), {
        title: "Reset your password",
        preheader: "Choose a new password for your Gajraj Paithani account.",
      }),
      attachments: logoAttachments,
    };
  }
  if (route === "email.register") {
    // Older registration events did not include a role.
    const role =
      data.role == null ? "CUSTOMER" : String(data.role).trim().toUpperCase();
    const templateRole = role === "OWNER" ? "MANAGER" : role;
    if (!Object.hasOwn(registrationContent, templateRole)) {
      throw new InvalidEmailEvent("Unsupported registration role");
    }
    const content = registrationContent[templateRole];
    return {
      to: data.to,
      subject: content.subject,
      text: `Namaste ${name}, ${content.body}`,
      html: page(
        fill(registrationTemplates[templateRole], { name, siteUrl: config.siteUrl }),
        { title: content.subject, preheader: content.body },
      ),
      attachments: logoAttachments,
    };
  }
  if (route !== "email.orderPlaced")
    throw new InvalidEmailEvent("Unsupported email event");
  if (!data.orderId) throw new InvalidEmailEvent("orderId is required");
  const reference = String(data.orderNumber || data.orderId);
  const text = `Namaste ${name}, your order ${reference} has been placed. Thank you for shopping with Gajraj Paithani.`;
  return {
    to: data.to,
    subject: `Order ${reference} placed`,
    text,
    html: page(
      fill(orderPlacedTemplate, {
        name,
        reference,
        orderUrl: `${config.siteUrl}/orders/${encodeURIComponent(String(data.orderId))}`,
      }),
      { title: `Order ${reference} placed`, preheader: `Your order #${reference} has been placed.` },
    ),
    attachments: logoAttachments,
  };
}
export async function deliverEmail(route, data, transport = transporter) {
  const mail = renderEmail(route, data);
  return transport.sendMail({
    ...mail,
    from:
      process.env.EMAIL_FROM ||
      '"Gajraj Paithani" <notifications@gajrajpaithani.com>',
  });
}
export const sendRegisterEmail = (data) => deliverEmail("email.register", data);
export const sendOrderEmail = (data) => deliverEmail("email.orderPlaced", data);
