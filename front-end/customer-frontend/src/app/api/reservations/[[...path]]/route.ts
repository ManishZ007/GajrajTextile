import { auth } from '@/auth';
import { internalServiceUrl } from '@/lib/internalServiceUrl';

const uuid = '[0-9a-fA-F-]{36}';
async function proxy(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const session = await auth();
  if (!session?.accessToken || session.error) return Response.json({ error: 'Please sign in again' }, { status: 401 });
  const path = ((await context.params).path ?? []).join('/');
  const allowed = request.method === 'GET'
    ? new RegExp(`^(${uuid}(/payments/${uuid}/proof)?)?$`)
    : new RegExp(`^(${uuid}/(payments|cancel))?$`);
  if (!allowed.test(path)) return Response.json({ error: 'Not found' }, { status: 404 });
  if (request.method === 'POST' && request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  try {
    let body: string | undefined;
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length')) > 2900000) return Response.json({ error: 'Screenshot is too large' }, { status: 413 });
      body = await request.text();
      if (body.length > 2900000) return Response.json({ error: 'Screenshot is too large' }, { status: 413 });
    }
    const page = Math.max(0, Math.min(100000, Number(new URL(request.url).searchParams.get('page')) || 0));
    const response = await fetch(internalServiceUrl(`http://localhost:8083/reservations/in-stock${path ? '/' + path : ''}?page=${Math.floor(page)}`), {
      method: request.method, body, cache: 'no-store', signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
    });
    return new Response(await response.arrayBuffer(), { status: response.status, headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return Response.json({ error: 'Reservations are temporarily unavailable. Please retry.' }, { status: 503 }); }
}
export const GET = proxy;
export const POST = proxy;
