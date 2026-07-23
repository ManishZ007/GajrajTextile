import { apiFetch } from '@/lib/api';
import { withApiHandler } from '@/lib/routeHandler';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/support/:id — fetch single support case
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const { id } = await params;
    const data = await apiFetch(`http://localhost:8085/manager/support/${id}`);
    return NextResponse.json(data);
  });
}
