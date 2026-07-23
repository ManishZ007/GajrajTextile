import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  return withApiHandler(async () => {
    const { userId, customerId, ...body } = await req.json();
    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing userId or customerId' }, { status: 400 });
    }

    const data = await apiFetch(
      `http://localhost:8081/auth/updateUser/${userId}/${customerId}`,
      { method: 'PUT', body: JSON.stringify(body) }
    );
    return NextResponse.json(data);
  });
}
