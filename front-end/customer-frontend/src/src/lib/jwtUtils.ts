/**
 * Decodes the payload of a JWT without verifying the signature.
 * Used server-side to extract claims from the Spring Boot access token.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return {};
  }
}

/**
 * Extracts the customer UUID from the Spring Boot-issued access token.
 * Tries common Spring Boot claim names in priority order.
 */
export function extractCustomerId(accessToken: string): string | null {
  const claims = decodeJwtPayload(accessToken);
  const id =
    (claims.customerId as string | undefined) ??
    (claims.userId as string | undefined) ??
    (claims.user_id as string | undefined) ??
    (claims.sub as string | undefined) ??
    null;
  return id ?? null;
}
