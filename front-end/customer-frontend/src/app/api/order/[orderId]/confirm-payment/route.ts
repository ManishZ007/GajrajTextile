import { NextResponse } from 'next/server';

export async function PUT() {
  return NextResponse.json(
    { error: 'Use payment verification to confirm an order.' },
    { status: 410 }
  );
}
