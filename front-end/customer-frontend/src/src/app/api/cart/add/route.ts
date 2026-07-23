import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { extractCustomerId } from '@/lib/jwtUtils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const session = await auth();
    const customerId = extractCustomerId(session?.accessToken as string ?? '');
    if (!customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();

    // Strip null/undefined fields so Spring Boot @Valid doesn't reject them
    const payload: Record<string, unknown> = { customerId };
    for (const [k, v] of Object.entries(body)) {
      if (v !== null && v !== undefined) payload[k] = v;
    }

    const data = await apiFetch('http://localhost:8087/cart/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return NextResponse.json(data, { status: 201 });
  });
}
