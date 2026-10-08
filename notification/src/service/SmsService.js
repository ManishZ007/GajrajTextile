export class PermanentSmsError extends Error {}

export function createSmsSender({
  fetchImpl = fetch,
  env = process.env,
  now = Date.now,
} = {}) {
  return async (data) => {
    // This adapter is deliberately sandbox-only. A live adapter is a separate deployment decision.
    if (env.NODE_ENV === "production" || env.SMS_PROVIDER !== "zunoy-sandbox")
      throw new PermanentSmsError("SMS sandbox is not enabled");
    const url = new URL(
      env.ZUNOY_SMS_URL || "https://mock-sms.zunoy.com/sms/new/message",
    );
    if (
      url.origin !== "https://mock-sms.zunoy.com" ||
      url.pathname !== "/sms/new/message" ||
      url.search ||
      url.username ||
      url.password
    )
      throw new PermanentSmsError("Invalid sandbox endpoint");
    const key = env.ZUNOY_SMS_API_KEY;
    const senderId = Number(env.ZUNOY_SMS_SENDER_ID);
    if (
      !key ||
      /[\r\n]/.test(key) ||
      !Number.isSafeInteger(senderId) ||
      senderId <= 0
    )
      throw new PermanentSmsError("SMS sandbox credentials are not configured");
    const remainingSeconds = Math.floor((data.expiresAt - now()) / 1000);
    if (remainingSeconds < 10) throw new PermanentSmsError("Login SMS expired");
    // Zunoy's inbox API has no recipient field. Include the target in the sandbox
    // message so developers can identify their test request; no phone receives SMS.
    const response = await fetchImpl(url.toString(), {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(Math.min(8000, remainingSeconds * 1000)),
      headers: { "Content-Type": "application/json", Authorization: key },
      body: JSON.stringify({
        senderId,
        message: `To: ${data.to}\nYour Gajraj Paithani login OTP is ${data.code}. Expires at ${new Date(data.expiresAt).toISOString()}. Do not share this code.`,
      }),
    });
    // Response bodies can contain the OTP, so never log them.
    if (!response.ok) {
      if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429 &&
        response.status !== 408
      )
        throw new PermanentSmsError("SMS sandbox rejected the request");
      throw new Error("SMS sandbox temporarily unavailable");
    }
  };
}
export const sendLoginSms = createSmsSender();

export function smsConfigurationReady(env = process.env) {
  return (
    env.NODE_ENV !== "production" &&
    env.SMS_PROVIDER === "zunoy-sandbox" &&
    Boolean(env.ZUNOY_SMS_API_KEY) &&
    Number.isSafeInteger(Number(env.ZUNOY_SMS_SENDER_ID)) &&
    Number(env.ZUNOY_SMS_SENDER_ID) > 0 &&
    Buffer.from(env.OTP_DELIVERY_KEY || "", "base64").length === 32
  );
}
