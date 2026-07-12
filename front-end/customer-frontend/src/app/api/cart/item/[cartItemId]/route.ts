import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> }
) {
  return withApiHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { cartItemId } = await params;
    const body = await req.json();

    const data = await apiFetch(`http://localhost:8087/cart/item/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> }
) {
  return withApiHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { cartItemId } = await params;

    const data = await apiFetch(`http://localhost:8087/cart/item/${cartItemId}`, {
      method: 'DELETE',
    });
    return NextResponse.json(data);
  });
}
