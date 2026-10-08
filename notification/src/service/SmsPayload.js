import { createDecipheriv } from "node:crypto";

export class InvalidSmsEvent extends Error {}
export function decryptLoginOtp(
  envelope,
  keyValue = process.env.OTP_DELIVERY_KEY,
  now = Date.now(),
) {
  try {
    const key = Buffer.from(keyValue || "", "base64");
    if (key.length !== 32) throw new Error();
    if (
      typeof envelope.eventId !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(envelope.eventId)
    )
      throw new Error();
    const iv = Buffer.from(envelope.iv, "base64");
    const encrypted = Buffer.from(envelope.ciphertext, "base64");
    if (iv.length !== 12 || encrypted.length < 17 || encrypted.length > 2048)
      throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(envelope.eventId));
    decipher.setAuthTag(encrypted.subarray(-16));
    const data = JSON.parse(
      Buffer.concat([
        decipher.update(encrypted.subarray(0, -16)),
        decipher.final(),
      ]).toString("utf8"),
    );
    if (
      data.purpose !== "CUSTOMER_LOGIN" ||
      !/^\+91[6-9][0-9]{9}$/.test(data.to) ||
      !/^[0-9]{6}$/.test(data.code) ||
      !Number.isSafeInteger(data.expiresAt) ||
      data.expiresAt <= now ||
      data.expiresAt > now + 310000
    )
      throw new Error();
    return data;
  } catch {
    throw new InvalidSmsEvent("Invalid or expired login SMS");
  }
}
