import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    console.log('Request received:', req);
    return NextResponse.json({ message: 'Webhook cleared successfully' });
}
