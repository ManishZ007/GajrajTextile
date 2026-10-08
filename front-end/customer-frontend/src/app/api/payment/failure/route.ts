import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const body = await req.json();
    return NextResponse.json(await apiFetch('http://localhost:8088/payment/failure', {
      method: 'POST', body: JSON.stringify(body),
    }));
  });
}
