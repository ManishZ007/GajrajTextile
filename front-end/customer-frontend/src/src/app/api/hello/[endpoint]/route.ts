import { apiFetch } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params;
  const data = await apiFetch(`http://localhost:8081/hello/${endpoint}`);
  return NextResponse.json(data);
}
