import { apiFetch } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ category: string; endpoint: string }> }
) {
  const { category, endpoint } = await params;
  const data = await apiFetch(`http://localhost:8082/product/category/${category}/${endpoint}`);
  return NextResponse.json(data);
}
