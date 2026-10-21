import { auth } from '@/auth';
import { internalServiceUrl } from '@/lib/internalServiceUrl';
import { NextRequest, NextResponse } from 'next/server';

async function handle(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const session = await auth();
  if (!session?.accessToken || session.error) return NextResponse.json({ error: 'Please sign in to view or submit designs.' }, { status: 401 });
  const path = (await context.params).path ?? [];
  if (path.length > 1 || (path[0] && !/^[a-f0-9-]{36}$/i.test(path[0])) || (req.method === 'POST' && path.length)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const base = process.env.PRODUCT_SERVICE_URL || internalServiceUrl('http://localhost:8087');
    const response = await fetch(`${base.replace(/\/$/, '')}/product/design-requests${path.length ? '/' + path[0] : ''}?page=${encodeURIComponent(req.nextUrl.searchParams.get('page') ?? '0')}`, {
      method: req.method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: req.method === 'POST' ? JSON.stringify(await req.json()) : undefined,
      cache: 'no-store', signal: AbortSignal.timeout(20000),
    });
    return NextResponse.json(await response.json().catch(() => ({ error: 'Unable to process the design request' })), { status: response.status });
  } catch { return NextResponse.json({ error: 'Design service unavailable. Please retry; your request reference will be reused.' }, { status: 503 }); }
}
export const GET = handle;
export const POST = handle;
