import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  return withApiHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    const data = await apiFetch(`http://localhost:8082/customer/address/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return withApiHandler(async () => {
    const { id } = await params;
    const data = await apiFetch(`http://localhost:8082/customer/address/${id}`, {
      method: 'DELETE',
    });
    return NextResponse.json(data);
  });
}
