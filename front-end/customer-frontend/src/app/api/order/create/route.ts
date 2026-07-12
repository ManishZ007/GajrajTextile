import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const body = await req.json();
    const data = await apiFetch('http://localhost:8083/order/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}
