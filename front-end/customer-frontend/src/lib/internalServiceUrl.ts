// Server-only routing; local IDE development retains the existing localhost URLs.
export function internalServiceUrl(path: string): string {
  if (process.env.DOCKER_INTERNAL_NETWORK !== 'true') return path;
  const url = new URL(path);
  const hosts: Record<string, string> = { '8081': 'authentication', '8082': 'customer', '8083': 'order', '8084': 'worker', '8085': 'manager', '8086': 'owner', '8087': 'product', '8088': 'payment', '8089': 'shipping' };
  if (url.hostname === 'localhost' && hosts[url.port]) url.hostname = hosts[url.port];
  return url.toString();
}
